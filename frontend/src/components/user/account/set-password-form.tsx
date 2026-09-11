import { api } from "@lib";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authQueryOptions, useAuth } from "@/hooks/use-auth";

export default function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isMinLength = password.length >= 8;
  const isMatching = password === confirm && password.length > 0;
  const canSubmit = isMinLength && isMatching;

  const copyToClipboard = async (text: string, field: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (_err) {}

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, 999999);

        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (_err) {}
    }

    if (success) {
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error(`Failed to copy ${field}. Please copy manually.`);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isMinLength) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { response } = await api.users.password.post({ password });
      if (!response.ok) {
        setError("Failed to set password. Please try again.");
        return;
      }
      setSuccess(true);
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions.queryKey,
      });
      const userRes = await queryClient.fetchQuery(authQueryOptions);
      const isAdmin = userRes?.data?.roleId === 0;
      setTimeout(
        () => navigate({ to: isAdmin ? "/admin/dashboard" : "/dashboard" }),
        2000,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-amber-200/40 p-8 rounded-[2.2rem] shadow-md text-center space-y-6 animate-scale-up">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-650 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="size-8 animate-bounce text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Password Set Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
            Your credentials have been configured. Redirecting you back to the
            dashboard...
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <div className="w-8 h-8 border-3 border-[var(--gmc-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl p-4 sm:p-8 sm:shadow-md text-left relative overflow-hidden transition-all duration-300 max-w-2xl mx-auto w-full">
      {/* Background radial highlight (Desktop only) */}
      <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-[var(--gmc-gold)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8 pl-1 sm:pl-0">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[var(--gmc-gold-deep)] flex items-center justify-center border border-amber-100 shrink-0 shadow-2xs">
          <KeyRound className="size-5.5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 leading-none">
            Set Password
          </h2>
          {/* Interactive UID badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-600 bg-amber-50/70 border border-amber-200/60 shadow-3xs leading-none">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
              ID:
            </span>
            <span className="font-mono font-extrabold text-[var(--gmc-gold-deep)]">
              #{user?.id ?? "—"}
            </span>
            <button
              type="button"
              onClick={() =>
                user?.id && copyToClipboard(String(user.id), "User ID")
              }
              className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ml-0.5"
              title="Copy User ID"
            >
              {copiedField === "User ID" ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        {/* iOS-Style settings grouping block for mobile, transparent on desktop */}
        <div className="bg-white sm:bg-transparent rounded-2xl sm:rounded-none border border-slate-100 sm:border-0 shadow-2xs sm:shadow-none p-4 sm:p-0 space-y-4">
          {/* New Password */}
          <div className="space-y-1.5 text-left">
            <label
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 block pl-0.5"
              htmlFor="new-password"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-4 pr-11 py-3 rounded-xl border text-sm bg-amber-50/5 border-amber-200/60 text-slate-800 placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-sans font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5 text-left">
            <label
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 block pl-0.5"
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-4 pr-11 py-3 rounded-xl border text-sm bg-amber-50/5 border-amber-200/60 text-slate-800 placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/5 transition-all font-sans font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Validation Checklist */}
        <div className="bg-amber-100/20 border border-amber-100/70 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors duration-300 border ${
                isMinLength
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <Check className="size-3" strokeWidth={3} />
            </div>
            <span
              className={`text-xs font-bold transition-colors duration-300 ${
                isMinLength ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              At least 8 characters
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors duration-300 border ${
                isMatching
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <Check className="size-3" strokeWidth={3} />
            </div>
            <span
              className={`text-xs font-bold transition-colors duration-300 ${
                isMatching ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              Passwords match
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-left">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-550" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider text-white transition-all duration-200 active:scale-100 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed border border-amber-200/20
            enabled:bg-gradient-to-r enabled:from-[var(--gmc-gold)] enabled:to-[var(--gmc-gold-amber)] enabled:hover:shadow-md enabled:hover:scale-[1.01]
            disabled:bg-slate-200/60 disabled:text-slate-400 disabled:border-slate-200"
        >
          {submitting ? "Saving Password…" : "Set Password Credentials"}
        </button>
      </form>
    </div>
  );
}
