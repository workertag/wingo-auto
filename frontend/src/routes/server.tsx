import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../components/Layout';
import { ServerHealthWidget } from '../components/ServerHealthWidget';

export const Route = createFileRoute('/server')({
  component: ServerPage,
});

function ServerPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MONITORING</p>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Health</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Detailed performance and hardware metrics of your server.</p>
        </div>
        <ServerHealthWidget />
      </div>
    </AppLayout>
  );
}
