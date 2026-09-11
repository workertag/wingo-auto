import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Crown,
  History,
  Loader2,
  Lock,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const dollars = (cents?: number) => `$${((cents ?? 0) / 100).toFixed(2)}`;

interface SubtreeNode {
  position: { id: string; userId: number; currentLevel: number; maxed: boolean };
  left: SubtreeNode | null;
  right: SubtreeNode | null;
}

function SubtreeNodeCard({ node }: { node: SubtreeNode | null }) {
  if (!node) {
    return (
      <div className="w-20 sm:w-24 p-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/10 text-center">
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          Empty
        </span>
      </div>
    );
  }
  return (
    <div className="w-20 sm:w-24 p-2 rounded-xl border border-amber-200 bg-white text-center shadow-sm">
      <User className="w-4 h-4 mx-auto text-[var(--gmc-gold-deep)]" />
      <p className="text-[10px] font-black text-slate-800 mt-0.5">
        #{node.position.userId}
      </p>
      <p className="text-[9px] font-semibold text-slate-500">
        Lvl {node.position.currentLevel}
      </p>
    </div>
  );
}

function SubtreeView({ subtree }: { subtree: SubtreeNode }) {
  return (
    <div className="flex flex-col items-center gap-4 overflow-x-auto py-2">
      <SubtreeNodeCard node={subtree} />
      {(subtree.left || subtree.right) && (
        <div className="flex gap-6 sm:gap-10">
          {[subtree.left, subtree.right].map((child, i) => (
            <div
              key={i === 0 ? "left" : "right"}
              className="flex flex-col items-center gap-4"
            >
              <SubtreeNodeCard node={child} />
              {child && (child.left || child.right) && (
                <div className="flex gap-3 sm:gap-4">
                  <SubtreeNodeCard node={child.left} />
                  <SubtreeNodeCard node={child.right} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExclusivePoolPage() {
  const queryClient = useQueryClient();

  const { data: eligibility } = useQuery({
    queryKey: ["exclusive-pool-eligibility"],
    queryFn: async () => {
      const res = await api.users.pool.exclusive.eligibility.get();
      return res.data?.data ?? null;
    },
  });

  const { data: pool, isLoading } = useQuery({
    queryKey: ["exclusive-pool"],
    queryFn: async () => {
      const res = await api.users.pool.exclusive.get();
      return res.data?.data ?? null;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["exclusive-pool-config"],
    queryFn: async () => {
      const res = await api.users["system-config"].get();
      return res.data?.data?.EXCLUSIVE_POOL ?? null;
    },
  });

  const directEntryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.users.pool.exclusive.enter.direct.post();
      if (res.error) {
        throw new Error(
          (res.error.value as { message?: string })?.message ??
            "Failed to enter the exclusive pool",
        );
      }
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success("Entered the exclusive pool!");
      queryClient.invalidateQueries({ queryKey: ["exclusive-pool"] });
      queryClient.invalidateQueries({
        queryKey: ["exclusive-pool-eligibility"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const level1 = config?.LEVELS[0];
  const progress = pool?.progress;

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:px-6 lg:px-8 sm:py-8 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 py-3 px-2 sm:p-6 shadow-md shadow-amber-950/5">
          <div className="relative z-10 flex items-center gap-2 sm:gap-4.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--gmc-gold)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Exclusive Pool
              </h1>
              <p className="hidden sm:block text-xs lg:text-sm text-slate-600 font-semibold mt-1">
                A sponsor-anchored 2x8 hybrid matrix - unlock it with active
                directs and your own business, then grow your own team to
                climb all 8 levels.
              </p>
            </div>
          </div>
          <p className="block sm:hidden text-xs lg:text-sm text-slate-600 font-semibold mt-1">
            A sponsor-anchored 2x8 hybrid matrix - unlock it with active
            directs and your own business, then grow your own team.
          </p>
        </div>

        {eligibility && (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-3">
            <h4 className="text-base font-black text-slate-900">Eligibility</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  eligibility.activeDirects >= eligibility.requiredActiveDirects
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-amber-200 bg-amber-50/30"
                }`}
              >
                {eligibility.activeDirects >=
                eligibility.requiredActiveDirects ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Active Directs
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {eligibility.activeDirects} /{" "}
                    {eligibility.requiredActiveDirects} required
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  eligibility.ownBusinessCents >=
                  eligibility.requiredOwnBusinessCents
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-amber-200 bg-amber-50/30"
                }`}
              >
                {eligibility.ownBusinessCents >=
                eligibility.requiredOwnBusinessCents ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Own Business
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {dollars(eligibility.ownBusinessCents)} /{" "}
                    {dollars(eligibility.requiredOwnBusinessCents)} required
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!pool?.position && config?.ENTRY_METHODS.DIRECT_USDT_ENABLED && (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4">
            <h4 className="text-base font-black text-slate-900">
              Enter for {dollars(level1?.packageCents)}
            </h4>
            <button
              type="button"
              onClick={() => directEntryMutation.mutate()}
              disabled={directEntryMutation.isPending || !eligibility?.eligible}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {directEntryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Pay from Deposit Wallet
            </button>
            {!eligibility?.eligible && (
              <p className="text-[11px] text-slate-500 font-medium">
                Not eligible yet - meet both requirements above to unlock entry.
              </p>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 text-center py-12 text-slate-500 animate-pulse text-xs font-semibold">
            Loading your exclusive pool...
          </div>
        ) : pool?.position && progress ? (
          <>
            <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900">
                  {progress.maxed
                    ? "Level 8 - Maxed"
                    : `Level ${progress.currentLevel} of 8`}
                </h4>
                {!progress.maxed && (
                  <span className="text-xs font-bold text-slate-500">
                    {progress.filled} / {progress.required} team
                  </span>
                )}
              </div>
              {!progress.maxed && (
                <div className="h-2.5 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)]"
                    style={{
                      width: `${Math.min(100, (progress.filled / Math.max(1, progress.required)) * 100)}%`,
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {config?.LEVELS.map((level) => {
                  const done = level.level < progress.currentLevel || progress.maxed;
                  const current = level.level === progress.currentLevel && !progress.maxed;
                  return (
                    <div
                      key={level.level}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                        done
                          ? "border-emerald-200 bg-emerald-50/40 text-emerald-700"
                          : current
                            ? "border-amber-300 bg-amber-50/50 text-amber-700"
                            : "border-slate-200 bg-slate-50/50 text-slate-400"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        Lvl {level.level} - {dollars(level.packageCents)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {pool.subtree && (
              <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6">
                <h4 className="text-base font-black text-slate-900 mb-3">
                  Your Team
                </h4>
                <SubtreeView subtree={pool.subtree} />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 text-center py-12 px-3 text-slate-500 text-base sm:text-xl font-semibold">
            You have no exclusive-pool position yet - enter above once
            eligible.
          </div>
        )}

        {pool && pool.history.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-3">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History size={18} className="text-[var(--gmc-gold-deep)]" />
              Income History
            </h4>
            <div className="space-y-2">
              {pool.history.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-100 bg-amber-50/20 text-xs font-semibold text-slate-600"
                >
                  <span>Level {completion.level} completed</span>
                  <span>
                    {dollars(completion.directCents + completion.placementCents)}{" "}
                    income - {dollars(completion.upgradeCents)} upgrade
                  </span>
                  <span>
                    {new Date(completion.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
