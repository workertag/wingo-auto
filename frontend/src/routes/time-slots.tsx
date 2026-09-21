import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { AppLayout } from '../components/Layout';

export const Route = createFileRoute('/time-slots')({
  component: TimeSlotsPage,
});

function generateTimeOptions() {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const h = i.toString().padStart(2, '0');
      const m = j.toString().padStart(2, '0');
      const time = `${h}:${m}`;
      const ampm = i >= 12 ? 'PM' : 'AM';
      const displayH = i % 12 || 12;
      const displayTime = `${displayH.toString().padStart(2, '0')}:${m} ${ampm}`;
      options.push({ value: time, label: displayTime });
    }
  }
  return options;
}

function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '18:00' });

  const timeOptions = useMemo(() => generateTimeOptions(), []);

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Time Slots</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure active trading hours for the system.</p>
        </div>
        <button 
          onClick={() => { setForm({ name: '', startTime: '09:00', endTime: '18:00' }); setEditingId(null); setIsAdding(true); }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>New Time Slot</span>
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Start Time</label>
                <select
                  required
                  value={form.startTime}
                  onChange={e => setForm({...form, startTime: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">End Time</label>
                <select
                  required
                  value={form.endTime}
                  onChange={e => setForm({...form, endTime: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-colors">
                 Save
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
        ) : timeSlots.length === 0 ? (
          <div className="col-span-full glass-card p-12 rounded-2xl text-center border-dashed border-2 border-indigo-200">
             <Clock className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-700">No time slots configured</h3>
             <p className="text-slate-500 mt-2">Add a time slot to run bots during specific hours.</p>
          </div>
        ) : (
          timeSlots.map(ts => (
            <div key={ts.id} className="glass-card p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-800 text-lg">{ts.name}</h3>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(ts)} className="text-slate-400 hover:text-indigo-500 transition-colors p-2 bg-slate-50 rounded-xl hover:bg-indigo-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ts.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-xl hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 bg-white/50 p-4 rounded-xl border border-white/60">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span className="font-mono font-semibold">{ts.startTime} - {ts.endTime}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </AppLayout>
  );
}
