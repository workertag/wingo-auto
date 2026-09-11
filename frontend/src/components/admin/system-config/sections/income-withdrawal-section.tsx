import { TrendingUp } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import {
  bpsHint,
  inputClassName,
  labelClassName,
  validateBps,
  validateNonNegativeInt,
} from "../form-utils";
import { FieldError, SectionCard } from "../section-card";

export function IncomeWithdrawalSection() {
  const values = useAdminSystemConfigFormStore((s) => s.values);
  const setIncome = useAdminSystemConfigFormStore((s) => s.setIncome);
  const setWithdrawal = useAdminSystemConfigFormStore((s) => s.setWithdrawal);
  const setConvertFeeBps = useAdminSystemConfigFormStore(
    (s) => s.setConvertFeeBps,
  );

  const limitMultipleError = validateNonNegativeInt(
    values.INCOME.LIMIT_MULTIPLE,
  );
  const cooloffError = validateNonNegativeInt(
    values.WITHDRAWAL.COOLOFF_PERIOD_IN_HOURS,
  );
  const withdrawalFeeError = validateBps(values.WITHDRAWAL.FEE_BPS);
  const convertFeeError = validateBps(values.CONVERT_FEE_BPS);

  return (
    <SectionCard icon={TrendingUp} title="Income & Withdrawals">
      <div>
        <label htmlFor="income-limit-multiple" className={labelClassName}>
          Income Limit Multiple
        </label>
        <input
          id="income-limit-multiple"
          type="number"
          value={values.INCOME.LIMIT_MULTIPLE}
          onChange={(e) => setIncome({ LIMIT_MULTIPLE: e.target.value })}
          className={inputClassName}
        />
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
          Multiple of investment a user may earn before income capping.
        </p>
        <FieldError message={limitMultipleError} />
      </div>

      <div>
        <label htmlFor="withdrawal-min" className={labelClassName}>
          Min Withdrawal ($)
        </label>
        <input
          id="withdrawal-min"
          type="number"
          value={values.WITHDRAWAL.MIN_AMOUNT}
          onChange={(e) => setWithdrawal({ MIN_AMOUNT: e.target.value })}
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="withdrawal-fee-bps" className={labelClassName}>
          Withdrawal Fee (BPS)
        </label>
        <input
          id="withdrawal-fee-bps"
          type="number"
          value={values.WITHDRAWAL.FEE_BPS}
          onChange={(e) => setWithdrawal({ FEE_BPS: e.target.value })}
          className={inputClassName}
        />
        {bpsHint(values.WITHDRAWAL.FEE_BPS) && (
          <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {bpsHint(values.WITHDRAWAL.FEE_BPS)}
          </p>
        )}
        <FieldError message={withdrawalFeeError} />
      </div>

      <div>
        <label htmlFor="withdrawal-cooloff" className={labelClassName}>
          Cooloff Period (hrs)
        </label>
        <input
          id="withdrawal-cooloff"
          type="number"
          value={values.WITHDRAWAL.COOLOFF_PERIOD_IN_HOURS}
          onChange={(e) =>
            setWithdrawal({ COOLOFF_PERIOD_IN_HOURS: e.target.value })
          }
          className={inputClassName}
        />
        <FieldError message={cooloffError} />
      </div>

      <div>
        <label htmlFor="convert-fee-bps" className={labelClassName}>
          Convert Fee (BPS)
        </label>
        <input
          id="convert-fee-bps"
          type="number"
          value={values.CONVERT_FEE_BPS}
          onChange={(e) => setConvertFeeBps(e.target.value)}
          className={inputClassName}
        />
        {bpsHint(values.CONVERT_FEE_BPS) && (
          <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {bpsHint(values.CONVERT_FEE_BPS)}
          </p>
        )}
        <FieldError message={convertFeeError} />
      </div>
    </SectionCard>
  );
}
