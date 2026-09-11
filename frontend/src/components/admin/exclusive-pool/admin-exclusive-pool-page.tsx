import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Coins, Crown, Landmark, ScrollText } from "lucide-react";
import { useState } from "react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 shrink-0">
        <Icon className="w-5 h-5 text-[var(--gmc-gold-deep)]" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AdminExclusivePoolPage() {
  const [positionsPage, setPositionsPage] = useState(1);
  const [completionsPage, setCompletionsPage] = useState(1);

  const { data: treasury } = useQuery({
    queryKey: ["admin-exclusive-pool-treasury"],
    queryFn: async () => {
      const res = await api.admin.pool.exclusive.treasury.get();
      return res.data?.data ?? null;
    },
  });

  const { data: positions, isLoading } = useQuery({
    queryKey: ["admin-exclusive-pool-positions", positionsPage],
    queryFn: async () => {
      const res = await api.admin.pool.exclusive.positions.get({
        query: { page: positionsPage, size: 20 },
      });
      return res.data?.data ?? null;
    },
  });

  const { data: completions, isLoading: completionsLoading } = useQuery({
    queryKey: ["admin-exclusive-pool-level-completions", completionsPage],
    queryFn: async () => {
      const res = await api.admin.pool.exclusive["level-completions"].get({
        query: { page: completionsPage, size: 20 },
      });
      return res.data?.data ?? null;
    },
  });

  const dollars = (cents?: number) => `$${((cents ?? 0) / 100).toFixed(2)}`;

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5">
          <div className="relative z-10 flex items-center gap-4.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
              <Crown className="w-8 h-8 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Exclusive Pool
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Treasury totals, all placed positions, and the level-completion
                audit feed. Payout schedule and eligibility thresholds are
                edited in System Config.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Landmark}
            label="Deposited (Direct)"
            value={dollars(treasury?.depositedCents)}
          />
          <StatCard
            icon={Coins}
            label="Paid Out"
            value={dollars(treasury?.payoutCents)}
          />
          <StatCard
            icon={ScrollText}
            label="Admin Fee Accrued"
            value={dollars(treasury?.adminFeeCents)}
          />
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4">
          <h4 className="text-lg font-black text-slate-900">All Positions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-amber-100">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Sponsor</th>
                  <th className="py-2 pr-4">Depth</th>
                  <th className="py-2 pr-4">Level</th>
                  <th className="py-2 pr-4">Maxed</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  positions?.list.map((p) => (
                    <tr key={p.id} className="border-b border-amber-50">
                      <td className="py-2 pr-4 font-bold">#{p.userId}</td>
                      <td className="py-2 pr-4">
                        {p.sponsorUserId ? `#${p.sponsorUserId}` : "-"}
                      </td>
                      <td className="py-2 pr-4">{p.depth}</td>
                      <td className="py-2 pr-4 font-bold">{p.currentLevel}</td>
                      <td className="py-2 pr-4">{p.maxed ? "Yes" : "No"}</td>
                      <td className="py-2 pr-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {positions && (
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2">
              <button
                type="button"
                disabled={!positions.pagination.hasPrevious}
                onClick={() => setPositionsPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-amber-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span>
                Page {positions.pagination.page} - {positions.pagination.total}{" "}
                total
              </span>
              <button
                type="button"
                disabled={!positions.pagination.hasNext}
                onClick={() => setPositionsPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-amber-200 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4">
          <h4 className="text-lg font-black text-slate-900">
            Level Completions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-amber-100">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Level</th>
                  <th className="py-2 pr-4">Direct</th>
                  <th className="py-2 pr-4">Placement</th>
                  <th className="py-2 pr-4">Upgrade</th>
                  <th className="py-2 pr-4">Admin Fee</th>
                  <th className="py-2 pr-4">When</th>
                </tr>
              </thead>
              <tbody>
                {completionsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  completions?.list.map((c) => (
                    <tr key={c.id} className="border-b border-amber-50">
                      <td className="py-2 pr-4 font-bold">#{c.userId}</td>
                      <td className="py-2 pr-4">{c.level}</td>
                      <td className="py-2 pr-4">
                        {c.directUserId
                          ? `#${c.directUserId} - ${dollars(c.directCents)}`
                          : "-"}
                      </td>
                      <td className="py-2 pr-4">
                        {c.placementUserId
                          ? `#${c.placementUserId} - ${dollars(c.placementCents)}`
                          : "-"}
                      </td>
                      <td className="py-2 pr-4">{dollars(c.upgradeCents)}</td>
                      <td className="py-2 pr-4">{dollars(c.adminFeeCents)}</td>
                      <td className="py-2 pr-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {completions && (
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2">
              <button
                type="button"
                disabled={!completions.pagination.hasPrevious}
                onClick={() => setCompletionsPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-amber-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span>
                Page {completions.pagination.page} -{" "}
                {completions.pagination.total} total
              </span>
              <button
                type="button"
                disabled={!completions.pagination.hasNext}
                onClick={() => setCompletionsPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-amber-200 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
