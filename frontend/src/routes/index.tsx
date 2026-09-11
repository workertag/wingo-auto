import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Play, Square, Settings, Terminal, Shield, LogOut, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    phone: '',
    password: '',
    betBigSmall: true,
    betRedGreen: true,
    maxLevel: 12,
  });

  // Fetch initial state
  useEffect(() => {
    const init = async () => {
      try {
        const [statusReq, settingsReq] = await Promise.all([
          api.getBotStatus(),
          api.getSettings()
        ]);
        
        setIsRunning(statusReq.running);
        
        setForm({
          phone: settingsReq.credentials.phone || '',
          password: settingsReq.credentials.password || '',
          betBigSmall: settingsReq.strategy.BET_BIG_SMALL ?? true,
          betRedGreen: settingsReq.strategy.BET_RED_GREEN ?? true,
          maxLevel: settingsReq.strategy.MAX_LEVEL ?? 12,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Poll for logs and status if running
  useEffect(() => {
    let interval: any;
    
    const poll = async () => {
      try {
        const [logsReq, statusReq] = await Promise.all([
          api.getBotLogs(),
          api.getBotStatus()
        ]);
        setLogs(logsReq.logs);
        setIsRunning(statusReq.running);
      } catch (err) {
        // Silently fail polling
      }
    };

    if (isRunning) {
      poll(); // Immediate poll
      interval = setInterval(poll, 2000);
    } else {
      // Just one final poll to get the exit message
      poll();
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartStop = async () => {
    try {
      if (isRunning) {
        await api.stopBot();
        setIsRunning(false);
      } else {
        await api.startBot();
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
        },
        strategy: {
          BET_BIG_SMALL: form.betBigSmall,
          BET_RED_GREEN: form.betRedGreen,
          ALLOWED_QUALITIES: ["A", "B"],
          BET_TABLE: null,
          MAX_LEVEL: form.maxLevel
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

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings Panel */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-md h-fit">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Configuration</h2>
            </div>
            
            <div className="space-y-5">
              {/* Credentials */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400 flex items-center uppercase tracking-wider">
                  <Shield className="w-4 h-4 mr-2" /> Wingo Account
                </h3>
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
              </div>

              {/* Strategy */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Strategy Options</h3>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300 cursor-pointer select-none">Play Big / Small</label>
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${form.betBigSmall ? 'bg-blue-500' : 'bg-slate-700'}`} onClick={() => setForm({...form, betBigSmall: !form.betBigSmall})}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${form.betBigSmall ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300 cursor-pointer select-none">Play Red / Green</label>
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${form.betRedGreen ? 'bg-blue-500' : 'bg-slate-700'}`} onClick={() => setForm({...form, betRedGreen: !form.betRedGreen})}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${form.betRedGreen ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Max Martingale Level</label>
                  <input 
                    type="number" 
                    value={form.maxLevel}
                    onChange={e => setForm({...form, maxLevel: parseInt(e.target.value) || 12})}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Bot will skip bets if layer exceeds this number.</p>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex justify-center items-center"
              >
                {saved ? <><Check className="w-4 h-4 mr-2" /> Saved!</> : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Terminal Panel */}
          <div className="lg:col-span-2 bg-black rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center">
              <Terminal className="w-4 h-4 text-slate-500 mr-2" />
              <span className="text-xs font-mono text-slate-400">wingo-bot.js — Live Output</span>
            </div>
            <div className="p-4 flex-1 h-[600px] overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for bot to start...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`
                    ${log.includes('✅') ? 'text-emerald-400' : ''}
                    ${log.includes('❌') || log.includes('Error') ? 'text-red-400' : ''}
                    ${log.includes('⚠️') || log.includes('🛑') ? 'text-amber-400' : ''}
                    ${log.includes('📊') ? 'text-blue-400 mt-2' : ''}
                    ${log.includes('================') ? 'text-slate-600' : ''}
                    ${!log.match(/[✅❌⚠️🛑📊=]/) ? 'text-slate-300' : ''}
                  `}>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </div>
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
