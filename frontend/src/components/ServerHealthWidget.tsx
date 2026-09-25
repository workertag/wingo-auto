import { useQuery } from '@tanstack/react-query';
import { Server, Cpu, MemoryStick, Activity, Clock, ServerCog } from 'lucide-react';
import { api } from '../lib/api';

export function ServerHealthWidget() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.getSystemHealth(),
    refetchInterval: 5000 // Poll every 5s
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[200px] mt-6">
        <div className="text-slate-400 font-medium flex items-center space-x-2">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Loading server metrics...</span>
        </div>
      </div>
    );
  }

  if (isError || !health) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[200px] mt-6">
        <div className="text-red-400 font-medium">Failed to load server metrics.</div>
      </div>
    );
  }

  const { cpu, memory, os } = health;
  
  const memUsedGB = (memory.used / (1024 ** 3)).toFixed(2);
  const memTotalGB = (memory.total / (1024 ** 3)).toFixed(2);
  const memUsagePercent = Math.round((memory.used / memory.total) * 100);
  
  const cpuUsagePercent = Math.round(cpu.utilization || 0);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
          <ServerCog className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 leading-tight">Server Infrastructure</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time health & hardware metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPU Usage</span>
            </div>
            <span className={`text-sm font-black ${cpuUsagePercent > 80 ? 'text-red-500' : 'text-emerald-500'}`}>
              {cpuUsagePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4">
            <div 
              className={`h-1.5 rounded-full ${cpuUsagePercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
              style={{ width: `${cpuUsagePercent}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-500 space-y-1 font-medium">
            <div className="flex justify-between"><span>Model</span><span className="text-slate-700 truncate ml-2 text-right">{cpu.brand || 'Unknown'}</span></div>
            <div className="flex justify-between"><span>Cores</span><span className="text-slate-700">{cpu.cores}</span></div>
            <div className="flex justify-between"><span>Speed</span><span className="text-slate-700">{cpu.speed} GHz</span></div>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <MemoryStick className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RAM Usage</span>
            </div>
            <span className={`text-sm font-black ${memUsagePercent > 80 ? 'text-red-500' : 'text-blue-500'}`}>
              {memUsagePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4">
            <div 
              className={`h-1.5 rounded-full ${memUsagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
              style={{ width: `${memUsagePercent}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-500 space-y-1 font-medium">
            <div className="flex justify-between"><span>Used</span><span className="text-slate-700">{memUsedGB} GB</span></div>
            <div className="flex justify-between"><span>Total</span><span className="text-slate-700">{memTotalGB} GB</span></div>
            <div className="flex justify-between"><span>Free</span><span className="text-slate-700">{((memory.free || memory.total - memory.used) / (1024 ** 3)).toFixed(2)} GB</span></div>
          </div>
        </div>

        {/* OS & Platform */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Info</span>
          </div>
          <div className="text-xs text-slate-500 space-y-2 font-medium">
            <div className="flex justify-between pb-2 border-b border-slate-200"><span>Platform</span><span className="text-slate-700 capitalize">{os.platform}</span></div>
            <div className="flex justify-between pb-2 border-b border-slate-200"><span>Distro</span><span className="text-slate-700">{os.distro || 'Unknown'}</span></div>
            <div className="flex justify-between"><span>Release</span><span className="text-slate-700">{os.release}</span></div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-center items-center text-center">
          <Clock className="w-8 h-8 text-indigo-400 mb-2" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Uptime</span>
          <h3 className="text-xl font-black text-slate-800">{formatUptime(os.uptime)}</h3>
        </div>
      </div>
    </div>
  );
}
