import { api } from "@lib";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authQueryOptions } from "@/hooks/use-auth";

function useReferrerName(code: string) {
  const [name, setName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = code.trim();
    if (trimmed.length < 3) {
      setName(null);
      return;
    }
    setChecking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.auth.reference({ code: trimmed }).get();
        const referrer = data && "data" in data ? data.data.user : undefined;
        if (referrer) {
          const fullName =
            `${referrer.profile?.firstName ?? ""}${referrer.profile?.lastName ? ` ${referrer.profile.lastName}` : ""}`.trim();
          setName(fullName || `Member #${referrer.id}`);
        } else {
          setName(null);
        }
      } catch {
        setName(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code]);

  return { name, checking };
}

interface CommitFormProps {
  initialReferenceCode?: string;
  pendingWallet?: string | null;
  clearPendingWallet: () => void;
}

export default function CommitForm({
  initialReferenceCode = "",
  pendingWallet,
  clearPendingWallet,
}: CommitFormProps) {
  const isReferralLocked = !!initialReferenceCode;
  const [refCode, setRefCode] = useState(initialReferenceCode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { name: referrerName, checking } = useReferrerName(refCode);

  const maskedWallet = pendingWallet
    ? `${pendingWallet.slice(0, 10)}…${pendingWallet.slice(-8)}`
    : null;

  const isCodeValid = !!referrerName && !checking;
  const canSubmit = isCodeValid && !submitting && refCode.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);

    try {
      const { response, error: apiError } = await api.auth.register.post({
        code: refCode.toUpperCase(),
      });

      if (!response.ok) {
        setError(
          (apiError as { value?: { message?: string } })?.value?.message ??
            "Registration failed. Please try again.",
        );
        return;
      }

      setSuccess(true);
      clearPendingWallet();
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions.queryKey,
      });
      navigate({ to: "/profile" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Connected Wallet Notice */}
      {maskedWallet && (
        <div className="rounded-2xl p-4 text-xs sm:text-sm flex gap-3 items-start text-left bg-amber-50/90 border border-[var(--gmc-gold)]/30 text-slate-700 shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-[var(--gmc-gold-deep)] mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[var(--gmc-gold-deep)]">
              Wallet Connected
            </h4>
            <p className="font-mono text-xs sm:text-sm font-bold text-[var(--gmc-mahogany-dark)] break-all">
              {pendingWallet}
            </p>
          </div>
        </div>
      )}

      {/* Referral Code Input */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="referenceCode"
          className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
        >
          <Users className="size-4 text-[var(--gmc-gold-deep)]" />
          Referral Code
          <span className="text-[var(--gmc-product-crimson)] ml-0.5">*</span>
          {isReferralLocked && (
            <LockKeyhole className="size-3.5 text-slate-400" />
          )}
        </label>

        <div className="relative">
          <input
            id="referenceCode"
            type="text"
            value={refCode}
            onChange={
              isReferralLocked
                ? undefined
                : (e) => {
                    setRefCode(e.target.value.toUpperCase());
                    setError(null);
                  }
            }
            readOnly={isReferralLocked}
            placeholder="e.g. ABC123"
            maxLength={8}
            autoComplete="off"
            className={`w-full px-4 py-3.5 rounded-2xl border text-sm sm:text-base font-mono outline-none transition-all duration-300 pr-10 shadow-sm ${
              isReferralLocked
                ? "bg-amber-50/50 border-[var(--gmc-gold)]/20 text-slate-500 cursor-not-allowed"
                : isCodeValid
                  ? "bg-white border-emerald-500 text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                  : "bg-white/90 border-[var(--gmc-gold)]/25 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15"
            }`}
          />
          {/* Validity indicator */}
          {refCode.trim().length >= 3 && !checking && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {isCodeValid ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <AlertCircle className="size-5 text-[var(--gmc-product-crimson)]" />
              )}
            </div>
          )}
          {checking && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="size-5 animate-spin text-[var(--gmc-gold-deep)]" />
            </div>
          )}
        </div>

        {/* Feedback row */}
        <div className="min-h-[20px] px-1 pt-0.5">
          {checking && (
            <p className="text-xs text-slate-500 font-medium">
              Checking referral code…
            </p>
          )}
          {!checking && isCodeValid && (
            <p className="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Invited by: {referrerName}
            </p>
          )}
          {!checking && refCode.trim().length >= 3 && !referrerName && (
            <p className="text-xs text-[var(--gmc-product-crimson)] font-bold flex items-center gap-1">
              <AlertCircle className="size-3.5 text-[var(--gmc-product-crimson)]" />
              Invalid referral code — please check and try again
            </p>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl p-4 text-xs leading-relaxed text-left bg-amber-50/60 border border-[var(--gmc-gold)]/20 text-slate-600 space-y-1 shadow-xs">
        <p className="font-extrabold text-[var(--gmc-mahogany-dark)] uppercase tracking-wider text-[10px]">
          Why a referral code?
        </p>
        <p className="font-normal text-slate-600">
          This platform is invitation-only. Enter either of the two referral
          codes an existing member shared with you — each code automatically
          places you on that member's matching side of the community network.
        </p>
      </div>

      {/* API Error */}
      {error && (
        <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--gmc-product-crimson)] bg-red-50/90 border border-[var(--gmc-product-red)]/30 rounded-2xl p-3.5 text-left shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-[var(--gmc-product-crimson)]" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Success feedback */}
      {success && (
        <div className="flex items-center gap-3 text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-500/30 rounded-2xl p-3.5 text-left font-bold shadow-sm">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <span>Account created! Redirecting to profile setup…</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit || success}
        className="w-full py-4 rounded-2xl text-white font-extrabold text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-bright)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 hover:shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 overflow-hidden relative group"
      >
        {/* Shimmer */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

        <span className="flex items-center justify-center gap-2 relative z-10">
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Creating Account…</span>
            </>
          ) : (
            <span>Continue to Profile Setup →</span>
          )}
        </span>
      </button>

      <p className="text-center text-[11px] leading-relaxed font-semibold text-slate-400 pt-2 border-t border-[var(--gmc-gold)]/10">
        By joining, you agree to the platform's community rules and terms of
        use.
      </p>
    </form>
  );
}
