import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bot, TrendingUp, IndianRupee, ShieldCheck, Clock, CheckCircle2, AlertCircle, PlayCircle, MoreHorizontal } from 'lucide-react';
import { useBotStream, useBotStreamStore } from '../hooks/useBotStream';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Route = createFileRoute('/')({
  component: DashboardOverview,
});

// We will collect live data in state instead of using mock data


function DashboardOverview() {
  const token = api.getToken();
  useBotStream(); // Mount the SSE connection
  
  const events = useBotStreamStore(state => state.events);

  // Fetch all bots to calculate totals
  const { data: bots = [] } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    refetchInterval: 10000 // Poll every 10s as a fallback to SSE
  });

  const activeBotsCount = bots.filter((b: any) => b.status === 'RUNNING').length;
  const stoppedBotsCount = bots.length - activeBotsCount;

  // We can start with a single real data point based on current state
  const chartData = bots.length > 0 ? [
    { 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      running: activeBotsCount, 
      idle: 0, 
      stopped: stoppedBotsCount 
    }
  ] : [];
  
  const fleetProfit = bots.reduce((acc: number, bot: any) => acc + (bot.sessionProfit || 0), 0);
  const totalWins = bots.reduce((acc: number, bot: any) => acc + (bot.sessionWins || 0), 0);
  const totalLosses = bots.reduce((acc: number, bot: any) => acc + (bot.sessionLosses || 0), 0);
  const totalGames = totalWins + totalLosses;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: 'Running', value: activeBotsCount, color: '#10B981' }, // emerald-500
    { name: 'Stopped', value: stoppedBotsCount, color: '#EF4444' }, // red-500
    { name: 'Idle', value: bots.length === 0 ? 1 : 0, color: '#94A3B8' } // slate-400 (mock idle if empty for visualization)
  ].filter(d => d.value > 0);

  const currentDate = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">OVERVIEW</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Fleet Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Real-time overview of all {bots.length || '100+'} automated instances.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-emerald-500 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Data</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">{currentDate}</span>
            <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
              <Clock className="w-4 h-4" />
              <span>Last 24 hours</span>
              <svg className="w-4 h-4 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>12%</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Bots</p>
                <div className="flex items-end space-x-1">
                  <h3 className="text-2xl font-black text-slate-800 leading-none">{activeBotsCount}</h3>
                  <span className="text-sm font-bold text-slate-400 mb-0.5">/{bots.length || 0}</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1">running instances</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>8.4%</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fleet Profit</p>
                <h3 className={`text-2xl font-black leading-none ${fleetProfit >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                  {fleetProfit < 0 ? '-' : ''}₹{Math.abs(fleetProfit).toFixed(2)}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">total session profit</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="absolute right-4 top-4 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>0%</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Win Rate</p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">{winRate}%</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">across all instances</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Healthy</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">System Health</p>
                <h3 className="text-2xl font-black text-slate-800 leading-none">100%</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">all systems operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Global Fleet Activity</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time bot activity over the selected period.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span>{activeBotsCount} Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span>{stoppedBotsCount} Stopped</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <span>0 Idle</span>
              </div>
              <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl shadow-sm md:ml-2">
                <span>Last 24h</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStopped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                  labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="running" name="Running" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRunning)" />
                <Area type="monotone" dataKey="idle" name="Idle" stroke="#94A3B8" strokeWidth={2} fillOpacity={1} fill="url(#colorIdle)" />
                <Area type="monotone" dataKey="stopped" name="Stopped" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorStopped)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center space-x-6 mt-4 text-xs font-bold text-slate-500">
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span>Running</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div><span>Idle</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span>Stopped</span></div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800">Recent Bot Activity</h3>
              </div>
              <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors">
                <span>View All</span>
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Time</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Bot Name</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Event</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-sm">Waiting for live events...</td>
                    </tr>
                  ) : (
                    events.slice(-5).reverse().map((ev, i) => {
                      const isStart = ev.type === 'BOT_STARTED';
                      const isStop = ev.type === 'BOT_STOPPED';
                      const isError = ev.type === 'BOT_ERROR';
                      const botInfo = typeof ev.data === 'object' && ev.data !== null ? (ev.data as any) : {};
                      
                      return (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-2 text-slate-500 font-medium whitespace-nowrap">{new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center space-x-2 font-bold text-slate-800">
                              <div className={`w-2 h-2 rounded-full ${isStart ? 'bg-emerald-500' : isStop ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                              <span>{botInfo.name || `Bot ID: ${ev.botId.substring(0,6)}`}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider
                              ${isStart ? 'bg-emerald-50 text-emerald-600' : isStop ? 'bg-red-50 text-red-600' : isError ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              {isStart && <CheckCircle2 className="w-3 h-3" />}
                              {isStop && <AlertCircle className="w-3 h-3" />}
                              {isError && <AlertCircle className="w-3 h-3" />}
                              {!isStart && !isStop && !isError && <PlayCircle className="w-3 h-3" />}
                              <span>{isStart ? 'Started' : isStop ? 'Stopped' : isError ? 'Error' : 'Event'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-slate-600 truncate max-w-[200px]">
                            {isStart ? 'Instance started successfully' : 
                             isStop ? 'Instance stopped' :
                             JSON.stringify(ev.data)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bot Status Distribution */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center space-x-2 mb-6">
              <Bot className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">Bot Status Distribution</h3>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{bots.length}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Bots</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600, fontSize: '12px', color: '#1E293B' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="font-bold text-slate-700">Running</span>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <span className="text-slate-800">{activeBotsCount}</span>
                  <span className="text-slate-400 w-8 text-right">{bots.length > 0 ? Math.round((activeBotsCount/bots.length)*100) : 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="font-bold text-slate-700">Stopped</span>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <span className="text-slate-800">{stoppedBotsCount}</span>
                  <span className="text-slate-400 w-8 text-right">{bots.length > 0 ? Math.round((stoppedBotsCount/bots.length)*100) : 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <span className="font-bold text-slate-700">Idle</span>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <span className="text-slate-800">0</span>
                  <span className="text-slate-400 w-8 text-right">0%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-indigo-50/50 rounded-xl p-3 flex items-start space-x-3 border border-indigo-100">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black">i</span>
              </div>
              <p className="text-xs text-indigo-600 font-medium">Most bots are idle. Start more instances to increase activity.</p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
