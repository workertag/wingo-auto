import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bot, TrendingUp, IndianRupee, ShieldCheck } from 'lucide-react';
import { useBotStream, useBotStreamStore } from '../hooks/useBotStream';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/')({
  component: DashboardOverview,
});

function DashboardOverview() {
  const token = api.getToken();
  useBotStream(); // Mount the SSE connection
  
  const events = useBotStreamStore(state => state.events);

  // Fetch all bots to calculate totals
  const { data: bots = [] } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    refetchInterval: 10000 // Poll every 10s as a fallback to SSE
  });

  const activeBotsCount = bots.filter((b: any) => b.status === 'RUNNING').length;

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Fleet Dashboard</h1>
        <p className="text-slate-500 mt-1 font-medium">Real-time overview of all 100 automated instances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Bots</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">{activeBotsCount}<span className="text-xl text-slate-400">/{bots.length || 0}</span></h3>
            </div>
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fleet Profit</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">₹0<span className="text-xl text-slate-400">.00</span></h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Win Rate</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">0<span className="text-xl text-slate-400">%</span></h3>
            </div>
            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">System Health</p>
              <h3 className="text-4xl font-black text-emerald-500 mt-2">100<span className="text-xl text-emerald-400/50">%</span></h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden mt-8 border border-white/60">
        <div className="p-6 border-b border-slate-100 bg-white/40 flex items-center space-x-3">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">Global Fleet Activity</h2>
        </div>
        <div className="p-0">
          <div className="h-[400px] overflow-y-auto bg-slate-50/50 p-4">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                <p>Waiting for fleet events via SSE...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
                     <div className={`p-2 rounded-lg ${ev.type === 'BOT_STARTED' ? 'bg-emerald-100 text-emerald-600' : ev.type === 'BOT_ERROR' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {ev.type === 'BOT_STARTED' && <Bot className="w-4 h-4" />}
                        {ev.type === 'BOT_STOPPED' && <Bot className="w-4 h-4 opacity-50" />}
                        {ev.type === 'BOT_ERROR' && <Activity className="w-4 h-4" />}
                     </div>
                     <div>
                       <p className="text-sm font-semibold text-slate-800">{ev.type}</p>
                       <p className="text-xs text-slate-500 mt-0.5 font-mono">{JSON.stringify(ev.data)}</p>
                     </div>
                     <span className="ml-auto text-xs font-bold text-slate-400">
                       {new Date(ev.ts).toLocaleTimeString()}
                     </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
