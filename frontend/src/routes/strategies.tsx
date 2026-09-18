import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { Plus, Trash2, Target, Settings2, PlusCircle, MinusCircle, Edit2 } from 'lucide-react';

export const Route = createFileRoute('/strategies')({
  component: StrategiesPage,
});

function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const defaultForm = { 
    name: '', minLevel: 1, maxLevel: 20, maxWins: 10, maxLosses: 5, 
    levels: [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960, 81920, 163840, 327680, 655360, 1310720, 2621440, 5242880],
    config: { BET_BIG_SMALL: true, BET_RED_GREEN: true, ALLOWED_QUALITIES: ["A", "B"] }
  };
  const [form, setForm] = useState(defaultForm);

  const fetchStrategies = async () => {
    try {
      const data = await api.getStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStrategy(editingId, form);
      } else {
        await api.createStrategy(form);
      }
      setForm(defaultForm);
      setIsAdding(false);
      setEditingId(null);
      fetchStrategies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (st: any) => {
    setForm({ 
        name: st.name, 
        minLevel: st.minLevel, 
        maxLevel: st.maxLevel, 
        maxWins: st.maxWins, 
        maxLosses: st.maxLosses, 
        levels: st.levels, 
        config: st.config 
    });
    setEditingId(st.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.deleteStrategy(id);
      fetchStrategies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLevelChange = (idx: number, val: number) => {
    const newLevels = [...form.levels];
    newLevels[idx] = val;
    setForm({ ...form, levels: newLevels });
  };

  const addLevel = () => {
    if (form.levels.length >= 20) return;
    const lastVal = form.levels[form.levels.length - 1] || 1;
    setForm({ ...form, levels: [...form.levels, lastVal * 2] });
  };

  const removeLevel = () => {
    if (form.levels.length <= 1) return;
    const newLevels = form.levels.slice(0, -1);
    setForm({ ...form, levels: newLevels, maxLevel: Math.min(form.maxLevel, newLevels.length) });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 relative z-10 min-h-screen bg-transparent">
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Strategies</h1>
          </div>
          <button 
            onClick={() => { setForm(defaultForm); setEditingId(null); setIsAdding(true); }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Strategy
          </button>
        </div>

        {isAdding && (
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-purple-500/30">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Strategy' : 'Create Strategy'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800 pb-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Strategy Name</label>
                  <input 
                    required
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Aggressive Martingale"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Max Wins (Take Profit)</label>
                    <input 
                      required
                      type="number" 
                      value={form.maxWins}
                      onChange={e => setForm({...form, maxWins: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Max Losses (Stop Loss)</label>
                    <input 
                      required
                      type="number" 
                      value={form.maxLosses}
                      onChange={e => setForm({...form, maxLosses: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center">
                      <Settings2 className="w-4 h-4 mr-2 text-purple-400" />
                      Martingale Levels
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Configure bet amounts per loss level.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={removeLevel} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800">
                      {form.levels.length} Levels
                    </span>
                    <button type="button" onClick={addLevel} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {form.levels.map((amt, idx) => (
                    <div key={idx} className="relative group">
                      <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[9px] text-purple-400 font-bold z-10">L{idx + 1}</label>
                      <input 
                        type="number" 
                        value={amt}
                        onChange={e => handleLevelChange(idx, parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-2 py-2 text-center text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-4 mt-4 text-xs">
                  <div className="flex items-center">
                    <span className="text-slate-400 mr-2">Start Level:</span>
                    <select 
                      value={form.minLevel}
                      onChange={e => setForm({...form, minLevel: parseInt(e.target.value)})}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                    >
                      {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-400 mr-2">Max Level Limit:</span>
                    <select 
                      value={form.maxLevel}
                      onChange={e => setForm({...form, maxLevel: parseInt(e.target.value)})}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                    >
                      {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-800">
                <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20">
                  {editingId ? 'Update Strategy' : 'Save Strategy'}
                </button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-slate-500 py-10">Loading...</div>
          ) : strategies.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-800">
              No strategies configured.
            </div>
          ) : (
            strategies.map(st => (
              <div 
                key={st.id} 
                className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg group hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => setExpandedId(expandedId === st.id ? null : st.id)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-white text-lg">{st.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Limits: {st.maxWins}W / {st.maxLosses}L</p>
                  </div>
                  <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(st)} className="text-slate-500 hover:text-purple-400 transition-colors p-1.5 bg-slate-950/50 rounded-lg hover:bg-slate-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(st.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 bg-slate-950/50 rounded-lg hover:bg-slate-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/50">
                    <span>Active Levels</span>
                    <span className="text-white font-mono">L{st.minLevel} - L{st.maxLevel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/50">
                    <span>Base Bet</span>
                    <span className="text-emerald-400 font-mono">₹{st.levels[0]}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Max Bet (L{st.maxLevel})</span>
                    <span className="text-rose-400 font-mono">₹{st.levels[(st.maxLevel || 1) - 1]}</span>
                  </div>
                </div>

                {expandedId === st.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">All Bet Levels</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {st.levels.slice(st.minLevel - 1, st.maxLevel).map((amt: number, idx: number) => (
                        <div key={idx} className="bg-slate-950/50 rounded border border-slate-800/50 p-1.5 text-center">
                          <div className="text-[10px] text-slate-500 mb-0.5">L{idx + (st.minLevel || 1)}</div>
                          <div className="text-xs font-mono text-slate-300">₹{amt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
