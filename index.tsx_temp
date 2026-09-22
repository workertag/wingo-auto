import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Play, Square, Settings, Terminal, Shield, LogOut, Check, TrendingUp, TrendingDown, Activity, History, Plus, Trash2, Save, Wallet, Copy } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import QRCode from 'react-qr-code';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const logout = useAuthStore(state => state.logout);
  
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalWins: 0,
    totalLosses: 0,
    totalEarned: 0,
    currentBalance: null as number | null,
    history: [] as any[],
    depositState: { status: 'IDLE', address: null as string | null, failed: false }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    phone: '',
    password: '',
  });

  const [strategies, setStrategies] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  
  const [schedules, setSchedules] = useState<{ id: number; timeSlotId: string; strategyId: string }[]>([]);
  const [globalOptions, setGlobalOptions] = useState({
    playBigSmall: true,
    playRedGreen: true,
    minDepositBalance: 160,
    depositUsdtAmount: 10,
    depositWaitTime: 5
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [statusReq, settingsReq, stratsReq, timeSlotsReq] = await Promise.all([
          api.getBotStatus(),
          api.getSettings(),
          api.getStrategies(),
          api.getTimeSlots()
        ]);
        
        setIsRunning(statusReq.running);
        setStrategies(stratsReq);
        setTimeSlots(timeSlotsReq);
        
        if (stratsReq.length > 0 && timeSlotsReq.length > 0) {
           setSchedules([{ id: Date.now(), timeSlotId: timeSlotsReq[0].id, strategyId: stratsReq[0].id }]);
        }
        
        setForm({
          phone: settingsReq.credentials?.phone || '',
          password: settingsReq.credentials?.password || '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    let interval: any;
    
    const poll = async () => {
      try {
        const [logsReq, statusReq, statsReq] = await Promise.all([
          api.getBotLogs(),
          api.getBotStatus(),
          api.getBotStats()
        ]);
        // Only update logs if length changed to prevent unnecessary re-renders/scrolls
        if (logsReq.logs.length !== logs.length) {
           setLogs(logsReq.logs);
        }
        setIsRunning(statusReq.running);
        setStats(statsReq);
      } catch (err) {
      }
    };

    if (isRunning) {
      poll();
      interval = setInterval(poll, 2000);
    } else {
      poll();
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  const handleStartStop = async () => {
    try {
      if (isRunning) {
        await api.stopBot();
        setIsRunning(false);
      } else {
        await api.startBot({ schedules, globalOptions });
        setIsRunning(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        credentials: {
          phone: form.phone,
          password: form.password
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalOptionsChange = async (key: string, value: boolean | number) => {
    const newOptions = { ...globalOptions, [key]: value };
    setGlobalOptions(newOptions);
    if (isRunning) {
        try {
            await api.updateBotOptions(newOptions);
        } catch(err) {
            console.error(err);
        }
    }
  };

  const handleRetryDeposit = async () => {
    try {
        const token = useAuthStore.getState().token;
        await fetch('http://localhost:3001/api/bot/retry-deposit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch(err) {
        console.error('Retry deposit error', err);
    }
  };

  const handleAddSchedule = () => {
      setSchedules([...schedules, { id: Date.now(), timeSlotId: timeSlots[0]?.id || '', strategyId: strategies[0]?.id || '' }]);
  };

  const handleRemoveSchedule = (id: number) => {
      setSchedules(schedules.filter(s => s.id !== id));
  };

  const handleScheduleChange = (id: number, field: string, value: string) => {
      setSchedules(schedules.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-transparent text-slate-300 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        <header className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-colors ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
              {isRunning ? <Play fill="currentColor" /> : <Square fill="currentColor" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wingo Automator</h1>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-600'}`} />
                <span>{isRunning ? 'Bot is actively running and placing bets' : 'Bot is offline'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleStartStop}
              className={`px-6 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
                isRunning 
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isRunning ? <><Square className="w-4 h-4 mr-2" /> Stop Bot</> : <><Play className="w-4 h-4 mr-2" /> Start Bot</>}
            </button>
            <button 
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Wins</p>
              <h3 className="text-3xl font-bold text-emerald-400">{stats.totalWins}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Losses</p>
              <h3 className="text-3xl font-bold text-red-400">{stats.totalLosses}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between backdrop-blur-md shadow-lg">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Earned (₹)</p>
              <h3 className={`text-3xl font-bold ${stats.totalEarned >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {stats.totalEarned > 0 ? '+' : ''}{stats.totalEarned.toFixed(2)}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-8">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-md h-fit">
              <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Configuration</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-400 flex items-center uppercase tracking-wider">
                    <Shield className="w-4 h-4 mr-2" /> Wingo Account
                    </h3>
                    {!isRunning && (
                        <button 
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="text-xs flex items-center space-x-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 disabled:opacity-50"
                        >
                            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}</span>
                        </button>
                    )}
                </div>
                {isRunning ? (
                  <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center space-y-1 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider z-10">Live Balance</span>
                    <span className="text-4xl font-bold text-white z-10 font-mono tracking-tight">
                      {stats.currentBalance !== null ? `₹${stats.currentBalance.toFixed(2)}` : 'Loading...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Password</label>
                      <input 
                        type="password" 
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Run Options</h3>
                </div>

                <div className="flex flex-col space-y-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                    <label className="flex items-center space-x-3">
                        <input 
                            type="checkbox" 
                            checked={globalOptions.playBigSmall}
                            onChange={e => handleGlobalOptionsChange('playBigSmall', e.target.checked)}
                            className="w-4 h-4 rounded text-blue-500 bg-slate-900 border-slate-700 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-300">Play Big / Small</span>
                    </label>
                    <label className="flex items-center space-x-3">
                        <input 
                            type="checkbox" 
                            checked={globalOptions.playRedGreen}
                            onChange={e => handleGlobalOptionsChange('playRedGreen', e.target.checked)}
                            className="w-4 h-4 rounded text-blue-500 bg-slate-900 border-slate-700 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-300">Play Red / Green / Violet</span>
                    </label>
                </div>

                <div className="flex justify-between items-center mb-2 mt-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center"><Wallet className="w-4 h-4 mr-2" /> Auto Deposit System</h3>
                </div>

                <div className="flex flex-col space-y-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Minimum Account Balance (₹)</label>
                        <input 
                            type="number"
                            value={globalOptions.minDepositBalance}
                            onChange={e => handleGlobalOptionsChange('minDepositBalance', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Deposit USDT Amount</label>
                        <input 
                            type="number"
                            value={globalOptions.depositUsdtAmount}
                            onChange={e => handleGlobalOptionsChange('depositUsdtAmount', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Wait Time (Minutes)</label>
                        <input 
                            type="number"
                            value={globalOptions.depositWaitTime}
                            onChange={e => handleGlobalOptionsChange('depositWaitTime', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {stats.depositState?.address && (
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center">
                            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Deposit Address</h4>
                            <div className="bg-white p-2 rounded-lg inline-block mb-2">
                                <QRCode value={stats.depositState.address} size={120} />
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <div className="flex-1 bg-slate-900 rounded p-2 text-xs font-mono text-slate-300 break-all text-left border border-slate-700">
                                    {stats.depositState.address}
                                </div>
                                <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(stats.depositState.address!);
                                      // Optional: could use a toast here
                                    }}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                                    title="Copy Address"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            {stats.depositState.status === 'WAITING' && (
                                <div className="mt-2 text-xs text-blue-300 animate-pulse">Waiting for deposit...</div>
                            )}
                        </div>
                    )}
                    
                    {stats.depositState?.failed && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Insufficient Balance</h4>
                            <p className="text-xs text-slate-300 mb-3">The wait time has expired but the balance is still low.</p>
                            <button 
                                onClick={handleRetryDeposit}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors w-full"
                            >
                                Retry Deposit
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center mt-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedules</h4>
                        {!isRunning && (
                            <button onClick={handleAddSchedule} className="text-xs text-blue-400 hover:text-blue-300 flex items-center">
                                <Plus className="w-3 h-3 mr-1" /> Add Schedule
                            </button>
                        )}
                    </div>
                    
                    {schedules.map((s, idx) => (
                        <div key={s.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-3 relative group">
                            {schedules.length > 1 && !isRunning && (
                                <button onClick={() => handleRemoveSchedule(s.id)} className="absolute -top-2 -right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Time Slot</label>
                                <select 
                                    value={s.timeSlotId}
                                    onChange={e => handleScheduleChange(s.id, 'timeSlotId', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    disabled={isRunning}
                                >
                                    <option value="">-- Select Time Slot --</option>
                                    {timeSlots.map(t => <option key={t.id} value={t.id}>{t.name} ({t.startTime} - {t.endTime})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Strategy</label>
                                <select 
                                    value={s.strategyId}
                                    onChange={e => handleScheduleChange(s.id, 'strategyId', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                    disabled={isRunning}
                                >
                                    <option value="">-- Select Strategy --</option>
                                    {strategies.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                </select>
                            </div>
                        </div>
                    ))}
                    {schedules.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-2 bg-slate-950/30 rounded-xl border border-slate-800/50">
                            No schedules defined. Bot will not run.
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-md h-fit">
              <div className="flex items-center space-x-3 mb-4 border-b border-slate-800 pb-4">
                <History className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Recent Games</h2>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                 {stats.history?.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
                      No games played yet in this session.
                    </div>
                 ) : stats.history?.map((game: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                       <div>
                          <div className="text-[10px] text-slate-400 font-mono mb-1 select-all">#{game.issue}</div>
                          <div className="flex items-center space-x-2">
                             <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                               {game.betType}
                             </span>
                             <span className="text-[10px] text-slate-500 font-mono">₹{game.betQuantity}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className={`text-sm font-bold font-mono ${game.won ? 'text-emerald-400' : 'text-red-400'}`}>
                             {game.won ? '+' : ''}{(game.amount || 0).toFixed(2)}
                          </div>
                          <div className={`text-[9px] uppercase font-bold tracking-wider ${game.won ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                             {game.won ? 'WIN' : 'LOSS'}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-md flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Live Terminal Output</h2>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-1 rounded font-medium ${isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            
            <div className="flex-1 bg-[#0d1117] rounded-xl border border-slate-800 p-4 font-mono text-sm overflow-hidden relative shadow-inner">
              <div className="absolute top-2 right-4 text-slate-600 text-[10px] select-none">
                wingo-bot.js
              </div>
              <div 
                ref={logsContainerRef}
                onScroll={handleScroll}
                className="h-[500px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <Terminal className="w-8 h-8 opacity-20" />
                    <p>No output available. Start the bot to see live logs.</p>
                  </div>
                ) : (
                  logs.map((log, i) => {
                    const isError = log.includes('error') || log.includes('Failed') || log.includes('❌') || log.includes('⚠️');
                    const isSuccess = log.includes('✅') || log.includes('🟢') || log.includes('won') || log.includes('WON');
                    
                    return (
                      <div key={i} className={`font-mono break-all leading-tight ${
                        isError ? 'text-rose-400' : 
                        isSuccess ? 'text-emerald-400' : 
                        'text-slate-300'
                      }`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
