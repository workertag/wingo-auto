import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Target, Settings2, PlusCircle, MinusCircle, Edit2 } from 'lucide-react';
import { AppLayout } from '../components/Layout';

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Strategies</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure martingale levels and bot parameters.</p>
        </div>
        <button 
          onClick={() => { setForm(defaultForm); setEditingId(null); setIsAdding(true); }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>New Strategy</span>
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Edit Strategy' : 'Create Strategy'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Strategy Name</label>
                <input 
                  required
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g. Aggressive Martingale"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Max Wins (Take Profit)</label>
                  <input 
                    required
                    type="number" 
                    value={form.maxWins}
                    onChange={e => setForm({...form, maxWins: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Max Losses (Stop Loss)</label>
                  <input 
                    required
                    type="number" 
                    value={form.maxLosses}
                    onChange={e => setForm({...form, maxLosses: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Settings2 className="w-4 h-4 mr-2 text-indigo-500" />
                    Martingale Levels
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Configure bet amounts per loss level.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={removeLevel} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 font-semibold shadow-sm">
                    {form.levels.length} Levels
                  </span>
                  <button type="button" onClick={addLevel} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {form.levels.map((amt, idx) => (
                  <div key={idx} className="relative group">
                    <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-indigo-600 font-bold z-10 shadow-sm rounded-sm">L{idx + 1}</label>
                    <input 
                      type="number" 
                      value={amt}
                      onChange={e => handleLevelChange(idx, parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 text-center text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-4 mt-4 text-xs font-semibold">
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2">Start Level:</span>
                  <select 
                    value={form.minLevel}
                    onChange={e => setForm({...form, minLevel: parseInt(e.target.value)})}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                  >
                    {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                  </select>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2">Max Level Limit:</span>
                  <select 
                    value={form.maxLevel}
                    onChange={e => setForm({...form, maxLevel: parseInt(e.target.value)})}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                  >
                    {form.levels.map((_, i) => <option key={i} value={i+1}>Level {i+1}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors">
                {editingId ? 'Update Strategy' : 'Save Strategy'}
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
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
          <div className="col-span-full glass-card p-12 rounded-2xl text-center border-dashed border-2 border-indigo-200">
             <Target className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-700">No strategies configured</h3>
             <p className="text-slate-500 mt-2">Create a strategy to assign to your bots.</p>
          </div>
        ) : (
          strategies.map(st => (
            <div 
              key={st.id} 
              className="glass-card p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => setExpandedId(expandedId === st.id ? null : st.id)}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{st.name}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Limits: {st.maxWins}W / {st.maxLosses}L</p>
                </div>
                <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(st)} className="text-slate-400 hover:text-indigo-500 transition-colors p-2 bg-slate-50 rounded-xl hover:bg-indigo-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(st.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-xl hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 bg-white/50 p-4 rounded-xl border border-white/60">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Active Levels</span>
                  <span className="text-slate-800 font-bold font-mono">L{st.minLevel} - L{st.maxLevel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Base Bet</span>
                  <span className="text-emerald-500 font-bold font-mono">₹{st.levels[0]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Max Bet (L{st.maxLevel})</span>
                  <span className="text-red-500 font-bold font-mono">₹{st.levels[(st.maxLevel || 1) - 1]}</span>
                </div>
              </div>

              {expandedId === st.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">All Bet Levels</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {st.levels.slice(st.minLevel - 1, st.maxLevel).map((amt: number, idx: number) => (
                      <div key={idx} className="bg-white rounded-lg border border-slate-100 p-1.5 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-indigo-500 mb-0.5 uppercase">L{idx + (st.minLevel || 1)}</div>
                        <div className="text-xs font-mono font-semibold text-slate-700">₹{amt}</div>
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
