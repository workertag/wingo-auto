import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { zUpdateSystemConfigSchema } from "@/_definitions";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import {
  type SystemConfigData,
  useAdminSystemConfigStore,
} from "@/stores/admin-system-config-store";
import { buildSystemConfigPayload } from "./form-utils";
import { AutoPoolSection } from "./sections/auto-pool-section";
import { CronSection } from "./sections/cron-section";
import { ExclusivePoolSection } from "./sections/exclusive-pool-section";
import { IncomeWithdrawalSection } from "./sections/income-withdrawal-section";
import { LevelBoosterDirectSection } from "./sections/level-booster-direct-section";
import { OtpSubmitSection } from "./sections/otp-submit-section";
import { RankAchievementSection } from "./sections/rank-achievement-section";

export function AdminSystemConfigPage() {
  const config = useAdminSystemConfigStore((s) => s.config);
  const setConfig = useAdminSystemConfigStore((s) => s.setConfig);
  const loadFromConfig = useAdminSystemConfigFormStore((s) => s.loadFromConfig);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-system-config"],
    queryFn: async () => {
      const res = await api.admin["system-config"].get();
      return res.data?.data ?? null;
    },
  });

  useEffect(() => {
    if (data) {
      setConfig(data);
      loadFromConfig(data);
    }
  }, [data, setConfig, loadFromConfig]);

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                System Config
              </h2>
            </div>
          </div>
        </div>

        <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="absolute top-1/2 left-1/4 w-[350px] h-[150px] bg-amber-100/50 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4.5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
                <Settings2 className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  System Config
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Runtime-editable rates, limits and cron toggles. Changes apply
                  instantly and are logged with an audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading || !config ? (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 text-center py-12 text-slate-500 animate-pulse text-xs font-semibold">
            Loading system configuration...
          </div>
        ) : (
          <SystemConfigForm />
        )}
      </div>
    </div>
  );
}

/**
 * Orchestrates the config sections below - each section is its own
 * component reading/writing its own slice of `useAdminSystemConfigFormStore`
 * directly, so this file stays a thin shell instead of growing a field at a
 * time. Submission reads the full draft from the store, validates it, and
 * PATCHes it in one request.
 */
function SystemConfigForm() {
  const queryClient = useQueryClient();
  const setConfig = useAdminSystemConfigStore((s) => s.setConfig);
  const loadFromConfig = useAdminSystemConfigFormStore((s) => s.loadFromConfig);

  const saveMutation = useMutation({
    mutationFn: async (
      payload: ReturnType<typeof buildSystemConfigPayload>,
    ) => {
      const res = await api.admin["system-config"].patch(payload);
      if (res.error)
        throw new Error(
          (res.error.value as { message?: string })?.message ??
            "Failed to update system config",
        );
      return res.data?.data ?? null;
    },
    onSuccess: (updated) => {
      toast.success("System configuration updated!");
      if (updated) {
        setConfig(updated as SystemConfigData);
        loadFromConfig(updated as SystemConfigData);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-system-config"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = useAdminSystemConfigFormStore.getState().values;
    const payload = buildSystemConfigPayload(values);
    const result = zUpdateSystemConfigSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    saveMutation.mutate(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <IncomeWithdrawalSection />
      <LevelBoosterDirectSection />
      <RankAchievementSection />
      <CronSection />
      <AutoPoolSection />
      <ExclusivePoolSection />
      <OtpSubmitSection isSubmitting={saveMutation.isPending} />
    </form>
  );
}
