import { api } from "@lib";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  HandCoins,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const _queryClient = useQueryClient();

  // Parallel fetch overview stats
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["admin-overview-addresses"],
    queryFn: async () => {
      const res = await api.admin["deposit-addresses"].get();
      return res.data?.data ?? [];
    },
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["admin-overview-withdrawals"],
    queryFn: async () => {
      const res = await api.admin.withdrawals.list.get({
        query: { status: "pending", size: 1 },
      });
      return res.data?.data ?? null;
    },
  });

  // Fetch real dashboard stats (total users + global incomes)
  const { data: dashboardStats, isLoading: dashboardStatsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await api.admin.dashboard.get();
      return res.data?.data ?? null;
    },
  });

  const activeAddressesCount = useMemo(() => {
    if (!addresses) return 0;
    // biome-ignore lint/suspicious/noExplicitAny: API schema uses any array
    return addresses.filter((a: any) => a.isActive).length;
  }, [addresses]);

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)]">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-fade-in-up">
        {/* Simple Interactive Admin Header */}
        {/* NATIVE MOBILE LAYOUT */}
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Console Overview
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Admin Console
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/80 border border-amber-100">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5 text-slate-800">
          {/* Background radial glow */}
          <div className="absolute top-1/2 left-1/4 w-[350px] h-[150px] bg-amber-100/50 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4.5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
                <ShieldCheck className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Admin Console
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-200">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  System monitoring, global income distribution analysis, EVM
                  addresses tracking, and withdrawal audits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Administrative Overview Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-6 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/40" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                System Overview Metrics
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-amber-200/80 via-amber-100 to-transparent flex-1 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              label="Total Users"
              value={
                dashboardStatsLoading
                  ? "Loading..."
                  : `${dashboardStats?.totalUsers ?? 0}`
              }
              description="Consolidated registered user accounts"
              icon={Users}
              onClick={() => navigate({ to: "/admin/funds" })}
            />

            <StatCard
              label="Pending Withdrawals"
              value={
                withdrawalsLoading
                  ? "Loading..."
                  : String(withdrawals?.pagination?.total ?? 0)
              }
              description="Withdrawal transactions awaiting settlement"
              icon={Receipt}
              onClick={() => navigate({ to: "/admin/withdrawals" })}
            />

            <StatCard
              label="Deposit Wallets"
              value={
                addressesLoading ? "Loading..." : `${activeAddressesCount}`
              }
              description="Enabled plan & help wallet EVM addresses"
              icon={HandCoins}
              onClick={() => navigate({ to: "/admin/wallet" })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  onClick,
}: StatCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    setRotate({ x: -(y / (box.height / 2)) * 3, y: (x / (box.width / 2)) * 3 });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card is interactive
    // biome-ignore lint/a11y/noStaticElementInteractions: card hover rotation effects
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-300 bg-white/90 backdrop-blur-md border border-amber-200/70 hover:border-[var(--gmc-gold)]/60 shadow-md shadow-amber-950/5 hover:shadow-xl hover:shadow-amber-950/10 flex flex-col justify-between"
      style={
        {
          transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) ${
            rotate.x !== 0 || rotate.y !== 0
              ? "scale3d(1.015,1.015,1.015)"
              : "scale3d(1,1,1)"
          }`,
          transition:
            rotate.x === 0 && rotate.y === 0
              ? "transform 0.5s ease, border-color 0.3s ease, shadow 0.3s ease"
              : "none",
        } as React.CSSProperties
      }
    >
      {/* Corner amber light glow */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-amber-200/40 via-orange-100/20 to-transparent blur-[35px] group-hover:opacity-80 transition-opacity" />

      <div>
        {/* Header row */}
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[var(--gmc-gold-deep)] shadow-2xs group-hover:bg-[var(--gmc-gold)] group-hover:text-white transition-all duration-300 shrink-0">
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-[0.18em] uppercase mb-0.5 block text-slate-500">
              {label}
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-2 relative z-10 flex flex-col gap-0.5">
          <span className="text-xl sm:text-2xl font-black font-mono text-[var(--gmc-gold-deep)] leading-none tracking-tight">
            {value}
          </span>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-[10px] sm:text-xs leading-relaxed mb-4 relative z-10 font-semibold">
          {description}
        </p>
      </div>

      {/* Bottom details / link */}
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-amber-100 pt-4">
        <span className="text-[10px] text-slate-500 group-hover:text-slate-700 transition-colors uppercase leading-none font-bold tracking-wider">
          Action Area
        </span>
        <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-[var(--gmc-gold-deep)] transition-all duration-300">
          <span>Manage</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
