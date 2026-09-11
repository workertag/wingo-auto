import { Crown } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import { inputClassName, labelClassName } from "../form-utils";
import { SectionCard, ToggleRow } from "../section-card";

const cellInputClassName =
  "w-full px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-slate-800 text-xs font-semibold outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20";

/**
 * Sponsor-anchored 2x8 hybrid matrix - each row below is the fixed
 * payout schedule for one level (see `exclusive-pool-service.ts` on the
 * backend). Level 1's package price is what a user actually pays to
 * enter; every other level advances automatically and for free as the
 * user's own downline fills in, funded from that level's turnover.
 */
export function ExclusivePoolSection() {
  const pool = useAdminSystemConfigFormStore((s) => s.values.EXCLUSIVE_POOL);
  const setEligibility = useAdminSystemConfigFormStore(
    (s) => s.setExclusivePoolEligibility,
  );
  const setEntryMethods = useAdminSystemConfigFormStore(
    (s) => s.setExclusivePoolEntryMethods,
  );
  const setLevel = useAdminSystemConfigFormStore(
    (s) => s.setExclusivePoolLevel,
  );

  return (
    <SectionCard icon={Crown} title="Exclusive Pool (2x8 Hybrid Matrix)">
      <div>
        <label
          htmlFor="exclusive-min-active-directs"
          className={labelClassName}
        >
          Min. Active Directs to Unlock
        </label>
        <input
          id="exclusive-min-active-directs"
          type="number"
          value={pool.ELIGIBILITY.MIN_ACTIVE_DIRECTS}
          onChange={(e) =>
            setEligibility({ MIN_ACTIVE_DIRECTS: e.target.value })
          }
          className={inputClassName}
        />
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
          Direct referrals must each have at least one confirmed purchase to
          count as active.
        </p>
      </div>

      <div>
        <label htmlFor="exclusive-min-own-business" className={labelClassName}>
          Min. Own Business to Unlock ($)
        </label>
        <input
          id="exclusive-min-own-business"
          type="number"
          value={pool.ELIGIBILITY.MIN_OWN_BUSINESS_CENTS}
          onChange={(e) =>
            setEligibility({ MIN_OWN_BUSINESS_CENTS: e.target.value })
          }
          className={inputClassName}
        />
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
          Sum of the user's own confirmed order totals.
        </p>
      </div>

      <ToggleRow
        label="Allow Direct-USDT Entry"
        hint="Lets eligible users enter level 1 by paying its package price directly from their deposit wallet. On by default."
        checked={pool.ENTRY_METHODS.DIRECT_USDT_ENABLED}
        onChange={(checked) => setEntryMethods({ DIRECT_USDT_ENABLED: checked })}
      />

      <div>
        <p className={labelClassName}>Level Payout Schedule</p>
        <p className="mb-3 text-[11px] text-slate-500 font-medium">
          Package $ at level 1 is what the user pays to enter. Upgrade $ +
          Income $ should equal Turnover $ for every level - Admin Fee $ is a
          bookkeeping-only accrual on top and doesn't reduce payouts. Direct %
          + Placement % should sum to 100.
        </p>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-amber-50/50">
                <th className="py-2 px-2">Lvl</th>
                <th className="py-2 px-2">Team</th>
                <th className="py-2 px-2">Package $</th>
                <th className="py-2 px-2">Turnover $</th>
                <th className="py-2 px-2">Upgrade $</th>
                <th className="py-2 px-2">Income $</th>
                <th className="py-2 px-2">Admin Fee $</th>
                <th className="py-2 px-2">Direct %</th>
                <th className="py-2 px-2">Placement %</th>
              </tr>
            </thead>
            <tbody>
              {pool.LEVELS.map((level, index) => (
                <tr key={level.level} className="border-t border-amber-50">
                  <td className="py-1.5 px-2 font-black text-slate-700">
                    {level.level}
                  </td>
                  <td className="py-1.5 px-2 text-slate-500">
                    {level.teamRequired}
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.packageCents}
                      onChange={(e) =>
                        setLevel(index, { packageCents: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.turnoverCents}
                      onChange={(e) =>
                        setLevel(index, { turnoverCents: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.upgradeCents}
                      onChange={(e) =>
                        setLevel(index, { upgradeCents: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.incomeCents}
                      onChange={(e) =>
                        setLevel(index, { incomeCents: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.adminFeeCents}
                      onChange={(e) =>
                        setLevel(index, { adminFeeCents: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.directPct}
                      onChange={(e) =>
                        setLevel(index, { directPct: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      value={level.placementPct}
                      onChange={(e) =>
                        setLevel(index, { placementPct: e.target.value })
                      }
                      className={cellInputClassName}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
