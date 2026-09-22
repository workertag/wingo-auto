import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { Bot, Activity, Wifi, Terminal } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { BotSettingsModal } from '../components/BotSettingsModal';

export const Route = createFileRoute('/bots_/$botId')({
  component: BotDetailsPage,
});

function BotDetailsPage() {
  const { botId } = Route.useParams();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'history'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [balance, setBalance] = useState<number | null>(null);
  const [profit, setProfit] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [dynamicStatus, setDynamicStatus] = useState<string>('STOPPED');

  const { data: bot, isLoading } = useQuery({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const res = await api.request(`/bots/${botId}`);
      return res;
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
    const eventSource = new EventSource('http://localhost:3001/api/stream');
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
        }
      } catch (err) { }
    };
    return () => eventSource.close();
  }, [botId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
              <div className="flex items-center space-x-3 mt-1.5">
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${
                  dynamicStatus === 'RUNNING' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
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
                <span className="text-sm font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{bot.phone}</span>
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
            <div className="glass-card rounded-2xl p-6 border border-slate-200/60">
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Slots</p>
                  <div className="flex flex-col gap-2">
                    {bot.settings?.timeSlots?.map((tId: string) => {
                      const ts = timeSlots?.find((x: any) => x.id === tId);
                      return ts ? (
                        <div key={tId} className="bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 shadow-sm">
                          <span className="font-bold text-slate-800">{ts.name}</span>
                          <span className="text-slate-500 ml-2">({ts.startTime} - {ts.endTime})</span>
                        </div>
                      ) : (
                         <span key={tId} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">{tId.substring(0,8)}...</span>
                      );
                    })}
                    {!bot.settings?.timeSlots?.length && <span className="text-sm text-slate-500 italic">None selected</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Strategies</p>
                  <div className="flex flex-col gap-2">
                    {bot.settings?.strategies?.map((sId: string) => {
                       const st = strategies?.find((x: any) => x.id === sId);
                       
                       // Hack to highlight active level: scan recent logs for e.g. "L2 bet placed"
                       const recentLog = [...logs].reverse().find(l => l.message?.includes('bet placed'));
                       const activeMatch = recentLog?.message?.match(/L(\d+)/);
                       const activeLvl = activeMatch ? parseInt(activeMatch[1], 10) : null;
                       
                       return st ? (
                        <div key={sId} className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 shadow-sm flex flex-col gap-1">
                          <span className="font-bold text-amber-800 text-xs">{st.name}</span>
                          <div className="flex gap-1 flex-wrap mt-1">
                             {st.levels?.map((lvlAmt: number, i: number) => {
                               const isAct = (i + 1) === activeLvl;
                               return (
                                 <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isAct ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-amber-100/50 text-amber-700 border-amber-200/50'}`}>
                                   L{i+1}: ₹{lvlAmt}
                                 </span>
                               );
                             })}
                          </div>
                        </div>
                       ) : (
                        <span key={sId} className="bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-xs font-medium border border-amber-100">{sId.substring(0,8)}...</span>
                       );
                    })}
                    {!bot.settings?.strategies?.length && <span className="text-sm text-slate-500 italic">None selected</span>}
                  </div>
                </div>
              </div>
            </div>
            
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
          </div>

          {/* Right Column: Logs & History Tabs */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl border border-slate-200/60 flex flex-col h-[600px] overflow-hidden">
              
              {/* Tabs Header */}
              <div className="flex border-b border-slate-200/60 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === 'logs' 
                      ? 'text-indigo-600 bg-white border-b-2 border-indigo-500' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Server Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === 'history' 
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
                <div className="flex-1 bg-slate-900 p-4 overflow-y-auto font-mono text-sm">
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
                    <table className="w-full text-left border-collapse">
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
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                bet.betType === 'RED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                bet.betType === 'GREEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>{bet.betType}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">₹{bet.amount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                bet.status === 'WON' ? 'text-emerald-500' :
                                bet.status === 'LOST' ? 'text-rose-500' : 'text-amber-500'
                              }`}>{bet.status}</span>
                            </td>
                            <td className={`px-6 py-4 font-bold ${
                               bet.profit > 0 ? 'text-emerald-500' : bet.profit < 0 ? 'text-rose-500' : 'text-slate-400'
                            }`}>
                              {bet.profit > 0 ? '+' : ''}{bet.profit ? `₹${bet.profit.toFixed(2)}` : '---'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
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
