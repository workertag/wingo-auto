import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ToggleLeft, ToggleRight, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const inputClassName =
  "w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm font-semibold placeholder-slate-400 outline-none focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 shadow-2xs transition-all duration-300";
const labelClassName =
  "text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5";

export function AdminWalletPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Create state
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");

  // Query
  const { data: list, isLoading } = useQuery({
    queryKey: ["deposit-addresses"],
    queryFn: async () => {
      const res = await api.admin["deposit-addresses"].get();
      return res.data?.data ?? [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!address.match(/^0x[a-fA-F0-9]{40}$/))
        throw new Error("Invalid EVM Wallet Address");
      const res = await api.admin["deposit-addresses"].post({
        address,
        label: label || undefined,
      });
      if (res.error)
        throw new Error(
          res.error.value?.message || "Failed to add deposit address",
        );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Deposit address registered successfully!");
      setModalOpen(false);
      setAddress("");
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["deposit-addresses"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.admin["deposit-addresses"]({ id }).patch({
        isActive,
      });
      if (res.error)
        throw new Error(res.error.value?.message || "Failed to update status");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Address status updated!");
      queryClient.invalidateQueries({ queryKey: ["deposit-addresses"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Wallet Address copied to clipboard!");
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
              <Wallet className="w-6 h-6 text-[var(--gmc-gold)]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Admin Area
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                Deposit Wallets
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
                <Wallet className="w-8 h-8 text-[var(--gmc-gold)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Deposit Wallets
                </h1>
                <p className="text-xs text-slate-600 font-semibold max-w-xl leading-normal">
                  Configure and adjust the platform's deposit addresses for
                  investment plans and P2P cycles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Configured Cards Container */}
        <div className="p-6 rounded-3xl border border-amber-200/80 bg-white/90 backdrop-blur-md shadow-md shadow-amber-950/5 space-y-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wallet size={20} className="text-[var(--gmc-gold-deep)]" />
              Configured Wallet Addresses
            </h4>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all active:scale-[0.98] text-center cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add Deposit Address
            </button>
          </div>

          {/* Grid List */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse font-medium text-xs">
              Loading deposit wallets…
            </div>
          ) : list && list.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-amber-100 bg-white shadow-2xs hover:border-[var(--gmc-gold)]/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gmc-mahogany)] bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/40">
                        Platform Deposit
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: item.id,
                            isActive: !item.isActive,
                          })
                        }
                        className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                        title={
                          item.isActive
                            ? "Deactivate address"
                            : "Activate address"
                        }
                      >
                        {item.isActive ? (
                          <ToggleRight className="text-green-500 h-6 w-6 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="text-slate-450 h-6 w-6 cursor-pointer" />
                        )}
                      </button>
                    </div>
                    <h5 className="text-sm sm:text-base font-black text-slate-900 mt-2">
                      {item.label || "System Wallet"}
                    </h5>

                    <div className="mt-4 p-3 rounded-xl bg-amber-50/40 border border-amber-100 font-mono text-xs font-semibold text-slate-700 break-all select-all relative flex justify-between items-center group/copy">
                      <span className="truncate max-w-[200px]">
                        {item.address}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.address)}
                        className="text-[10px] font-black uppercase text-[var(--gmc-gold-deep)] hover:text-[var(--gmc-gold-ochre)] ml-2 transition-colors cursor-pointer shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3.5 mt-2 border-t border-slate-100 font-semibold">
                    <span className="text-[10px] text-slate-500">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.isActive
                          ? "bg-green-600/10 border border-green-600 text-green-600 shadow-xs"
                          : "bg-slate-200 text-slate-500 border border-slate-300"
                      }`}
                    >
                      {item.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-medium text-xs">
              No deposit addresses registered
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-start justify-center p-4 py-10 sm:py-24 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-amber-200/80 bg-white p-6 shadow-2xl relative text-left animate-scale-in">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4.5 right-4.5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            <h4 className="text-lg font-black text-slate-900 mb-6">
              Register New Deposit Address
            </h4>

            <div className="space-y-4">
              <div>
                <label className={labelClassName} htmlFor="deposit-address">
                  EVM Address (USDT BEP-20)
                </label>
                <input
                  id="deposit-address"
                  type="text"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="deposit-address-label"
                >
                  Custom Label
                </label>
                <input
                  id="deposit-address-label"
                  type="text"
                  placeholder="e.g. Binance Escrow Plan Wallet"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="w-full mt-4 px-4 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all active:scale-[0.98] text-center cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending
                  ? "Registering Wallet..."
                  : "Add Wallet Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
