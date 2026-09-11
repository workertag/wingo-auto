import { Timer } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import { SectionCard, ToggleRow } from "../section-card";

const CRON_TOGGLES = [
  {
    key: "MATCHING_BONUS_JOB_ENABLED",
    label: "Matching Bonus Job Cron",
    hint: "Processes pending binary matching-bonus payouts enqueued off the purchase path. Turn off to pause matching-bonus payouts. On by default.",
  },
  {
    key: "PURCHASE_SCANNER_ENABLED",
    label: "Purchase Scanner Cron",
    hint: "Reconciles on-chain TokenSale purchases against orders for tabs that never called back. Turn off to pause the on-chain scan. On by default.",
  },
  {
    key: "AUTH_SESSION_CLEANUP_ENABLED",
    label: "Auth Session Cleanup Cron",
    hint: "Prunes expired sessions from memory and marks their DB rows expired. Turn off to pause automatic session cleanup. On by default.",
  },
] as const;

export function CronSection() {
  const cron = useAdminSystemConfigFormStore((s) => s.values.CRON);
  const setCron = useAdminSystemConfigFormStore((s) => s.setCron);

  return (
    <SectionCard icon={Timer} title="Cron Jobs">
      {CRON_TOGGLES.map(({ key, label, hint }) => (
        <ToggleRow
          key={key}
          label={label}
          hint={hint}
          checked={cron[key]}
          onChange={(checked) => setCron({ [key]: checked })}
        />
      ))}
    </SectionCard>
  );
}
