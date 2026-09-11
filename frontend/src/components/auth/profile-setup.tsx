import { api } from "@lib";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { FieldInfo } from "@/components/forms/field-info";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authQueryOptions } from "@/hooks/use-auth";

const zProfile = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100),
  email: z.string().email("Enter a valid email"),
  mobileCode: z.string().regex(/^\+\d{1,4}$/, "e.g. +1, +91"),
  mobile: z.string().regex(/^\d{7,15}$/, "7–15 digits, no spaces or dashes"),
  countryId: z.number().int().min(1, "Select a country"),
});

function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data } = await api.countries.get();
      if (!data?.data) throw new Error("Countries could not be loaded");
      return data.data;
    },
    staleTime: Infinity,
  });
}

interface ProfileSetupProps {
  clearPendingWallet: () => void;
}

export default function ProfileSetup({
  clearPendingWallet,
}: ProfileSetupProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: countries = [] } = useCountries();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // OTP Verification State
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileCode: "+27",
      mobile: "",
      countryId: 0,
    },
    validators: {
      onSubmit: zProfile,
    },
    onSubmit: async ({ value }) => {
      if (!emailVerified) {
        setSubmitError("Please verify your email address before continuing.");
        return;
      }

      const payload = {
        firstName: value.firstName,
        lastName: value.lastName || undefined,
        email: value.email,
        mobileCode: value.mobileCode,
        mobile: value.mobile,
        countryId: value.countryId,
      };

      const { response, error: apiError } =
        await api.users.profile.post(payload);
      if (!response.ok) {
        setSubmitError(
          (apiError as { value?: { message?: string } })?.value?.message ??
            "Failed to save profile. Please try again.",
        );
        return;
      }
      setSubmitError(null);

      clearPendingWallet();
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions.queryKey,
      });
      const userRes = await queryClient.fetchQuery(authQueryOptions);
      if (userRes?.data?.roleId === 0) {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    },
  });

  const emailValue = useStore(form.store, (s) => s.values.email);

  // Reset OTP states if email is modified after sending
  useEffect(() => {
    if (otpSent && !emailVerified) {
      setOtpSent(false);
      setOtpError(null);
      setOtpSuccess(null);
      setOtpCode("");
    }
  }, [emailValue]);

  async function handleSendOtp() {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setOtpError("Enter a valid email first.");
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const { response, error } = await api.users.otp.send.post({
        email: emailValue,
        type: "email_verify",
      });

      if (!response.ok) {
        const errorMsg =
          (error as { value?: { message?: string } })?.value?.message ??
          "Failed to send code.";
        setOtpError(errorMsg);
        return;
      }

      setOtpSent(true);
      setOtpSuccess("Verification code sent to your email!");
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length < 4) {
      setOtpError("Enter a valid verification code.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const { response, error } = await api.users.otp.verify.post({
        email: emailValue,
        type: "email_verify",
        code: otpCode.trim(),
      });

      if (!response.ok) {
        const errorMsg =
          (error as { value?: { message?: string } })?.value?.message ??
          "Invalid or expired code.";
        setOtpError(errorMsg);
        return;
      }

      setEmailVerified(true);
      setOtpSuccess("Email verified successfully!");
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  const selectedCountryId = useStore(form.store, (s) => s.values.countryId);
  const selectedCountry = countries.find((c) => c.id === selectedCountryId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      {/* First & Last Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First Name */}
        <form.Field name="firstName">
          {(field) => (
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="firstName"
                className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
              >
                First Name{" "}
                <span className="text-[var(--gmc-product-crimson)]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="firstName"
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 shadow-sm transition-all duration-300 font-semibold"
                />
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {/* Last Name */}
        <form.Field name="lastName">
          {(field) => (
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="lastName"
                className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
              >
                Last Name{" "}
                <span className="text-slate-400 text-[10px] font-medium lowercase">
                  (optional)
                </span>
              </label>
              <input
                id="lastName"
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter your last name"
                className="w-full px-4 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 shadow-sm transition-all duration-300 font-semibold"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      {/* Email Address with OTP Verify */}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
            >
              Email Address{" "}
              <span className="text-[var(--gmc-product-crimson)]">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  disabled={emailVerified}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 shadow-sm transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={emailVerified || sendingOtp || !field.state.value}
                className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-1.5"
              >
                {sendingOtp && <Loader2 className="size-4 animate-spin" />}
                <span>
                  {sendingOtp
                    ? "Sending…"
                    : otpSent
                      ? "Resend Code"
                      : "Send Verify Code"}
                </span>
              </button>
            </div>
            <FieldInfo field={field} />

            {/* OTP Verification input block */}
            {otpSent && !emailVerified && (
              <div className="mt-3 p-4 rounded-2xl border border-[var(--gmc-gold)]/30 bg-amber-50/80 space-y-2 animate-fade-in shadow-xs">
                <label
                  htmlFor="otpCode"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] px-1"
                >
                  Enter Verification Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="123456"
                    className="flex-1 px-4 py-2.5 rounded-2xl border text-sm sm:text-base font-mono tracking-widest text-center bg-white border-[var(--gmc-gold)]/30 text-slate-800 placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 transition-all duration-300 font-bold shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length < 4}
                    className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    {verifyingOtp && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    <span>{verifyingOtp ? "Verifying…" : "Verify"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* OTP Status Messages */}
            {otpError && (
              <p className="text-xs text-[var(--gmc-product-crimson)] font-bold pl-1">
                {otpError}
              </p>
            )}
            {otpSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold pl-1">
                <Check className="size-4 shrink-0 text-emerald-600" />
                <span>{otpSuccess}</span>
              </div>
            )}
            {emailVerified && !otpSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold pl-1">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                <span>Email verified successfully</span>
              </div>
            )}
          </div>
        )}
      </form.Field>

      {/* Country Selection Custom Dropdown */}
      <form.Field name="countryId">
        {(field) => (
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="countryId"
              className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
            >
              Country{" "}
              <span className="text-[var(--gmc-product-crimson)]">*</span>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="countryId"
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-[var(--gmc-gold)]/25 bg-white/90 text-slate-800 text-sm sm:text-base font-semibold outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <span className="text-slate-800">
                    {selectedCountry
                      ? `${selectedCountry.emoji} ${selectedCountry.name}`
                      : "Select a country…"}
                  </span>
                  <ChevronDown className="size-4.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-y-auto w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-[var(--gmc-gold)]/30 rounded-2xl p-1.5 shadow-2xl z-50 text-slate-800">
                {countries.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => {
                      field.handleChange(c.id);
                      form.setFieldValue("mobileCode", c.dialCode);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:text-[var(--gmc-mahogany-dark)] hover:bg-amber-50 rounded-xl cursor-pointer transition-all duration-150"
                  >
                    <span className="text-base shrink-0">{c.emoji}</span>
                    <span className="font-semibold truncate">{c.name}</span>
                    <span className="ml-auto text-xs text-slate-400 font-mono">
                      {c.dialCode}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Mobile Number inputs */}
      <div className="space-y-1.5 text-left">
        <label
          htmlFor="mobile"
          className="text-xs font-extrabold uppercase tracking-wider text-[var(--gmc-mahogany-dark)] flex items-center gap-1.5 px-1"
        >
          Mobile Number{" "}
          <span className="text-[var(--gmc-product-crimson)]">*</span>
        </label>
        <div className="flex gap-2">
          {/* Dial code */}
          <form.Field name="mobileCode">
            {(field) => (
              <div className="flex flex-col gap-1 w-24 shrink-0">
                <input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1"
                  className="w-full px-3 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base font-mono bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 transition-all duration-300 font-semibold text-center shadow-sm"
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          {/* Number */}
          <form.Field name="mobile">
            {(field) => (
              <div className="flex flex-col gap-1 flex-1">
                <div className="relative w-full">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    id="mobile"
                    type="tel"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="712345678"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl border text-slate-800 text-sm sm:text-base bg-white/90 border-[var(--gmc-gold)]/25 placeholder-slate-400 outline-none focus:bg-white focus:border-[var(--gmc-gold)] focus:ring-4 focus:ring-[var(--gmc-gold)]/15 transition-all duration-300 font-semibold shadow-sm"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--gmc-product-crimson)] bg-red-50/90 border border-[var(--gmc-product-red)]/30 rounded-2xl p-3.5 text-left shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-[var(--gmc-product-crimson)]" />
          <span className="font-bold">{submitError}</span>
        </div>
      )}

      {/* Save profile submit button */}
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !emailVerified}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-bright)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 hover:shadow-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 overflow-hidden relative group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Saving Profile…</span>
                </>
              ) : (
                <span>Save Profile & Continue</span>
              )}
            </button>
            {!emailVerified && (
              <p className="text-[11px] leading-relaxed font-semibold text-center text-slate-400 pt-2 border-t border-[var(--gmc-gold)]/10">
                Email verification is required before you can complete the
                profile setup.
              </p>
            )}
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
