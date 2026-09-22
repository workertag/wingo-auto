import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Play, Square, Settings, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
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

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bots');
      return res.json();
    }
  });

  const { data: endpoints = [] } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/endpoints', {
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

  const controlBotMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'start' | 'stop' }) => {
      setLoadingBots(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`http://localhost:3001/api/bots/${id}/${action}`, {
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

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bot Instances</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and monitor your 100+ bot instances.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Bot Instance</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 font-medium animate-pulse">Loading bots...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bots.map((bot: any) => (
            <div 
              key={bot.id} 
              onClick={() => navigate({ to: `/bots/${bot.id}` })}
              className="glass-card rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6 border-b border-slate-100 bg-white/40">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl shadow-sm ${bot.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{bot.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                          {bot.wingoPhone}
                        </span>
                        {bot.endpoint && (
                          <div className="flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600">
                            <Wifi className="w-3 h-3" />
                            <span>{bot.endpoint.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${bot.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {bot.status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    <span>{bot.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white/60">
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Profit</p>
                      <p className="text-xl font-black text-slate-800 mt-1">₹0.00</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wins / Losses</p>
                      <p className="text-xl font-black text-slate-800 mt-1">
                         <span className="text-emerald-500">0</span>
                         <span className="text-slate-300 mx-2">/</span>
                         <span className="text-red-500">0</span>
                      </p>
                   </div>
                </div>
                
                <div className="flex space-x-3">
                  {bot.status !== 'RUNNING' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); controlBotMutation.mutate({ id: bot.id, action: 'start' }); }}
                      disabled={loadingBots[bot.id]}
                      className="flex-1 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
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
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/20"
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
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {bots.length === 0 && (
             <div className="col-span-full glass-card p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
                <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No bot instances yet</h3>
                <p className="text-slate-500 mt-2">Create your first bot instance to start automating.</p>
             </div>
          )}
        </div>
      )}

      {/* Add Bot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
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
                  {endpoints.map((ep: any) => (
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

      {selectedBotForSettings && (
        <BotSettingsModal 
          bot={selectedBotForSettings} 
          onClose={() => setSelectedBotForSettings(null)} 
        />
      )}
    </div>
    </AppLayout>
  );
}
