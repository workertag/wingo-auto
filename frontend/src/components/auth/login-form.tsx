import { api } from "@lib";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useState } from "react";
import { authQueryOptions } from "@/hooks/use-auth";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { userId: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const id = Number(value.userId);
      const { error, response } = await api.auth.login.post({
        userId: id,
        password: value.password,
      });
      if (!response.ok) {
        if (response.status === 403) {
          const body = error?.value as { reason?: string | null } | undefined;
          setServerError(
            body?.reason
              ? `Your account has been blocked: ${body.reason}`
              : "Your account has been blocked.",
          );
        } else {
          setServerError("Invalid User ID or password.");
        }
        return;
      }
      const userRes = await queryClient.fetchQuery(authQueryOptions);
      navigate({
        to: userRes?.data?.roleId === 0 ? "/admin/dashboard" : "/dashboard",
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      <form.Field
        name="userId"
        validators={{
          onChange: ({ value }) => {
            if (!value) return undefined;
            const id = Number(value);
            if (Number.isNaN(id) || id <= 0) return "Enter a valid User ID.";
          },
        }}
      >
        {(field) => (
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center px-1">
              <label
                htmlFor="userId"
                className={`text-xs font-extrabold uppercase tracking-wider transition-colors duration-300 ${
                  focusedField === "userId"
                    ? "text-[var(--gmc-gold-deep)]"
                    : "text-[var(--gmc-mahogany)]/80"
                }`}
              >
                User ID
              </label>
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-[var(--gmc-product-crimson)] font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="size-3.5" />
                  Invalid ID
                </span>
              )}
            </div>
            <div className="relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "userId"
                    ? "text-[var(--gmc-gold-deep)]"
                    : "text-slate-400"
                }`}
              >
                <User className="size-5" />
              </div>
              <input
                id="userId"
                type="number"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur();
                  setFocusedField(null);
                }}
                onFocus={() => setFocusedField("userId")}
                placeholder="Enter your numeric User ID"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 shadow-sm transition-all duration-300 font-sans"
              />
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-[var(--gmc-product-crimson)] font-semibold px-1 pt-0.5">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center px-1">
              <label
                htmlFor="password"
                className={`text-xs font-extrabold uppercase tracking-wider transition-colors duration-300 ${
                  focusedField === "password"
                    ? "text-[var(--gmc-gold-deep)]"
                    : "text-[var(--gmc-mahogany)]/80"
                }`}
              >
                Password
              </label>
            </div>
            <div className="relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "password"
                    ? "text-[var(--gmc-gold-deep)]"
                    : "text-slate-400"
                }`}
              >
                <Lock className="size-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur();
                  setFocusedField(null);
                }}
                onFocus={() => setFocusedField("password")}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 shadow-sm transition-all duration-300 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-colors focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </form.Field>

      {serverError && (
        <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--gmc-product-crimson)] bg-red-50/90 border border-[var(--gmc-product-red)]/30 rounded-2xl p-3.5 text-left animate-fade-in shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-[var(--gmc-product-crimson)]" />
          <span className="font-bold">{serverError}</span>
        </div>
      )}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-bright)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 hover:shadow-2xl hover:shadow-[var(--gmc-gold)]/35 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden relative group mt-2"
          >
            {/* Shimmer Effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

            <span className="flex items-center justify-center gap-2 relative z-10">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Log In with Password</span>
              )}
            </span>
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
