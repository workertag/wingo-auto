import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Lock, Receipt, Upload, Wallet2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { adminWithdrawalColumns } from "@/components/pages/withdrawal-columns";
import { DataTable } from "@/components/tables/data-table";
import { Route } from "@/routes/_admin/admin/withdrawals";

const inputClassName =
  "w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm font-semibold placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 shadow-2xs transition-all duration-300";
const labelClassName =
  "text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5";

export function AdminWithdrawalPage() {
  const queryClient = useQueryClient();
  const query = Route.useSearch();
  const { page = 1, size = 15, ...restQuery } = query;

  // CSV Prefix Settlement state
  const [settleCsvPrefix, setSettleCsvPrefix] = useState("");
  const [settleCsvTxHashes, setSettleCsvTxHashes] = useState("");

  // Blocking User state
  const [blockUserId, setBlockUserId] = useState("");
  const [blockedAt, setBlockedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["withdrawals-list", page, size, restQuery],
    queryFn: async () => {
      const { data } = await api.admin.withdrawals.list.get({
        query: { page, size, ...restQuery },
      });
      if (!data?.data) throw new Error("Failed to fetch withdrawals.");
      return data.data;
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      const uid = Number.parseInt(blockUserId, 10);
      if (Number.isNaN(uid)) throw new Error("Invalid User ID");
      if (!blockedAt || !expiresAt) throw new Error("Dates must be defined");
      const res = await api.admin.withdrawals.block.post({
        userId: uid,
        blockedAt: new Date(blockedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
      });
      if (res.error)
        throw new Error(res.error.value?.message || "Failed to block user");
      return res.data;
    },
    onSuccess: () => {
      toast.success(`User #${blockUserId} withdrawal block updated!`);
      setBlockUserId("");
      setBlockedAt("");
      setExpiresAt("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const settleCsvMutation = useMutation({
    mutationFn: async () => {
      if (!settleCsvPrefix) throw new Error("Prefix required");
      let txHashes: Array<{ id: string; txHash: string }>;
      try {
        txHashes = JSON.parse(settleCsvTxHashes);
      } catch {
        throw new Error(
          'Tx hashes must be valid JSON: [{"id":"...","txHash":"0x..."}]',
        );
      }
      const res = await api.admin.withdrawals["settle-csv"].post({
        prefix: settleCsvPrefix,
        txHashes,
      });
      if (res.error)
        throw new Error(res.error.value?.message || "CSV settlement failed");
      return res.data;
    },
    onSuccess: () => {
      toast.success("CSV batch settlement processed!");
      setSettleCsvPrefix("");
      setSettleCsvTxHashes("");
      queryClient.invalidateQueries({ queryKey: ["withdrawals-list"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const downloadPendingCsv = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals/pending-csv", {
        headers: { "Content-Type": "text/csv" },
      });
      if (!res.ok) throw new Error("Failed to download pending CSV");
      const blob = await res.blob();
      const filename =
        res.headers.get("Content-Disposition")?.split("filename=")[1] ||
        "pending_withdrawals.csv";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/"/g, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Pending CSV downloaded!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)] text-left">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-fade-in-up">
        {/* Simple Interactive Admin Header */}
        {/* NATIVE MOBILE LAYOUT */}
        <div className="sm:hidden flex items-center justify-between p-4 rounded-3xl bg-white/95 border border-amber-200/40 shadow-md shadow-amber-950/5 text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-100/60 to-amber-100/80 border border-amber-300 shadow-2xs flex items-center justify-center">
              <Wallet2Icon className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Withdrawal Settlements
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
                <Wallet2Icon className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Withdrawal Settlements
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Process user withdrawal requests, download pending CSV
                  reports, and manage individual withdrawal locks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 items-start text-left relative z-10">
          <div className="p-6 rounded-3xl border border-amber-200/80 bg-white/90 backdrop-blur-md shadow-md shadow-amber-950/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-[var(--gmc-gold-deep)]" />
                Settlement Operations
              </h4>
              <button
                onClick={downloadPendingCsv}
                type="button"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black text-[var(--gmc-mahogany)] bg-amber-50/50 border border-amber-200/80 hover:bg-amber-100/50 hover:text-[var(--gmc-mahogany-dark)] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Download size={14} className="text-[var(--gmc-gold-deep)]" />
                Download Pending CSV
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-500 animate-pulse font-medium text-xs">
                Loading withdrawals list…
              </div>
            ) : isError ? (
              <div className="py-12 text-center text-slate-500 font-medium text-xs">
                {error instanceof Error ? error.message : "Failed to load"}
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <DataTable
                  columns={adminWithdrawalColumns}
                  data={data}
                  serverSide
                  sortableColumns={[
                    "createdAt",
                    "amount",
                    "status",
                    "closedAt",
                  ]}
                  filters={[
                    {
                      key: "status",
                      label: "Status",
                      values: [
                        { value: "pending", label: "Pending" },
                        { value: "success", label: "Success" },
                        { value: "rejected", label: "Rejected" },
                      ],
                    },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 sm:gap-6  space-y-6">
            <div className="p-6 rounded-3xl border border-amber-200/80 bg-white/90 backdrop-blur-md shadow-md shadow-amber-950/5 space-y-4">
              <h4 className="text-sm sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                <Upload size={16} className="text-[var(--gmc-gold-deep)]" />
                Settle via CSV Batch
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                Provide the batch prefix and the tx hash for each withdrawal id
                in the batch once your payout run confirms on-chain.
              </p>
              <div className="space-y-3.5">
                <div>
                  <label className={labelClassName} htmlFor="settle-csv-prefix">
                    Batch Prefix
                  </label>
                  <input
                    id="settle-csv-prefix"
                    type="text"
                    placeholder="Batch prefix (e.g. withdrawal_...)"
                    value={settleCsvPrefix}
                    onChange={(e) => setSettleCsvPrefix(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label
                    className={labelClassName}
                    htmlFor="settle-csv-tx-hashes"
                  >
                    Tx Hashes (JSON)
                  </label>
                  <textarea
                    id="settle-csv-tx-hashes"
                    placeholder='[{"id":"...","txHash":"0x..."}]'
                    value={settleCsvTxHashes}
                    onChange={(e) => setSettleCsvTxHashes(e.target.value)}
                    rows={4}
                    className={`${inputClassName} font-mono text-xs`}
                  />
                </div>
                <button
                  onClick={() => settleCsvMutation.mutate()}
                  disabled={settleCsvMutation.isPending}
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-center cursor-pointer"
                >
                  {settleCsvMutation.isPending
                    ? "Processing settlement..."
                    : "Settle CSV Batch"}
                </button>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-amber-200/80 bg-white/90 backdrop-blur-md shadow-md shadow-amber-950/5 space-y-4">
              <h4 className="text-sm sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                <Lock size={16} className="text-[var(--gmc-mahogany)]" />
                Block User Withdrawals
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                Lock withdrawal access for individual user IDs for specific
                periods.
              </p>
              <div className="space-y-3.5">
                <div>
                  <label
                    className={labelClassName}
                    htmlFor="block-withdrawal-user-id"
                  >
                    User ID
                  </label>
                  <input
                    id="block-withdrawal-user-id"
                    type="number"
                    placeholder="e.g. 1000001"
                    value={blockUserId}
                    onChange={(e) => setBlockUserId(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className={labelClassName}
                      htmlFor="block-withdrawal-start"
                    >
                      Block Start
                    </label>
                    <input
                      id="block-withdrawal-start"
                      type="datetime-local"
                      value={blockedAt}
                      onChange={(e) => setBlockedAt(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label
                      className={labelClassName}
                      htmlFor="block-withdrawal-expiry"
                    >
                      Expiry Date
                    </label>
                    <input
                      id="block-withdrawal-expiry"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <button
                  onClick={() => blockUserMutation.mutate()}
                  disabled={blockUserMutation.isPending}
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-mahogany)] to-[var(--gmc-mahogany-light)] hover:from-[var(--gmc-mahogany-light)] hover:to-[var(--gmc-mahogany)] shadow-md shadow-[var(--gmc-mahogany)]/25 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-center cursor-pointer"
                >
                  {blockUserMutation.isPending
                    ? "Locking Account..."
                    : "Apply Lock Limit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
