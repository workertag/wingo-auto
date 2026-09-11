import { api } from "@lib";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, History, Loader2, Network, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWriteContract, useReadContract } from "wagmi";
import { getContractChainId } from "@/providers/web3-provider";
import { AutoPoolTree } from "./auto-pool-tree";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;

const GNX_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const PHASE_MANAGER_ABI = [
  {
    type: "function",
    name: "getCurrentRoundInfo",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "phase", type: "uint8" },
      { name: "round", type: "uint8" },
      { name: "price", type: "uint256" },
      { name: "allocation", type: "uint256" },
      { name: "sold", type: "uint256" },
      { name: "remaining", type: "uint256" },
      { name: "startTime", type: "uint64" },
      { name: "endTime", type: "uint64" },
      { name: "isActive", type: "bool" },
    ],
  },
] as const;

export default function AutoPoolPage() {
  const queryClient = useQueryClient();
  const { address, chainId: walletChainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const contractChainId = getContractChainId();
  const [isBurning, setIsBurning] = useState(false);

  const { data: onchainRoundInfoRaw } = useReadContract({
    address: import.meta.env.VITE_PHASE_MANAGER_ADDRESS as `0x${string}`,
    abi: PHASE_MANAGER_ABI,
    functionName: "getCurrentRoundInfo",
    chainId: contractChainId,
    query: {
      refetchInterval: 10_000,
    },
  });

  const currentGnxPrice = onchainRoundInfoRaw?.[2]
    ? Number(onchainRoundInfoRaw[2]) / 1e18
    : 0.1;

  const { data: burnQuote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["auto-pool-burn-quote"],
    queryFn: async () => {
      const res = await api.users.pool["2x2"]["burn-quote"].get();
      return res.data?.data ?? null;
    },
    enabled: Boolean(address),
  });

  const { data: pool, isLoading } = useQuery({
    queryKey: ["auto-pool-2x2"],
    queryFn: async () => {
      const res = await api.users.pool["2x2"].get();
      return res.data?.data ?? null;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["auto-pool-2x2-config"],
    queryFn: async () => {
      const res = await api.users["system-config"].get();
      return res.data?.data?.AUTO_POOL_2X2 ?? null;
    },
  });

  const directEntryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.users.pool["2x2"].enter.direct.post();
      if (res.error) {
        throw new Error(
          (res.error.value as { message?: string })?.message ??
          "Failed to enter the auto-pool",
        );
      }
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success("Entered the 2x2 auto-pool!");
      queryClient.invalidateQueries({ queryKey: ["auto-pool-2x2"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const burnEntryMutation = useMutation({
    mutationFn: async (args: { txHash: `0x${string}` }) => {
      const res = await api.users.pool["2x2"].enter.burn.post({
        txHash: args.txHash,
        chainId: contractChainId as 56 | 31337,
      });
      if (res.error) {
        throw new Error(
          (res.error.value as { message?: string })?.message ??
          "Failed to verify the burn",
        );
      }
      return res.data?.data;
    },
    onSuccess: () => {
      localStorage.removeItem("pendingBurnTxHash");
      toast.success("Burn verified - entered the 2x2 auto-pool!");
      queryClient.invalidateQueries({ queryKey: ["auto-pool-2x2"] });
    },
    onError: (err: Error) => {
      if (err.message.includes("already been used for a pool entry")) {
        localStorage.removeItem("pendingBurnTxHash");
        toast.success("Burn verified - entered the 2x2 auto-pool!");
        queryClient.invalidateQueries({ queryKey: ["auto-pool-2x2"] });
      } else {
        toast.error(err.message);
      }
    },
    onSettled: () => setIsBurning(false),
  });

  async function handleBurnEntry() {
    if (!address) {
      openConnectModal?.();
      return;
    }
    setIsBurning(true);
    try {
      if (walletChainId !== contractChainId) {
        await switchChainAsync({ chainId: contractChainId });
      }

      const quoteRes = await api.users.pool["2x2"]["burn-quote"].get();
      if (quoteRes.error || !quoteRes.data?.data) {
        throw new Error(
          (quoteRes.error?.value as { message?: string })?.message ??
          "Could not get a burn quote - do you have enough purchased GNX?",
        );
      }
      const { gnxAmountRequired } = quoteRes.data.data;

      const txHash = await writeContractAsync({
        address: import.meta.env.VITE_GNX_TOKEN_ADDRESS as `0x${string}`,
        abi: GNX_TRANSFER_ABI,
        functionName: "transfer",
        args: [BURN_ADDRESS, BigInt(gnxAmountRequired)],
        chainId: contractChainId,
      });

      localStorage.setItem("pendingBurnTxHash", txHash);
      await burnEntryMutation.mutateAsync({ txHash });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Burn failed");
      setIsBurning(false);
    }
  }

  async function handleRecoverBurn() {
    const txHash = localStorage.getItem("pendingBurnTxHash");
    if (!txHash) return;
    
    setIsBurning(true);
    try {
      await burnEntryMutation.mutateAsync({ txHash: txHash as `0x${string}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recovery failed");
      setIsBurning(false);
    }
  }

  const activePool = pool?.pools?.[0];

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:px-6 lg:px-8 sm:py-8 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/85 py-3 px-2 sm:p-6 shadow-md shadow-amber-950/5">
          <div className="relative z-10 flex items-center gap-2 sm:gap-4.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-50 via-orange-100/50 to-amber-200 border border-amber-300 shadow-md">
              <Network className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--gmc-gold)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">
                2x2 Auto Pool
              </h1>
              <p className="hidden sm:block text-xs lg:text-sm text-slate-600 font-semibold mt-1">
                Enter below root and let the system auto-fill 6 slots below you
                - complete to earn and auto-recycle into a fresh pool.
              </p>
            </div>
          </div>
          <p className="block sm:hidden text-xs lg:text-sm text-slate-600 font-semibold mt-1">
            Enter below root and let the system auto-fill 6 slots below you -
            complete to earn and auto-recycle into a fresh pool.
          </p>
        </div>

        {config &&
          (config.ENTRY_METHODS.BURN_GNX_ENABLED ||
            config.ENTRY_METHODS.DIRECT_USDT_ENABLED) && (
            <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-4">
              <h4 className="text-base font-black text-slate-900">
                Enter for ${(config.ENTRY_PRICE_CENTS / 100).toFixed(2)}
              </h4>
              
              {config.ENTRY_METHODS.BURN_GNX_ENABLED && burnQuote && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-600">Total GNX Required:</span>
                    <span className="font-black text-slate-900">
                      {(Number(burnQuote.gnxAmountRequired) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} GNX
                    </span>
                  </div>
                  
                  {burnQuote.breakdown?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Burn Breakdown</p>
                      {burnQuote.breakdown.map((lot: any, idx: number) => {
                        const lotGnx = Number(lot.gnxAmount) / 1e18;
                        const lotPriceUsd = lot.priceCentsPerGnx / 100;
                        const currentLotValue = lotGnx * currentGnxPrice;
                        
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white border border-slate-100">
                            <div>
                              <span className="font-bold text-slate-700">{lotGnx.toLocaleString(undefined, { maximumFractionDigits: 4 })} GNX</span>
                              <span className="text-slate-500 ml-1">(@ ${lotPriceUsd.toFixed(2)})</span>
                            </div>
                            <div className="text-right flex flex-col">
                              <span className="font-bold text-green-600">Value: ${currentLotValue.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {typeof window !== 'undefined' && localStorage.getItem("pendingBurnTxHash") ? (
                  <button
                    type="button"
                    onClick={handleRecoverBurn}
                    disabled={isBurning}
                    className="flex-1 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isBurning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Network className="w-4 h-4" />
                    )}
                    {isBurning ? "Recovering..." : "Recover Pending Burn"}
                  </button>
                ) : (
                  <>
                    {config.ENTRY_METHODS.BURN_GNX_ENABLED && (
                      <button
                        type="button"
                        onClick={handleBurnEntry}
                        disabled={!!activePool || isBurning || isLoadingQuote || !burnQuote}
                        className="flex-1 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                      >
                        {isBurning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Flame className="w-4 h-4" />
                        )}
                        {!!activePool ? "Active Pool Running" : isBurning ? "Burning..." : "Burn GNX to Enter"}
                      </button>
                    )}
                    {config.ENTRY_METHODS.DIRECT_USDT_ENABLED && (
                      <button
                        type="button"
                        onClick={() => directEntryMutation.mutate()}
                        disabled={!!activePool || directEntryMutation.isPending}
                        className="flex-1 px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                      >
                        {directEntryMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wallet className="w-4 h-4" />
                        )}
                        {!!activePool ? "Active Pool Running" : "Pay from Deposit Wallet"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        {isLoading ? (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 text-center py-12 text-slate-500 animate-pulse text-xs font-semibold">
            Loading your auto-pool...
          </div>
        ) : activePool ? (
          <AutoPoolTree pool={activePool} />
        ) : (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 text-center py-12 px-3 text-slate-500 text-base sm:text-xl font-semibold">
            You have no active auto-pool position yet - enter above to get
            started.
          </div>
        )}

        {pool && pool.history.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md border border-amber-200/80 rounded-3xl shadow-md shadow-amber-950/5 p-6 space-y-3">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History size={18} className="text-[var(--gmc-gold-deep)]" />
              Completed Positions
            </h4>
            <div className="space-y-2">
              {pool.history.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-100 bg-amber-50/20 text-xs font-semibold text-slate-600"
                >
                  <span>Cycle #{position.cycleNumber}</span>
                  <span>
                    {position.completedAt
                      ? new Date(position.completedAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
