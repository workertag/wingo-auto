import { Landmark, Save } from "lucide-react";
import { useAdminSystemConfigFormStore } from "@/stores/admin-system-config-form-store";
import { inputClassName, labelClassName, validateOtp } from "../form-utils";
import { FieldError } from "../section-card";

export function OtpSubmitSection({ isSubmitting }: { isSubmitting: boolean }) {
  const otp = useAdminSystemConfigFormStore((s) => s.values.otp);
  const setOtp = useAdminSystemConfigFormStore((s) => s.setOtp);
  const otpError = otp ? validateOtp(otp) : undefined;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4 text-left">
      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
        <Landmark size={20} className="text-[var(--gmc-gold-deep)]" />
        Confirm With Admin OTP
      </h4>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div>
          <span className={labelClassName}>Authenticator OTP</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className={`${inputClassName} font-mono tracking-[0.3em] text-center`}
          />
          <FieldError message={otpError} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <Save size={14} />
          {isSubmitting ? "Saving Configuration..." : "Save System Config"}
        </button>
      </div>
    </div>
  );
}
