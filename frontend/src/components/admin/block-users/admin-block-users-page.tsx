import { api } from "@lib";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zBlockUserSchema, zUnblockUserSchema } from "@/_definitions";
import { FieldInfo } from "@/components/forms/field-info";
import { TotpInput } from "@/components/forms/totp-field";
import { useUserLookup } from "@/hooks/use-user-lookup";

const inputClassName =
  "w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm font-semibold placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 shadow-2xs transition-all duration-300";
const labelClassName =
  "text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5";

const zUserIdInput = z
  .string()
  .regex(/^\d+$/, "User ID is required")
  .refine(
    (v) => Number(v) >= 1_000_000 && Number(v) <= 9_999_999,
    "Invalid User ID",
  );
const zOtpInput = z.string().regex(/^\d{6}$/, "OTP is of 6 digits");

export function AdminBlockUsersPage() {
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: async (payload: {
      userId: number;
      reason: string | undefined;
      expiresAt: string | undefined;
      otp: string;
    }) => {
      const res = await api.admin.block.block.post(payload);
      if (res.error)
        throw new Error(res.error.value?.message || "Failed to block user");
      return res.data;
    },
    onSuccess: () => {
      toast.success("User has been blocked.");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["user-lookup"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unblockMutation = useMutation({
    mutationFn: async (payload: {
      userId: number;
      reason: string | undefined;
      otp: string;
    }) => {
      const res = await api.admin.block.unblock.post(payload);
      if (res.error)
        throw new Error(res.error.value?.message || "Failed to unblock user");
      return res.data;
    },
    onSuccess: () => {
      toast.success("User has been unblocked.");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["user-lookup"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const form = useForm({
    defaultValues: {
      userId: "",
      action: "block" as "block" | "unblock",
      reason: "",
      expiresAt: "",
      otp: "",
    },
    onSubmit: async ({ value }) => {
      if (value.action === "block") {
        const payload = {
          userId: Number(value.userId),
          reason: value.reason || undefined,
          expiresAt: value.expiresAt
            ? new Date(value.expiresAt).toISOString()
            : undefined,
          otp: value.otp,
        };
        const result = zBlockUserSchema.safeParse(payload);
        if (!result.success) {
          toast.error(result.error.issues[0]?.message ?? "Invalid input");
          return;
        }
        await blockMutation.mutateAsync(payload);
        return;
      }

      const payload = {
        userId: Number(value.userId),
        reason: value.reason || undefined,
        otp: value.otp,
      };
      const result = zUnblockUserSchema.safeParse(payload);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? "Invalid input");
        return;
      }
      await unblockMutation.mutateAsync(payload);
    },
  });

  const userIdValue = useStore(form.store, (s) => s.values.userId);
  const actionValue = useStore(form.store, (s) => s.values.action);
  const {
    user: lookedUpUser,
    isLoading: isUserLoading,
    notFound: userNotFound,
    isValid: isUserIdValid,
  } = useUserLookup(userIdValue, "block_manager");

  const blockStatus = lookedUpUser?.blockStatus ?? null;
  const isCurrentlyBlocked =
    blockStatus?.state === "blocked" &&
    (!blockStatus.expiresAt || new Date(blockStatus.expiresAt) > new Date());

  const isSubmitting = blockMutation.isPending || unblockMutation.isPending;

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)] text-left">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[60rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-fade-in-up">
        {/* Simple Interactive Admin Header */}
        {/* NATIVE MOBILE LAYOUT */}
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <ShieldOff className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Block Users
              </h2>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 p-6 shadow-md shadow-amber-950/5 text-slate-800">
          {/* Background radial glow */}
          <div className="absolute top-1/2 left-1/4 w-[350px] h-[150px] bg-amber-100/50 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4.5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
                <ShieldOff className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Block Users
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Block or unblock a user's account. Blocked users are logged
                  out immediately, cannot log back in, cannot receive income,
                  and cannot receive incoming fund transfers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-amber-200/80 bg-white/90 backdrop-blur-md shadow-md shadow-amber-950/5 space-y-6 text-left relative z-10">
          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-[var(--gmc-gold-deep)]" />
            Manage Account Status
          </h4>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <form.Field name="userId" validators={{ onChange: zUserIdInput }}>
              {(field) => (
                <div className="md:col-span-2">
                  <label className={labelClassName} htmlFor="block-user-id">
                    User ID
                  </label>
                  <input
                    id="block-user-id"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1000001"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={inputClassName}
                  />
                  <FieldInfo field={field} />

                  {isUserIdValid && isUserLoading && (
                    <p className="mt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-[var(--gmc-gold)]" />
                      Looking up user…
                    </p>
                  )}

                  {isUserIdValid && !isUserLoading && lookedUpUser && (
                    <div className="mt-2 p-3 rounded-xl border border-amber-200 bg-amber-50/20 space-y-1.5">
                      <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {lookedUpUser.name}
                      </p>
                      <p className="text-[11px] font-semibold flex items-center gap-1.5">
                        {isCurrentlyBlocked ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <ShieldOff className="w-3 h-3 text-red-500" />
                            Currently blocked
                            {blockStatus?.reason
                              ? ` — ${blockStatus.reason}`
                              : ""}
                            {blockStatus?.expiresAt
                              ? ` (until ${new Date(blockStatus.expiresAt).toLocaleString()})`
                              : " (permanent)"}
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Currently active
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {isUserIdValid && !isUserLoading && userNotFound && (
                    <p className="mt-1.5 text-xs text-destructive font-semibold">
                      User not found.
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="action">
              {(field) => (
                <div className="md:col-span-2">
                  <span className={labelClassName}>Action</span>
                  <div className="grid grid-cols-2 p-1 gap-1 rounded-xl border border-amber-200 bg-amber-50/20">
                    <button
                      type="button"
                      onClick={() => field.handleChange("block")}
                      className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        field.state.value === "block"
                          ? "bg-red-600/10 border border-red-600 text-red-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                      }`}
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      onClick={() => field.handleChange("unblock")}
                      className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        field.state.value === "unblock"
                          ? "bg-green-600/10 border border-green-600 text-green-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                      }`}
                    >
                      Unblock
                    </button>
                  </div>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="reason">
              {(field) => (
                <div className={actionValue === "block" ? "" : "md:col-span-2"}>
                  <label className={labelClassName} htmlFor="block-reason">
                    Reason
                  </label>
                  <input
                    id="block-reason"
                    type="text"
                    placeholder="Reason for this action"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={inputClassName}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            {actionValue === "block" && (
              <form.Field name="expiresAt">
                {(field) => (
                  <div>
                    <label
                      className={labelClassName}
                      htmlFor="block-expires-at"
                    >
                      Blocked Until (optional, leave empty for permanent)
                    </label>
                    <input
                      id="block-expires-at"
                      type="datetime-local"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={inputClassName}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            )}

            <form.Field name="otp" validators={{ onChange: zOtpInput }}>
              {(field) => (
                <div className="md:col-span-2">
                  <span className={labelClassName}>Authenticator OTP</span>
                  <TotpInput field={field} className={inputClassName} />
                </div>
              )}
            </form.Field>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-center cursor-pointer"
              >
                {isSubmitting
                  ? "Processing…"
                  : actionValue === "block"
                    ? "Confirm Block"
                    : "Confirm Unblock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
