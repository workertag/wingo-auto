import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/time-slots')({
  component: TimeSlotsPage,
});

// Removed generateTimeOptions as we use native time inputs now

function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '18:00' });

  const fetchTimeSlots = async () => {
    try {
      const data = await api.getTimeSlots();
      setTimeSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTimeSlot(editingId, form);
      } else {
        await api.createTimeSlot(form);
      }
      setForm({ name: '', startTime: '09:00', endTime: '18:00' });
      setIsAdding(false);
      setEditingId(null);
      fetchTimeSlots();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (ts: any) => {
    setForm({ name: ts.name, startTime: ts.startTime, endTime: ts.endTime });
    setEditingId(ts.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.deleteTimeSlot(id);
      fetchTimeSlots();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuration</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Time Slots</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Configure active trading hours for the system. Set multiple time slots to control when your bot runs.</p>
          </div>
          <button 
            onClick={() => { setForm({ name: '', startTime: '09:00', endTime: '18:00' }); setEditingId(null); setIsAdding(true); }}
            className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Time Slot</span>
          </button>
        </div>

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Name (e.g., Morning Session)</label>
                  <input 
                    required
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">Start Time</label>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={e => setForm({...form, startTime: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">End Time</label>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={e => setForm({...form, endTime: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-8">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                     Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors">
                     Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Top Summary Banner */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          {/* Subtle background wave/gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/50 to-transparent opacity-50 pointer-events-none" />
          
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{timeSlots.length} Time Slots</h2>
              <p className="text-sm font-medium text-slate-500">Total configured time slots</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-800">System Active</span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Running scheduled time slots</p>
            </div>
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-full text-center text-slate-500 py-10 font-medium">Loading...</div>
          ) : timeSlots.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border-dashed border-2 border-slate-200">
               <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-700">No time slots configured</h3>
               <p className="text-slate-500 mt-2">Add a time slot to run bots during specific hours.</p>
            </div>
          ) : (
            timeSlots.map(ts => {
              const isNight = ts.startTime > '18:00' || ts.startTime < '06:00';
              return (
                <div key={ts.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isNight ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                        {isNight ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 mb-1">{ts.name}</h3>
                        <div className="flex items-center text-slate-600 space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-sm font-semibold">{ts.startTime} - {ts.endTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(ts)} className="text-slate-400 hover:text-indigo-500 p-1">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ts.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Tip */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full border border-indigo-200 flex items-center justify-center text-indigo-500 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Tip</h4>
              <p className="text-sm text-slate-500 font-medium">You can add multiple time slots. The bot will only run during the active time slots.</p>
            </div>
          </div>
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center space-x-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span>Learn more</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
