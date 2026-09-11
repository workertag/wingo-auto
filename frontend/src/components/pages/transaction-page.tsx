import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ServerCrash } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { Route } from "@/routes/_user/transactions";
import { transactionColumns } from "./transaction-columns";

export default function TransactionPage() {
  const query = Route.useSearch();
  const { page = 1, size = 15, ...restQuery } = query;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fetch_transaction_list", page, size, restQuery],
    queryFn: async () => {
      const { data } = await api.users.transactions.list.get({
        query: { page, size, ...restQuery },
      });
      if (!data?.data) throw new Error("Failed to fetch transactions.");
      return data.data;
    },
  });

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)]">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl space-y-6 sm:space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-2 h-8 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/40 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 leading-none">
              Transactions
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
              All your wallet transactions
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-amber-200/80 shadow-md shadow-amber-950/5 p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--gmc-gold)] mb-3" />
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Loading transactions…
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ServerCrash className="h-10 w-10 text-rose-500 mb-3 animate-bounce" />
              <p className="text-sm font-bold text-slate-600 mb-3">
                {error instanceof Error
                  ? error.message
                  : "Failed to load data."}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/20 active:scale-[0.97] transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <DataTable
              columns={transactionColumns}
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
                      value: "rank_achievement_income",
                      label: "Rank Achievement Income",
                    },
                    {
                      value: "profit_sharing_income",
                      label: "Profit Sharing Income",
                    },
                    { value: "withdrawal", label: "Withdrawal" },
                    { value: "admin_adjustment", label: "Admin Adjustment" },
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
          )}
        </div>
      </div>
    </div>
  );
}
