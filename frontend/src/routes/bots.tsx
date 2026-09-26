import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Settings, Play, Square, Activity, IndianRupee, ShieldCheck, TrendingUp, Wifi, Trash2, Search, MoreVertical, BarChart2, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { BotSettingsModal } from '../components/BotSettingsModal';

export const Route = createFileRoute('/bots')({
  component: BotsPage,
});

function BotsPage() {
  const token = api.getToken();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBotForSettings, setSelectedBotForSettings] = useState<any>(null);
  const [loadingBots, setLoadingBots] = useState<Record<string, boolean>>({});
  const [newBot, setNewBot] = useState({ name: '', wingoPhone: '', wingoPassword: '', endpointId: '' });
  const [editingBot, setEditingBot] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getUptimeString = (bot: any) => {
    if (bot.status !== 'RUNNING') return '-';
    const startedAt = bot.settings?.startedAt || (bot.updatedAt ? new Date(bot.updatedAt).getTime() : Date.now());
    
    const diff = Math.floor((now - startedAt) / 60000);
    if (diff < 0) return '< 1m';
    if (diff < 1) return '< 1m';
    
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bots');
      return res.json();
    }
  });

  const { data: endpoints = [] } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await fetch('/api/endpoints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const addBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      const res = await api.request('/bots', {
        method: 'POST',
        body: JSON.stringify(botData)
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setShowAddModal(false);
      setNewBot({ name: '', wingoPhone: '', wingoPassword: '', endpointId: '' });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const editBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      const res = await api.request(`/bots/${botData.id}`, {
        method: 'PUT',
        body: JSON.stringify(botData)
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setEditingBot(null);
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete bot');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    }
  });

  const controlBotMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'start' | 'stop' }) => {
      setLoadingBots(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`/api/bots/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to ${action} bot`);
      return { id, action, data: await res.json() };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      // In a real app we'd wait for SSE to confirm RUNNING, but for immediate UX:
      setTimeout(() => setLoadingBots(prev => ({ ...prev, [result.id]: false })), 1000);
    },
    onError: (err, variables) => {
      setLoadingBots(prev => ({ ...prev, [variables.id]: false }));
      alert(err.message);
    }
  });

  const runningCount = bots.filter((b: any) => b.status === 'RUNNING').length;
  const stoppedCount = bots.length - runningCount;
  const totalProfit = bots.reduce((acc: number, b: any) => acc + (b.sessionProfit || 0), 0);

  const filteredBots = bots.filter((bot: any) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bot.wingoPhone?.includes(searchTerm);
    const matchesFilter = filter === 'all' ? true :
                          filter === 'running' ? bot.status === 'RUNNING' :
                          bot.status !== 'RUNNING';
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MANAGEMENT</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bot Instances</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Manage and monitor your 100+ bot instances. Start, stop or configure each bot easily.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bot Instance</span>
          </button>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Instances</p>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-black text-slate-800 leading-none">{bots.length}</span>
                <span className="text-xs font-medium text-slate-500 mb-0.5">Manage all your bots</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Running</p>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-black text-slate-800 leading-none">{runningCount}</span>
                <span className="text-xs font-medium text-slate-500 mb-0.5">Bots are active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <Square className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Stopped</p>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-black text-slate-800 leading-none">{stoppedCount}</span>
                <span className="text-xs font-medium text-slate-500 mb-0.5">Bots are inactive</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Session Profit</p>
              <div className="flex items-end space-x-2">
                <span className={`text-2xl font-black leading-none ${totalProfit >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                  {totalProfit < 0 ? '-' : ''}₹{Math.abs(totalProfit).toFixed(2)}
                </span>
                <span className="text-xs font-medium text-slate-500 mb-0.5">Across all instances</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar (Search + Filters) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search bot instances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <span>All</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'all' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>{bots.length}</span>
            </button>
            <button 
              onClick={() => setFilter('running')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'running' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'running' ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
              <span>Running</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'running' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{runningCount}</span>
            </button>
            <button 
              onClick={() => setFilter('stopped')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-semibold text-sm border ${filter === 'stopped' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'stopped' ? 'bg-slate-500' : 'bg-slate-400'}`} />
              <span>Stopped</span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${filter === 'stopped' ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>{stoppedCount}</span>
            </button>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-slate-500 py-10 font-medium">Loading bots...</div>
          ) : filteredBots.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
               <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-700">No bots found</h3>
               <p className="text-slate-500 mt-2">Adjust your filters or create a new bot instance.</p>
            </div>
          ) : (
            filteredBots.map((bot: any) => (
              <div 
                key={bot.id} 
                onClick={() => navigate({ to: `/bots/${bot.id}` })}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer group relative"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-slate-100/80 rounded-2xl flex items-center justify-center text-slate-600">
                      <Bot className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{bot.name}</h3>
                      <p className="text-xs font-semibold text-indigo-500/70 mb-1">{bot.wingoPhone || 'No Phone'}</p>
                      {bot.endpoint && (
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                          <Wifi className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{bot.endpoint.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${bot.status === 'RUNNING' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${bot.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${bot.status === 'RUNNING' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {bot.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBot({
                            id: bot.id,
                            name: bot.name || '',
                            wingoPhone: bot.wingoPhone || '',
                            wingoPassword: '',
                            endpointId: bot.endpointId || ''
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors mr-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
                            deleteBotMutation.mutate(bot.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Session Profit</p>
                    <p className={`text-lg font-black ${(bot.sessionProfit || 0) >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                      {(bot.sessionProfit || 0) < 0 ? '-' : ''}₹{Math.abs(bot.sessionProfit || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Wins / Losses</p>
                    <p className="text-lg font-black text-slate-800">
                      <span className="text-emerald-500">{bot.sessionWins || 0}</span>
                      <span className="text-slate-300 mx-1.5">/</span>
                      <span className="text-red-500">{bot.sessionLosses || 0}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uptime</p>
                    <p className="text-lg font-black text-slate-800">
                      {getUptimeString(bot)}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {bot.status !== 'RUNNING' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); controlBotMutation.mutate({ id: bot.id, action: 'start' }); }}
                      disabled={loadingBots[bot.id]}
                      className="flex-1 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-emerald-500/20 text-sm"
                    >
                      {loadingBots[bot.id] ? (
                        <span>Queued...</span>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Bot</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); controlBotMutation.mutate({ id: bot.id, action: 'stop' }); }}
                      disabled={loadingBots[bot.id]}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {loadingBots[bot.id] ? (
                        <span>Stopping...</span>
                      ) : (
                        <>
                          <Square className="w-4 h-4 fill-current" />
                          <span>Stop Bot</span>
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedBotForSettings(bot); }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Tip */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between mt-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-500 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Tip</h4>
              <p className="text-sm text-slate-500 font-medium">Run multiple bot instances with different proxies and strategies to maximize your chances.</p>
            </div>
          </div>
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center space-x-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span>Learn more</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>

      {/* Add Bot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">New Bot Instance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Instance Name</label>
                <input
                  type="text"
                  value={newBot.name}
                  onChange={e => setNewBot({...newBot, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="e.g. Bot 001 - VIP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Wingo Phone Number</label>
                <input
                  type="text"
                  value={newBot.wingoPhone}
                  onChange={e => setNewBot({...newBot, wingoPhone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="9876543210"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Wingo Password</label>
                <input
                  type="password"
                  value={newBot.wingoPassword}
                  onChange={e => setNewBot({...newBot, wingoPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Assign Proxy (Optional)</label>
                <select
                  value={newBot.endpointId}
                  onChange={e => setNewBot({...newBot, endpointId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                >
                  <option value="">-- No Proxy (Direct) --</option>
                  {endpoints.filter((ep: any) => !bots.some((b: any) => b.endpointId === ep.id)).map((ep: any) => (
                    <option key={ep.id} value={ep.id}>{ep.name} ({ep.host})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addBotMutation.mutate({ ...newBot, userId: '1' /* Needs proper auth context in prod */ })}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors"
                disabled={addBotMutation.isPending}
              >
                {addBotMutation.isPending ? 'Creating...' : 'Create Instance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bot Modal */}
      {editingBot && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Bot Instance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Instance Name</label>
                <input
                  type="text"
                  value={editingBot.name}
                  onChange={e => setEditingBot({...editingBot, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="e.g. Bot 001 - VIP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Wingo Phone Number</label>
                <input
                  type="text"
                  value={editingBot.wingoPhone}
                  onChange={e => setEditingBot({...editingBot, wingoPhone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="9876543210"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Wingo Password (Leave blank to keep unchanged)</label>
                <input
                  type="password"
                  value={editingBot.wingoPassword}
                  onChange={e => setEditingBot({...editingBot, wingoPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Assign Proxy (Optional)</label>
                <select
                  value={editingBot.endpointId}
                  onChange={e => setEditingBot({...editingBot, endpointId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                >
                  <option value="">-- No Proxy (Direct) --</option>
                  {endpoints.filter((ep: any) => !bots.some((b: any) => b.endpointId === ep.id && b.id !== editingBot.id)).map((ep: any) => (
                    <option key={ep.id} value={ep.id}>{ep.name} ({ep.host})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setEditingBot(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => editBotMutation.mutate(editingBot)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors"
                disabled={editBotMutation.isPending}
              >
                {editBotMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBotForSettings && (
        <BotSettingsModal 
          bot={selectedBotForSettings} 
          onClose={() => setSelectedBotForSettings(null)} 
        />
      )}
    </AppLayout>
  );
}
