import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { AppLayout } from '../components/Layout';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';

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
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 relative z-10 min-h-screen bg-transparent">
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Time Slots</h1>
          </div>
          <button 
            onClick={() => { setForm({ name: '', startTime: '09:00', endTime: '18:00' }); setEditingId(null); setIsAdding(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Time Slot
          </button>
        </div>

        {isAdding && (
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name (e.g., Morning Session)</label>
                <input 
                  required
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                  <select
                    required
                    value={form.startTime}
                    onChange={e => setForm({...form, startTime: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Time</label>
                  <select
                    required
                    value={form.endTime}
                    onChange={e => setForm({...form, endTime: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Save</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-slate-500 py-10">Loading...</div>
          ) : timeSlots.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-800">
              No time slots configured. Add one to run the bot during specific hours.
            </div>
          ) : (
            timeSlots.map(ts => (
              <div key={ts.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-lg group hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white text-lg">{ts.name}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(ts)} className="text-slate-500 hover:text-blue-400 transition-colors p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ts.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono">{ts.startTime} - {ts.endTime}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
