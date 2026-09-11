import { api } from "@lib";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  HandCoins,
  Receipt,
  RefreshCw,
  UserCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zManageFundSchema } from "@/_definitions";
import { FieldInfo } from "@/components/forms/field-info";
import { TotpInput } from "@/components/forms/totp-field";
import { adminTransactionColumns } from "@/components/pages/transaction-columns";
import { DataTable } from "@/components/tables/data-table";
import { useUserLookup } from "@/hooks/use-user-lookup";
import { Route } from "@/routes/_admin/admin/funds";

function formatCents(cents: number | undefined) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

const inputClassName =
  "w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm sm:text-base font-semibold placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 shadow-2xs transition-all duration-300";
const labelClassName =
  "text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5";

// Per-field validators giving immediate feedback on the raw (string) form
// inputs. The assembled payload (amount converted to paise) is validated
// one more time against `zManageFundSchema` — the schema mirroring the
// backend's ManageFundSchema field-for-field — right before submission.
const zUserIdInput = z
  .string()
  .regex(/^\d+$/, "User ID is required")
  .refine(
    (v) => Number(v) >= 1_000_000 && Number(v) <= 9_999_999,
    "Invalid User ID",
  );
const zAmountRupeesInput = z
  .string()
  .min(1, "Amount is required")
  .refine((v) => Number(v) >= 1, "Minimum ₹1 is required");
const zOtpInput = z.string().regex(/^\d{6}$/, "OTP is of 6 digits");

export function AdminFundsPage() {
  const queryClient = useQueryClient();

  const query = Route.useSearch();
  const { page = 1, size = 15, ...restQuery } = query;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-transactions-list", page, size, restQuery],
    queryFn: async () => {
      const { data } = await api.admin.transactions.list.get({
        query: { page, size, ...restQuery },
      });
      if (!data?.data) throw new Error("Failed to fetch transactions.");
      return data.data;
    },
  });

  const manageFundMutation = useMutation({
    mutationFn: async (payload: {
      userId: number;
      walletType: "income_wallet" | "deposit_wallet";
      operation: "add" | "remove";
      amount: number;
      description: string | undefined;
      otp: string;
    }) => {
      const res = await api.admin.wallet["manage-funds"].post(payload);
      if (res.error)
        throw new Error(res.error.value?.message || "Failed to adjust fund");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Fund adjustment completed successfully!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["admin-transactions-list"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const form = useForm({
    defaultValues: {
      userId: "",
      walletType: "deposit_wallet" as "deposit_wallet" | "income_wallet",
      operation: "add" as "add" | "remove",
      amountRupees: "",
      description: "",
      otp: "",
    },
    onSubmit: async ({ value }) => {
      const payload = {
        userId: Number(value.userId),
        walletType: value.walletType,
        operation: value.operation,
        amount: Math.round(Number(value.amountRupees) * 100),
        description: value.description || undefined,
        otp: value.otp,
      };
      const result = zManageFundSchema.safeParse(payload);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? "Invalid input");
        return;
      }
      await manageFundMutation.mutateAsync(payload);
    },
  });

  const userIdValue = useStore(form.store, (s) => s.values.userId);
  const {
    user: lookedUpUser,
    isLoading: isUserLoading,
    notFound: userNotFound,
    isValid: isUserIdValid,
  } = useUserLookup(userIdValue, "fund_manager");

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Simple Interactive Admin Header */}
        {/* NATIVE MOBILE LAYOUT */}
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <Coins className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Manage Funds
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
                <Coins className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Manage Funds
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Adjust user wallet balances and inspect transaction logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 relative z-10">
          {/* Adjust Fund Form */}
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-6 text-left">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <HandCoins size={20} className="text-[var(--gmc-gold-deep)]" />
              Adjust User Wallet
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
                  <div>
                    <label htmlFor={field.name} className={labelClassName}>
                      User ID
                    </label>
                    <input
                      id={field.name}
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
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--gmc-gold)]" />
                        Looking up user…
                      </p>
                    )}

                    {isUserIdValid && !isUserLoading && lookedUpUser && (
                      <div className="mt-2 p-3 rounded-xl border border-amber-200 bg-amber-50/20 space-y-1.5">
                        <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {lookedUpUser.name}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            Deposit: {formatCents(lookedUpUser.depositWallet)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            Income: {formatCents(lookedUpUser.incomeWallet)}
                          </span>
                        </div>
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

              <form.Field name="walletType">
                {(field) => (
                  <div>
                    <span className={labelClassName}>Wallet Type</span>
                    <div className="grid grid-cols-2 p-1 gap-1 rounded-xl border border-amber-200/60 bg-amber-50/10">
                      {" "}
                      <button
                        type="button"
                        onClick={() => field.handleChange("deposit_wallet")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          field.state.value === "deposit_wallet"
                            ? "bg-[var(--gmc-mahogany)]/10 border border-[var(--gmc-mahogany)] text-[var(--gmc-mahogany)] shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                        }`}
                      >
                        Deposit Wallet
                      </button>
                      <button
                        type="button"
                        onClick={() => field.handleChange("income_wallet")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          field.state.value === "income_wallet"
                            ? "bg-[var(--gmc-gold)]/10 border border-[var(--gmc-gold)] text-[var(--gmc-gold)] shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                        }`}
                      >
                        Income Wallet
                      </button>
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="operation">
                {(field) => (
                  <div>
                    <span className={labelClassName}>Operation</span>
                    <div className="grid grid-cols-2 p-1 gap-1 rounded-xl border border-amber-200/60 bg-amber-50/10">
                      <button
                        type="button"
                        onClick={() => field.handleChange("add")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          field.state.value === "add"
                            ? "bg-green-600/10 border border-green-600 text-green-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                        }`}
                      >
                        Add Funds
                      </button>
                      <button
                        type="button"
                        onClick={() => field.handleChange("remove")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          field.state.value === "remove"
                            ? "bg-destructive/10 border border-destructive text-destructive shadow-xs"
                            : "text-slate-500 hover:text-slate-800 hover:bg-amber-50/50"
                        }`}
                      >
                        Remove Funds
                      </button>
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="amountRupees"
                validators={{ onChange: zAmountRupeesInput }}
              >
                {(field) => (
                  <div>
                    <label htmlFor={field.name} className={labelClassName}>
                      Amount ($)
                    </label>
                    <input
                      id={field.name}
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={inputClassName}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="md:col-span-2">
                    <label htmlFor={field.name} className={labelClassName}>
                      Description
                    </label>
                    <input
                      id={field.name}
                      type="text"
                      placeholder="Reason for this adjustment"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={inputClassName}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="otp" validators={{ onChange: zOtpInput }}>
                {(field) => (
                  <div>
                    <span className={labelClassName}>Authenticator OTP</span>
                    <TotpInput field={field} className={inputClassName} />
                  </div>
                )}
              </form.Field>

              <div className="md:col-span-2 pt-2">
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-center cursor-pointer"
                    >
                      {isSubmitting
                        ? "Processing Transaction..."
                        : "Confirm Adjustment"}
                    </button>
                  )}
                </form.Subscribe>
              </div>
            </form>
          </div>

          {/* Transactions Listing */}
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-6 text-left">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Receipt size={20} className="text-[var(--gmc-gold-deep)]" />
              All Transactions
            </h4>

            {isError ? (
              <div className="text-center py-8 text-sm font-semibold text-red-500">
                {error instanceof Error
                  ? error.message
                  : "Failed to load transactions."}
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <DataTable
                  columns={adminTransactionColumns}
                  data={data}
                  serverSide
                  sortableColumns={[
                    "createdAt",
                    "amount",
                    "netAmount",
                    "type",
                    "status",
                  ]}
                  filters={[
                    {
                      key: "type",
                      label: "Type",
                      values: [
                        { value: "invest", label: "Invest" },
                        { value: "retopup", label: "Retopup" },
                        { value: "auto_upgrade", label: "Auto Upgrade" },
                        { value: "transfer", label: "Transfer" },
                        { value: "swap", label: "Swap" },
                        { value: "level_income", label: "Level Income" },
                        { value: "booster_income", label: "Booster Income" },
                        { value: "direct_income", label: "Direct Income" },
                        {
                          value: "retopup_bonus_income",
                          label: "Retopup Bonus Income",
                        },
                        {
                          value: "rank_achievement_income",
                          label: "Rank Achievement Income",
                        },
                        {
                          value: "profit_sharing_income",
                          label: "Profit Sharing Income",
                        },
                        { value: "withdrawal", label: "Withdrawal" },
                        {
                          value: "admin_adjustment",
                          label: "Admin Adjustment",
                        },
                        { value: "deposit", label: "Deposit" },
                      ],
                    },
                    {
                      key: "status",
                      label: "Status",
                      values: [
                        { value: "completed", label: "Completed" },
                        { value: "pending", label: "Pending" },
                        { value: "failed", label: "Failed" },
                      ],
                    },
                    {
                      key: "fromWalletType",
                      label: "From Wallet",
                      values: [
                        { value: "income_wallet", label: "Income Wallet" },
                        { value: "deposit_wallet", label: "Deposit Wallet" },
                      ],
                    },
                    {
                      key: "toWalletType",
                      label: "To Wallet",
                      values: [
                        { value: "income_wallet", label: "Income Wallet" },
                        { value: "deposit_wallet", label: "Deposit Wallet" },
                      ],
                    },
                  ]}
                />
              </div>
            )}
            {isLoading && (
              <div className="text-center py-4 text-sm text-slate-500 animate-pulse">
                Loading transactions…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
