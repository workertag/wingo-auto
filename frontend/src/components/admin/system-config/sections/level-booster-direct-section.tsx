import { Percent } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import {
  bpsHint,
  inputClassName,
  labelClassName,
  validateBps,
  validateNonNegativeInt,
} from "../form-utils";
import { FieldError, SectionCard, ToggleRow } from "../section-card";

export function LevelBoosterDirectSection() {
  const values = useAdminSystemConfigFormStore((s) => s.values);
  const setLevelIncomeMinLeg = useAdminSystemConfigFormStore(
    (s) => s.setLevelIncomeMinLeg,
  );
  const setLevelIncomeBusinessRatio = useAdminSystemConfigFormStore(
    (s) => s.setLevelIncomeBusinessRatio,
  );
  const setBoosterIncome = useAdminSystemConfigFormStore(
    (s) => s.setBoosterIncome,
  );
  const setDirectIncome = useAdminSystemConfigFormStore(
    (s) => s.setDirectIncome,
  );

  return (
    <SectionCard icon={Percent} title="Level, Booster & Direct Income">
      <div>
        <label htmlFor="level-income-min-leg" className={labelClassName}>
          Level Income Min Leg
        </label>
        <input
          id="level-income-min-leg"
          type="number"
          value={values.LEVEL_INCOME.MIN_LEG}
          onChange={(e) => setLevelIncomeMinLeg(e.target.value)}
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(values.LEVEL_INCOME.MIN_LEG)}
        />
      </div>

      <div className="md:col-span-2">
        <span className={labelClassName}>
          Level Income Business Ratio (3 legs, %)
        </span>
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <input
              key={i}
              type="number"
              value={values.LEVEL_INCOME.BUSINESS_RATIO[i]}
              onChange={(e) => setLevelIncomeBusinessRatio(i, e.target.value)}
              className={inputClassName}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="booster-days-limit" className={labelClassName}>
          Booster Income Days Limit
        </label>
        <input
          id="booster-days-limit"
          type="number"
          value={values.BOOSTER_INCOME.DAYS_LIMIT}
          onChange={(e) => setBoosterIncome({ DAYS_LIMIT: e.target.value })}
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(values.BOOSTER_INCOME.DAYS_LIMIT)}
        />
      </div>

      <div>
        <label htmlFor="booster-multiple" className={labelClassName}>
          Booster Income Multiple
        </label>
        <input
          id="booster-multiple"
          type="number"
          value={values.BOOSTER_INCOME.MULTIPLE}
          onChange={(e) => setBoosterIncome({ MULTIPLE: e.target.value })}
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(values.BOOSTER_INCOME.MULTIPLE)}
        />
      </div>

      <div>
        <label htmlFor="booster-required-referrals" className={labelClassName}>
          Booster Income Required Referrals
        </label>
        <input
          id="booster-required-referrals"
          type="number"
          value={values.BOOSTER_INCOME.REQUIRED_REFERRALS}
          onChange={(e) =>
            setBoosterIncome({ REQUIRED_REFERRALS: e.target.value })
          }
          className={inputClassName}
        />
        <FieldError
          message={validateNonNegativeInt(
            values.BOOSTER_INCOME.REQUIRED_REFERRALS,
          )}
        />
      </div>

      <div>
        <label htmlFor="direct-retopup-bps" className={labelClassName}>
          Direct Income Retopup Rate (BPS)
        </label>
        <input
          id="direct-retopup-bps"
          type="number"
          value={values.DIRECT_INCOME.RETOPUP_BPS}
          onChange={(e) => setDirectIncome({ RETOPUP_BPS: e.target.value })}
          className={inputClassName}
        />
        {bpsHint(values.DIRECT_INCOME.RETOPUP_BPS) && (
          <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {bpsHint(values.DIRECT_INCOME.RETOPUP_BPS)}
          </p>
        )}
        <FieldError message={validateBps(values.DIRECT_INCOME.RETOPUP_BPS)} />
      </div>

      <ToggleRow
        label="Count Direct Income On Retopup"
        hint="When on, direct income/auto-upgrade also fires on retopups, not just a downline's first purchase. Off by default."
        checked={values.DIRECT_INCOME.COUNT_ON_RETOPUP}
        onChange={(checked) => setDirectIncome({ COUNT_ON_RETOPUP: checked })}
      />
    </SectionCard>
  );
}
