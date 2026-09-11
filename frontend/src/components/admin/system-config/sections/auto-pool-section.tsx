import { Network } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import {
  inputClassName,
  labelClassName,
  validateNonNegativeInt,
} from "../form-utils";
import { FieldError, SectionCard, ToggleRow } from "../section-card";

export function AutoPoolSection() {
  const pool = useAdminSystemConfigFormStore((s) => s.values.AUTO_POOL_2X2);
  const setAutoPool2x2 = useAdminSystemConfigFormStore((s) => s.setAutoPool2x2);
  const setEntryMethods = useAdminSystemConfigFormStore(
    (s) => s.setAutoPool2x2EntryMethods,
  );

  return (
    <SectionCard icon={Network} title="2x2 Auto Pool">
      <div>
        <label htmlFor="pool2x2-entry-price" className={labelClassName}>
          Entry Price ($)
        </label>
        <input
          id="pool2x2-entry-price"
          type="number"
          value={pool.ENTRY_PRICE_CENTS}
          onChange={(e) =>
            setAutoPool2x2({ ENTRY_PRICE_CENTS: e.target.value })
          }
          className={inputClassName}
        />
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
          Cost of one auto-pool entry, whether by burning GNX or paying USDT
          directly.
        </p>
      </div>

      <div>
        <label htmlFor="pool2x2-max-recycles" className={labelClassName}>
          Max Free Auto-Recycles
        </label>
        <input
          id="pool2x2-max-recycles"
          type="number"
          value={pool.MAX_AUTO_RECYCLES}
          onChange={(e) =>
            setAutoPool2x2({ MAX_AUTO_RECYCLES: e.target.value })
          }
          className={inputClassName}
        />
        <FieldError message={validateNonNegativeInt(pool.MAX_AUTO_RECYCLES)} />
      </div>

      <div>
        <label htmlFor="pool2x2-income-reward" className={labelClassName}>
          Income Wallet Reward ($)
        </label>
        <input
          id="pool2x2-income-reward"
          type="number"
          value={pool.INCOME_REWARD_CENTS}
          onChange={(e) =>
            setAutoPool2x2({ INCOME_REWARD_CENTS: e.target.value })
          }
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="pool2x2-upgrade-reward" className={labelClassName}>
          Upgrade Wallet Reward ($)
        </label>
        <input
          id="pool2x2-upgrade-reward"
          type="number"
          value={pool.UPGRADE_REWARD_CENTS}
          onChange={(e) =>
            setAutoPool2x2({ UPGRADE_REWARD_CENTS: e.target.value })
          }
          className={inputClassName}
        />
      </div>

      <ToggleRow
        label="Allow Burn-GNX Entry"
        hint="Lets users enter by burning previously-purchased GNX on-chain. On by default."
        checked={pool.ENTRY_METHODS.BURN_GNX_ENABLED}
        onChange={(checked) => setEntryMethods({ BURN_GNX_ENABLED: checked })}
      />
      <ToggleRow
        label="Allow Direct-USDT Entry"
        hint="Lets users enter by paying the entry price directly from their deposit wallet. On by default."
        checked={pool.ENTRY_METHODS.DIRECT_USDT_ENABLED}
        onChange={(checked) =>
          setEntryMethods({ DIRECT_USDT_ENABLED: checked })
        }
      />
    </SectionCard>
  );
}
