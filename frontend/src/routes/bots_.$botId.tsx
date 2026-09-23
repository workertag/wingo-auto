import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { Bot, Activity, Wifi, Terminal } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { BotSettingsModal } from '../components/BotSettingsModal';
import { Wallet, X } from 'lucide-react';
import QRCode from 'react-qr-code';

export const Route = createFileRoute('/bots_/$botId')({
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { botId } = Route.useParams();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'history'>('logs');

  // Auto Deposit State
  const [autoDeposit, setAutoDeposit] = useState({
    enabled: false,
    minBalance: 160,
    depositAmount: 10,
    waitTime: 5
  });
  const [hasUnsavedAutoDeposit, setHasUnsavedAutoDeposit] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [balance, setBalance] = useState<number | null>(null);
  const [profit, setProfit] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [dynamicStatus, setDynamicStatus] = useState<string>('STOPPED');

  const [depositState, setDepositState] = useState({ status: 'IDLE', address: null as string | null, failed: false });
  const [depositTimer, setDepositTimer] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (depositState.status === 'WAITING' && depositTimer > 0) {
      interval = setInterval(() => {
        setDepositTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [depositState.status, depositTimer]);

  const { data: bot, isLoading } = useQuery({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const b = await api.request(`/bots/${botId}`);
      if (b.settings?.autoDeposit) {
        setAutoDeposit(b.settings.autoDeposit);
        setHasUnsavedAutoDeposit(false);
      }
      return b;
    },
    refetchInterval: 5000
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const currentSettings = bot?.settings || {};
      const res = await api.request(`/bots/${botId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: { ...currentSettings, ...newSettings } })
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      setHasUnsavedAutoDeposit(false);
    }
  });

  const handleAutoDepositChange = (field: string, value: any) => {
    setAutoDeposit(prev => ({ ...prev, [field]: value }));
    setHasUnsavedAutoDeposit(true);
  };

  const cancelDepositMutation = useMutation({
    mutationFn: async () => {
      await api.request(`/bots/${botId}/cancel-deposit`, { method: 'POST' });
    },
    onSuccess: () => {
      setDepositState({ status: 'IDLE', address: null, failed: false });
    }
  });

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['botHistory', botId],
    queryFn: () => api.getBotInstanceHistory(botId)
  });

  const { data: timeSlots } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => api.request('/time-slots')
  });

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => api.request('/strategies')
  });

  useEffect(() => {
    // Fetch initial logs from backend
    api.getBotInstanceLogs(botId).then(data => {
      if (Array.isArray(data)) {
        setLogs(data.reverse()); // redis lrange returns newest first if we pushed, wait lpush means index 0 is newest. So reverse to put oldest first (top to bottom)
      }
    });
  }, [botId]);

  useEffect(() => {
    if (bot) {
      setDynamicStatus(bot.status);
      setBalance(bot.currentBalance || 0);
      setWins(bot.sessionWins || 0);
      setLosses(bot.sessionLosses || 0);
      // We don't have sessionProfit field, so we'll calculate from history or just use 0 if they want session profit.
      // Actually we can sum up the profit from historyData if available.
    }
  }, [bot]);

  useEffect(() => {
    if (historyData) {
      const totalProfit = historyData.reduce((sum: number, bet: any) => sum + (bet.profit || 0), 0);
      setProfit(totalProfit);
    }
  }, [historyData]);

  // Specific SSE listener for this bot
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.botId === botId) {
          if (data.type === 'LOG') {
            setLogs(prev => [...prev, data].slice(-100)); // keep last 100 logs
          }
          if (data.type === 'BOT_STARTED') setDynamicStatus('RUNNING');
          if (data.type === 'BOT_STOPPED') setDynamicStatus('STOPPED');

          if (data.type === 'BALANCE_UPDATE') {
            setBalance(data.data.balance);
          }
          if (data.type === 'BET_RESOLVED') {
            setProfit(prev => prev + data.data.amount);
            if (data.data.won) setWins(prev => prev + 1);
            else setLosses(prev => prev + 1);
            refetchHistory(); // Refresh history table
          }
          if (data.type === 'DEPOSIT_UPDATE') {
            setDepositState(prev => ({ ...prev, ...data.data }));
            if (data.data.status === 'WAITING') {
              // Reset timer to autoDeposit.waitTime minutes
              setDepositTimer((autoDeposit.waitTime || 5) * 60);
            }
          }
        }
      } catch (err) { }
    };
    return () => eventSource.close();
  }, [botId]);

  useEffect(() => {
    const container = document.getElementById('logs-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  if (isLoading) return <AppLayout><div className="p-8 text-slate-500">Loading bot details...</div></AppLayout>;
  if (!bot) return <AppLayout><div className="p-8 text-red-500">Bot not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Header */}
        <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/60 shadow-xl shadow-slate-200/50">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-xl shadow-sm ${dynamicStatus === 'RUNNING' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{bot.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${dynamicStatus === 'RUNNING' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                  {dynamicStatus === 'RUNNING' ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Running</span>
                    </span>
                  ) : (
                    <span>Stopped</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center space-x-1.5">
                  <span>{bot.phone}</span>
                </span>
                {bot.endpoint ? (
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center space-x-1.5 shadow-sm" title="Connected via Proxy">
                    <Wifi className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                    <span>Proxy: {bot.endpoint.host}</span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center space-x-1.5" title="Direct Connection (No Proxy)">
                    <Wifi className="w-3.5 h-3.5 opacity-50" />
                    <span>Direct IP</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {dynamicStatus === 'RUNNING' ? (
              <button
                onClick={async () => {
                  setDynamicStatus('STOPPING');
                  await api.request(`/bots/${bot.id}/stop`, { method: 'POST' });
                }}
                disabled={dynamicStatus === 'STOPPING'}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-rose-500/30 active:scale-95 disabled:opacity-50"
              >
                {dynamicStatus === 'STOPPING' ? 'Stopping...' : 'Stop Bot'}
              </button>
            ) : (
              <button
                onClick={async () => {
                  setDynamicStatus('STARTING');
                  await api.request(`/bots/${bot.id}/start`, { method: 'POST' });
                }}
                disabled={dynamicStatus === 'STARTING'}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/30 active:scale-95 disabled:opacity-50"
              >
                {dynamicStatus === 'STARTING' ? 'Starting...' : 'Start Bot'}
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
              Configure Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Settings Summary */}
          <div className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-slate-200/60 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <h3 className="font-bold text-sm mb-1 text-indigo-100">Session Profit</h3>
                <p className="text-2xl font-black mb-3">₹{profit.toFixed(2)}</p>
                <div className="flex justify-between items-center text-indigo-100">
                  <span className="text-xs font-medium">W / L</span>
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full text-xs">{wins} / {losses}</span>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-200/60 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <h3 className="font-bold text-sm mb-1 text-emerald-100">Wallet Balance</h3>
                <p className="text-2xl font-black mb-3">{balance !== null ? `₹${balance.toFixed(2)}` : '---'}</p>
                <div className="flex justify-between items-center text-emerald-100">
                  <span className="text-xs font-medium">Status</span>
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full text-xs">Live</span>
                </div>
              </div>
            </div>

            {/* Auto Deposit System */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/60 shadow-xl relative overflow-hidden">

              <div className="flex flex-wrap gap-4 justify-between items-center mb-6 relative z-10">
                <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2 tracking-wide uppercase">
                  <Wallet className="w-5 h-5 text-indigo-500" />
                  <span className="font-black">AUTO DEPOSIT SYSTEM</span>
                </h3>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoDeposit.enabled}
                    onChange={(e) => handleAutoDepositChange('enabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                </label>
              </div>

              {depositState.status === 'IDLE' ? (
                <div className="space-y-4 relative z-10">
                  <div className="bg-slate-50 rounded-3xl p-1 px-2 border border-slate-200 focus-within:border-indigo-500/50 transition-colors shadow-inner">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-4 pt-3">Minimum Account Balance (₹)</label>

                    <input
                      type="number"
                      value={autoDeposit.minBalance}
                      onChange={(e) => handleAutoDepositChange('minBalance', Number(e.target.value))}
                      className="w-full bg-transparent border-none text-slate-900 font-bold text-lg px-4 pb-3 pt-1 focus:ring-0 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-1 px-2 border border-slate-200 focus-within:border-indigo-500/50 transition-colors shadow-inner">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-4 pt-3">Deposit USDT Amount</label>
                    <input
                      type="number"
                      value={autoDeposit.depositAmount}
                      onChange={(e) => handleAutoDepositChange('depositAmount', Number(e.target.value))}
                      className="w-full bg-transparent border-none text-slate-900 font-bold text-lg px-4 pb-3 pt-1 focus:ring-0 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-1 px-2 border border-slate-200 focus-within:border-indigo-500/50 transition-colors shadow-inner">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-4 pt-3">Wait Time (Minutes)</label>
                    <input
                      type="number"
                      value={autoDeposit.waitTime}
                      onChange={(e) => handleAutoDepositChange('waitTime', Number(e.target.value))}
                      className="w-full bg-transparent border-none text-slate-900 font-bold text-lg px-4 pb-3 pt-1 focus:ring-0 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => saveSettingsMutation.mutate({ autoDeposit })}
                    disabled={saveSettingsMutation.isPending || !hasUnsavedAutoDeposit}
                    className={`w-full mt-6 py-3.5 rounded-3xl font-bold text-lg transition-all shadow-lg ${hasUnsavedAutoDeposit
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                      : 'bg-indigo-600/50 text-white/80 shadow-none cursor-not-allowed'
                      }`}
                  >
                    {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 relative z-10 flex flex-col items-center pt-2">
                  <button
                    onClick={() => cancelDepositMutation.mutate()}
                    className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    title="Cancel Deposit Flow"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {depositState.address ? (
                    <div className="flex flex-col items-center w-full">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 inline-block">
                        <QRCode value={depositState.address} size={180} />
                      </div>

                      <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-700 truncate flex-1 select-all">{depositState.address}</span>
                        <button
                          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(depositState.address!);
                            alert("Address copied!");
                          }}
                        >
                          Copy
                        </button>
                      </div>

                      {depositState.status === 'WAITING' && (
                        <div className="mt-5 text-center">
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Time Remaining</p>
                          <p className="text-3xl font-black text-indigo-600 font-mono">
                            {Math.floor(depositTimer / 60).toString().padStart(2, '0')}:{(depositTimer % 60).toString().padStart(2, '0')}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">Waiting for payment reflection...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center">
                      {depositState.status === 'NAVIGATING' && (
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-sm font-bold text-indigo-500 animate-pulse">Navigating to deposit screen...</p>
                        </div>
                      )}
                      {depositState.failed && (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <p className="text-sm font-bold text-red-500">Deposit flow failed!</p>
                          <p className="text-xs text-red-400 mt-1">Please check the logs for details.</p>
                          <button
                            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            onClick={() => setDepositState({ status: 'IDLE', address: null, failed: false })}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Logs & History Tabs */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl border border-slate-200/60 flex flex-col h-[600px] overflow-hidden">

              {/* Tabs Header */}
              <div className="flex border-b border-slate-200/60 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${activeTab === 'logs'
                    ? 'text-indigo-600 bg-white border-b-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Server Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${activeTab === 'history'
                    ? 'text-indigo-600 bg-white border-b-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Bet History</span>
                </button>
              </div>

              {/* Tab Content: Logs */}
              {activeTab === 'logs' && (
                <div id="logs-container" className="flex-1 bg-slate-900 p-4 overflow-y-auto font-mono text-sm scroll-smooth">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      Waiting for events...
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {logs.map((log, i) => (
                        <div key={i} className="flex space-x-3 text-slate-300">
                          <span className="text-slate-500 whitespace-nowrap">
                            [{typeof log.ts === 'string' ? log.ts.split(' ')[1] : new Date(log.ts || Date.now()).toLocaleTimeString()}]
                          </span>
                          {log.type === 'LOG' ? (
                            <span>{log.msg}</span>
                          ) : (
                            <span className={log.type === 'BOT_ERROR' ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              [{log.type}] {JSON.stringify(log.data || log.error)}
                            </span>
                          )}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: History */}
              {activeTab === 'history' && (
                <div className="flex-1 overflow-y-auto bg-white p-0">
                  {!historyData || historyData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                      No bet history available.
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyData.map((bet: any) => (
                          <tr key={bet.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{bet.issue}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${bet.betType === 'RED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                bet.betType === 'GREEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>{bet.betType}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">₹{bet.amount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold uppercase tracking-wider ${bet.status === 'WON' ? 'text-emerald-500' :
                                bet.status === 'LOST' ? 'text-rose-500' : 'text-amber-500'
                                }`}>{bet.status}</span>
                            </td>
                            <td className={`px-6 py-4 font-bold ${bet.profit > 0 ? 'text-emerald-500' : bet.profit < 0 ? 'text-rose-500' : 'text-slate-400'
                              }`}>
                              {bet.profit > 0 ? '+' : ''}{bet.profit ? `₹${bet.profit.toFixed(2)}` : '---'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Width Row: Active Configuration */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200/60 mt-6">
          <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Active Configuration</span>
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Games</p>
              <div className="flex flex-wrap gap-2">
                {bot.settings?.games?.map((g: string) => (
                  <span key={g} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-xs font-bold border border-indigo-100">{g === 'B/S' ? 'Big/Small' : 'Red/Green'}</span>
                ))}
                {!bot.settings?.games?.length && <span className="text-sm text-slate-500 italic">None selected</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Schedules</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bot.settings?.schedules?.map((schedule: any, idx: number) => {
                  const ts = timeSlots?.find((x: any) => x.id === schedule.timeSlotId);
                  const st = strategies?.find((x: any) => x.id === schedule.strategyId);

                  let isScheduleActive = false;
                  if (ts && ts.startTime && ts.endTime) {
                    const now = new Date();
                    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    if (ts.startTime <= ts.endTime) {
                      isScheduleActive = time >= ts.startTime && time <= ts.endTime;
                    } else {
                      isScheduleActive = time >= ts.startTime || time <= ts.endTime;
                    }
                  }

                  // Hack to highlight active level: scan recent logs for e.g. "L2 bet placed"
                  const recentLog = [...logs].reverse().find(l => (l.msg || l.message || '').includes('bet placed'));
                  const activeMatch = (recentLog?.msg || recentLog?.message || '').match(/L(\d+)/);
                  const activeLvl = activeMatch ? parseInt(activeMatch[1], 10) : null;

                  return (
                    <div key={schedule.id || idx} className={`bg-slate-50 border shadow-sm rounded-xl overflow-hidden transition-all ${isScheduleActive ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-slate-200'}`}>
                      <div className={`px-3 py-2 border-b flex justify-between items-center ${isScheduleActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100/50 border-slate-200'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Time Slot:</span>
                          <span className="text-xs font-medium text-slate-900">{ts ? `${ts.name} (${ts.startTime}-${ts.endTime})` : 'Unknown'}</span>
                        </div>
                        {isScheduleActive && (
                          <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">Live</span>
                        )}
                      </div>
                      <div className="px-3 py-3">
                        <span className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1.5 block">Strategy: <span className="text-amber-700 capitalize">{st ? st.name : 'Unknown'}</span></span>
                        {st && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {st.levels?.map((lvlAmt: number, i: number) => {
                              if (!lvlAmt || lvlAmt === 0) return null;
                              const isAct = (i + 1) === activeLvl;
                              return (
                                <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isAct ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  L{i + 1}: ₹{lvlAmt}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!bot.settings?.schedules || bot.settings.schedules.length === 0) && (
                  <span className="col-span-full text-sm text-slate-500 italic p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl block text-center">No schedules active</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {showSettings && (
        <BotSettingsModal bot={bot} onClose={() => setShowSettings(false)} />
      )}
    </AppLayout>
  );
}
