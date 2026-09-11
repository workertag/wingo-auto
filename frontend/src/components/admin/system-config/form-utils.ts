import type { SystemConfigFormValues } from "@/stores/admin-system-config-form-store";

export const inputClassName =
  "w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm sm:text-base font-semibold placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 shadow-2xs transition-all duration-300";
export const labelClassName =
  "text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5";

export function dollarStrToCents(v: string) {
  return Math.round((Number(v) || 0) * 100);
}

export function bpsHint(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return `${(n / 100).toFixed(2)}%`;
}

/** Non-null once invalid, used for the small inline error line under an
 * input - mirrors the backend's own bounds, checked again field-for-field
 * against `zUpdateSystemConfigSchema` right before submission. */
export function validateBps(v: string): string | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 10_000
    ? undefined
    : "Must be an integer between 0 and 10000";
}

export function validateNonNegativeInt(v: string): string | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0
    ? undefined
    : "Must be a non-negative integer";
}

export function validateOtp(v: string): string | undefined {
  return /^\d{6}$/.test(v) ? undefined : "OTP is of 6 digits";
}

export function buildSystemConfigPayload(value: SystemConfigFormValues) {
  return {
    INCOME: { LIMIT_MULTIPLE: Number(value.INCOME.LIMIT_MULTIPLE) || 0 },
    WITHDRAWAL: {
      MIN_AMOUNT: dollarStrToCents(value.WITHDRAWAL.MIN_AMOUNT),
      FEE_BPS: Number(value.WITHDRAWAL.FEE_BPS) || 0,
      COOLOFF_PERIOD_IN_HOURS:
        Number(value.WITHDRAWAL.COOLOFF_PERIOD_IN_HOURS) || 0,
    },
    CONVERT_FEE_BPS: Number(value.CONVERT_FEE_BPS) || 0,
    LEVEL_INCOME: {
      MIN_LEG: Number(value.LEVEL_INCOME.MIN_LEG) || 0,
      BUSINESS_RATIO: value.LEVEL_INCOME.BUSINESS_RATIO.map(
        (v) => Number(v) || 0,
      ) as [number, number, number],
    },
    BOOSTER_INCOME: {
      DAYS_LIMIT: Number(value.BOOSTER_INCOME.DAYS_LIMIT) || 0,
      MULTIPLE: Number(value.BOOSTER_INCOME.MULTIPLE) || 0,
      REQUIRED_REFERRALS: Number(value.BOOSTER_INCOME.REQUIRED_REFERRALS) || 0,
    },
    DIRECT_INCOME: {
      COUNT_ON_RETOPUP: value.DIRECT_INCOME.COUNT_ON_RETOPUP,
      RETOPUP_BPS: Number(value.DIRECT_INCOME.RETOPUP_BPS) || 0,
    },
    RANK_ACHIEVEMENT: {
      QUALIFICATION_DAYS:
        Number(value.RANK_ACHIEVEMENT.QUALIFICATION_DAYS) || 0,
      STAR_BUSINESS_REQUIRED: dollarStrToCents(
        value.RANK_ACHIEVEMENT.STAR_BUSINESS_REQUIRED,
      ),
      LEGS_REQUIRED: Number(value.RANK_ACHIEVEMENT.LEGS_REQUIRED) || 0,
    },
    CRON: {
      MATCHING_BONUS_JOB_ENABLED: value.CRON.MATCHING_BONUS_JOB_ENABLED,
      PURCHASE_SCANNER_ENABLED: value.CRON.PURCHASE_SCANNER_ENABLED,
      AUTH_SESSION_CLEANUP_ENABLED: value.CRON.AUTH_SESSION_CLEANUP_ENABLED,
    },
    AUTO_POOL_2X2: {
      ENTRY_PRICE_CENTS: dollarStrToCents(
        value.AUTO_POOL_2X2.ENTRY_PRICE_CENTS,
      ),
      INCOME_REWARD_CENTS: dollarStrToCents(
        value.AUTO_POOL_2X2.INCOME_REWARD_CENTS,
      ),
      UPGRADE_REWARD_CENTS: dollarStrToCents(
        value.AUTO_POOL_2X2.UPGRADE_REWARD_CENTS,
      ),
      MAX_AUTO_RECYCLES: Number(value.AUTO_POOL_2X2.MAX_AUTO_RECYCLES) || 0,
      ENTRY_METHODS: {
        BURN_GNX_ENABLED: value.AUTO_POOL_2X2.ENTRY_METHODS.BURN_GNX_ENABLED,
        DIRECT_USDT_ENABLED:
          value.AUTO_POOL_2X2.ENTRY_METHODS.DIRECT_USDT_ENABLED,
      },
    },
    EXCLUSIVE_POOL: {
      ELIGIBILITY: {
        MIN_ACTIVE_DIRECTS:
          Number(value.EXCLUSIVE_POOL.ELIGIBILITY.MIN_ACTIVE_DIRECTS) || 0,
        MIN_OWN_BUSINESS_CENTS: dollarStrToCents(
          value.EXCLUSIVE_POOL.ELIGIBILITY.MIN_OWN_BUSINESS_CENTS,
        ),
      },
      ENTRY_METHODS: {
        DIRECT_USDT_ENABLED:
          value.EXCLUSIVE_POOL.ENTRY_METHODS.DIRECT_USDT_ENABLED,
      },
      LEVELS: value.EXCLUSIVE_POOL.LEVELS.map((level) => ({
        level: level.level,
        packageCents: dollarStrToCents(level.packageCents),
        teamRequired: Number(level.teamRequired) || 0,
        turnoverCents: dollarStrToCents(level.turnoverCents),
        upgradeCents: dollarStrToCents(level.upgradeCents),
        incomeCents: dollarStrToCents(level.incomeCents),
        adminFeeCents: dollarStrToCents(level.adminFeeCents),
        directPct: Number(level.directPct) || 0,
        placementPct: Number(level.placementPct) || 0,
      })),
    },
    otp: value.otp,
  };
}
