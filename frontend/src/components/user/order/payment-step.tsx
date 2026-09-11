import {
  BV_PER_UNIT,
  PRODUCT_NAME,
  PRODUCT_UNIT_PRICE_USDT,
} from "@api/lib/constants/product";
import "@rainbow-me/rainbowkit/styles.css";
import { api } from "@lib";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BaseError,
  ContractFunctionRevertedError,
  formatUnits,
  parseUnits,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { useTxPreview } from "@/hooks/use-tx-preview";
import { getContractChainId, RainbowKitSetup } from "@/providers/web3-provider";
import {
  useOrderActions,
  useOrderDeliveryMethod,
  useOrderSelectedAddressId,
  useOrderUnits,
} from "@/stores/order-store";

function getUsdtAddress(): `0x${string}` {
  if (import.meta.env.VITE_ENV === "production") {
    return "0x55d398326f99059fF775485246999027B3197955";
  }
  return (
    (import.meta.env.VITE_MOCK_USDT_ADDRESS as `0x${string}`) ||
    "0x0b93E76b5f6C6EBCF9C914eF9E853a059972E7E5"
  );
}

const REVERT_ERRORS_ABI = [
  {
    type: "error",
    name: "ERC20InsufficientBalance",
    inputs: [
      { name: "sender", type: "address" },
      { name: "balance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "ERC20InsufficientAllowance",
    inputs: [
      { name: "spender", type: "address" },
      { name: "allowance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
  },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
  { type: "error", name: "SaleEnded", inputs: [] },
  { type: "error", name: "SaleNotStarted", inputs: [] },
  {
    type: "error",
    name: "InsufficientAllocation",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "balance", type: "uint256" },
    ],
  },
] as const;

const REVERT_ERROR_MESSAGES: Record<string, string> = {
  ERC20InsufficientBalance:
    "Your wallet doesn't have enough USDT to cover this purchase.",
  ERC20InsufficientAllowance:
    "USDT spending approval is missing or too low. Please try again.",
  EnforcedPause: "Token sale is currently paused. Please try again later.",
  ReentrancyGuardReentrantCall:
    "Please wait for the current transaction to finish.",
  ZeroAmount: "Purchase amount must be greater than zero.",
  SaleEnded: "The token sale has ended.",
  SaleNotStarted: "The token sale hasn't started yet.",
  InsufficientAllocation:
    "Not enough GNX allocation remains to fulfill this purchase.",
};

function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof BaseError) {
    const revertError = err.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    );
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName && REVERT_ERROR_MESSAGES[errorName]) {
        return REVERT_ERROR_MESSAGES[errorName];
      }
    }
    return err.shortMessage || err.message;
  }
  return (err as { message?: string })?.message || "Transaction failed";
}

const TOKEN_SALE_ABI = [
  {
    type: "function",
    name: "buy",
    stateMutability: "nonpayable",
    inputs: [{ name: "usdtAmount", type: "uint256" }],
    outputs: [],
  },
  ...REVERT_ERRORS_ABI,
] as const;

const USDT_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  ...REVERT_ERRORS_ABI,
] as const;

type Phase =
  | "idle"
  | "approving"
  | "waiting_approval"
  | "buying"
  | "waiting_buy"
  | "submitting";

export default function PaymentStep() {
  return (
    <RainbowKitSetup>
      <PaymentStepInner />
    </RainbowKitSetup>
  );
}

function PaymentStepInner() {
  const units = useOrderUnits();
  const deliveryMethod = useOrderDeliveryMethod();
  const selectedAddressId = useOrderSelectedAddressId();
  const { setTxHash, setOrderId, nextStep, previousStep, reset } =
    useOrderActions();

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const { confirm, dialog: previewDialog } = useTxPreview();

  const {
    address: connectedAddress,
    isConnected,
    chainId: walletChainId,
  } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeBuyTokens } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const contractChainId = getContractChainId();
  const tokenSaleAddress = import.meta.env
    .VITE_TOKEN_SALE_ADDRESS as `0x${string}`;
  const treasuryManagerAddress = import.meta.env
    .VITE_TREASURY_MANAGER_ADDRESS as `0x${string}`;

  const totalPrice = units * PRODUCT_UNIT_PRICE_USDT;
  const totalBv = units * BV_PER_UNIT;
  const usdtAmountNeeded = parseUnits(totalPrice.toString(), 18);

  async function refreshUsdtBalance() {
    if (!publicClient || !connectedAddress) {
      setUsdtBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const balance = await publicClient.readContract({
        address: getUsdtAddress(),
        abi: USDT_APPROVE_ABI,
        functionName: "balanceOf",
        args: [connectedAddress],
      });
      setUsdtBalance(balance);
    } catch {
      setUsdtBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }

  useEffect(() => {
    refreshUsdtBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, publicClient, contractChainId]);

  const hasInsufficientBalance =
    usdtBalance !== null && usdtBalance < usdtAmountNeeded;

  const purchaseMutation = useMutation({
    mutationFn: async (variables: { txHash: `0x${string}` }) => {
      const { data, error } = await api.users.orders.purchase.post({
        units,
        deliveryMethod,
        addressId:
          deliveryMethod === "shipping" && selectedAddressId
            ? selectedAddressId
            : undefined,
        txHash: variables.txHash,
        chainId: contractChainId as 56 | 31337,
      });
      if (error) {
        throw new Error(error.value?.message ?? "Order verification failed.");
      }
      return data;
    },
    onSuccess: (data) => {
      localStorage.removeItem("pendingOrderTxHash");
      toast.success("Order placed successfully!", { id: "order-tx" });
      setPhase("idle");
      setOrderId(data?.data?.order?.id ?? null);
      nextStep();
    },
    onError: (err: Error) => {
      if (err.message.includes("already been used for an order")) {
        localStorage.removeItem("pendingOrderTxHash");
        toast.success("Order placed successfully!", { id: "order-tx" });
        setPhase("idle");
        // We might not have the order ID if it was recovered, but we can still proceed
        nextStep();
      } else {
        setErrorMessage(err.message);
        toast.error(err.message, { id: "order-tx" });
        setPhase("idle");
      }
    },
  });

  async function handlePayAndBuy() {
    setErrorMessage(null);
    try {
      if (!isConnected || !connectedAddress) {
        openConnectModal?.();
        return;
      }

      if (walletChainId !== contractChainId) {
        toast.loading("Switching to correct network...", { id: "order-tx" });
        await switchChainAsync({ chainId: contractChainId });
      }

      const currentBalance = publicClient
        ? await publicClient.readContract({
            address: getUsdtAddress(),
            abi: USDT_APPROVE_ABI,
            functionName: "balanceOf",
            args: [connectedAddress],
          })
        : null;
      setUsdtBalance(currentBalance);
      if (currentBalance === null || currentBalance < usdtAmountNeeded) {
        const message =
          "Your wallet doesn't have enough USDT to cover this purchase.";
        setErrorMessage(message);
        toast.error(message, { id: "order-tx" });
        return;
      }

      const usdtAmount = usdtAmountNeeded;

      const approveParams = {
        address: getUsdtAddress(),
        abi: USDT_APPROVE_ABI,
        functionName: "approve",
        args: [treasuryManagerAddress, usdtAmount],
        chainId: contractChainId,
        account: connectedAddress,
      } as const;

      const confirmed = await confirm({
        title: "Review Purchase",
        description:
          "Two on-chain steps will run: approving USDT spending, then purchasing on-chain. GNX rewards are sent straight to your wallet.",
        rows: [
          { label: "Product", value: `${units} × ${PRODUCT_NAME}` },
          { label: "Total", value: `${totalPrice} USDT` },
          { label: "BV Earned", value: `${totalBv} BV` },
        ],
        simulate: () =>
          publicClient
            ? publicClient.simulateContract(approveParams)
            : Promise.reject(new Error("Provider not ready.")),
      });
      if (!confirmed) return;

      setPhase("approving");
      toast.loading("Approving USDT...", { id: "order-tx" });
      const approveHash = await writeApprove(approveParams);

      setPhase("waiting_approval");
      toast.loading("Waiting for approval confirmation...", {
        id: "order-tx",
      });
      try {
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({
            hash: approveHash,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      const buyParams = {
        address: tokenSaleAddress,
        abi: TOKEN_SALE_ABI,
        functionName: "buy",
        args: [usdtAmount],
        chainId: contractChainId,
        account: connectedAddress,
      } as const;

      if (publicClient) {
        await publicClient.simulateContract(buyParams);
      }

      setPhase("buying");
      toast.loading("Purchasing GMC Mito C Care...", { id: "order-tx" });
      const buyHash = await writeBuyTokens(buyParams);

      setPhase("waiting_buy");
      toast.loading("Waiting for purchase confirmation...", {
        id: "order-tx",
      });
      try {
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: buyHash });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      setTxHash(buyHash);
      setPhase("submitting");
      toast.loading("Confirming order...", { id: "order-tx" });
      localStorage.setItem("pendingOrderTxHash", buyHash);
      await purchaseMutation.mutateAsync({ txHash: buyHash });
    } catch (err) {
      setPhase("idle");
      const message = getFriendlyErrorMessage(err);
      setErrorMessage(message);
      toast.error(message, { id: "order-tx" });
      refreshUsdtBalance();
    }
  }

  async function handleRecoverOrder() {
    const txHash = localStorage.getItem("pendingOrderTxHash");
    if (!txHash) return;
    
    setPhase("submitting");
    toast.loading("Recovering pending order...", { id: "order-tx" });
    try {
      await purchaseMutation.mutateAsync({ txHash: txHash as `0x${string}` });
    } catch (err) {
      setPhase("idle");
      // Note: Error handling and success is mostly managed inside purchaseMutation
    }
  }

  const isBusy = phase !== "idle" || purchaseMutation.isPending;

  const phaseLabel: Record<Phase, string> = {
    idle: "",
    approving: "Approving USDT Spending…",
    waiting_approval: "Waiting for allowance verification…",
    buying: "Confirming Contract Purchase…",
    waiting_buy: "Awaiting blockchain confirmation…",
    submitting: "Registering database order…",
  };

  const isStepApproveDone =
    phase === "buying" ||
    phase === "waiting_buy" ||
    phase === "submitting" ||
    phase === "waiting_approval";
  const isStepApproveActive =
    phase === "approving" || phase === "waiting_approval";
  const isStepBuyActive =
    phase === "buying" || phase === "waiting_buy" || phase === "submitting";

  // Wallet address string formatting
  const shortenedAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
    : "";

  return (
    <>
      {previewDialog}
      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:grid grid-cols-12 gap-8 items-start max-w-4xl mx-auto text-left">
        <div className="col-span-5 space-y-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-amber-200/40 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Order Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">
                  {PRODUCT_NAME}
                </span>
                <span className="font-bold text-slate-800">{units} × $100</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">
                  Rewards Claim
                </span>
                <span className="font-bold text-emerald-600">
                  +{totalBv} BV (GNX)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Shipping</span>
                <span className="font-bold text-slate-800 capitalize">
                  {deliveryMethod === "self_collect"
                    ? "Self Collect"
                    : "Couried"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Total
                </span>
                <span className="text-2xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                  ${totalPrice} USDT
                </span>
              </div>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-amber-500/[0.03] border border-amber-200 bg-amber-50/10 flex gap-3 items-start">
            <Lock className="w-5 h-5 text-[var(--gmc-gold-deep)] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Transactions are signed directly via your connected Web3 browser
              wallet. The smart contract validates funds and dispenses GNX
              rewards instantly upon settlement.
            </p>
          </div>
        </div>

        <div className="col-span-7 space-y-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-amber-200/40 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-[var(--gmc-mahogany-dark)] font-serif uppercase tracking-wider">
              Settlement Ledger
            </h3>

            {/* Wallet Panel */}
            {!isConnected ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.02] to-amber-100/[0.1] border border-dashed border-amber-300 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-[var(--gmc-gold-deep)]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">
                    Web3 Wallet Connection Required
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Connect your BSC-compatible wallet to perform on-chain
                    approval and secure the product.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Account Node
                    </div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {shortenedAddress}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      BSC Ledger
                    </div>
                    <div className="font-bold text-slate-700 mt-0.5">
                      {balanceLoading && usdtBalance === null
                        ? "Querying…"
                        : usdtBalance !== null
                          ? `$${Number(formatUnits(usdtBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`
                          : "—"}
                    </div>
                  </div>
                </div>

                {hasInsufficientBalance && !errorMessage && (
                  <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/50 flex gap-2.5 items-start text-xs text-red-700 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Insufficient USDT: Your wallet holds $
                      {Number(formatUnits(usdtBalance ?? 0n, 18)).toFixed(2)}{" "}
                      USDT. This purchase requires ${totalPrice} USDT.
                    </span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/50 flex gap-2.5 items-start text-xs text-red-700 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Secure timeline for transactions */}
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    On-Chain Transaction Sequence
                  </span>

                  <div className="space-y-3">
                    {/* Step 1: Approve Allowance */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isStepApproveDone
                              ? "bg-emerald-100 text-emerald-600"
                              : isStepApproveActive
                                ? "bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] animate-pulse"
                                : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {isStepApproveDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            "1"
                          )}
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${isStepApproveDone ? "text-slate-500 line-through" : "text-slate-800"}`}
                          >
                            Approve USDT spending limit
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Authorizes the token sale manager contract.
                          </p>
                        </div>
                      </div>
                      {isStepApproveActive && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--gmc-gold)]" />
                      )}
                    </div>

                    {/* Step 2: Buy */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isStepBuyActive
                              ? "bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] animate-pulse"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          "2"
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            Execute smart contract purchase
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Calls on-chain buy order and claims GNX rewards.
                          </p>
                        </div>
                      </div>
                      {isStepBuyActive && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--gmc-gold)]" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={isBusy}
                    className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 active:scale-95 transition-all cursor-pointer border border-slate-200"
                  >
                    Back
                  </button>
                  {typeof window !== 'undefined' && localStorage.getItem("pendingOrderTxHash") ? (
                    <button
                      type="button"
                      onClick={handleRecoverOrder}
                      disabled={isBusy}
                      className="flex-1 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/25 disabled:opacity-60 disabled:pointer-events-none cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {isBusy ? "Recovering..." : "Recover Pending Order"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePayAndBuy}
                      disabled={isBusy || hasInsufficientBalance}
                      className="flex-1 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 disabled:opacity-60 disabled:pointer-events-none cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{phaseLabel[phase] || "Processing…"}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Sign Order</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* <button
            type="button"
            onClick={() => reset()}
            disabled={isBusy}
            className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest disabled:opacity-40 cursor-pointer pt-2"
          >
            Cancel Order
          </button> */}
        </div>
      </div>

      {/* ── MOBILE VIEW ── */}
      <div className="md:hidden flex flex-col space-y-4 pb-24 text-left">
        {/* Dynamic breakdown card */}
        <div className="mx-1 p-4 rounded-3xl bg-white border border-amber-950/5 shadow-xs space-y-3.5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Ledger Details
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">
                {PRODUCT_NAME}
              </span>
              <span className="font-bold text-slate-800">{units} × $100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">
                Wellness Rewards
              </span>
              <span className="font-bold text-emerald-600">
                +{totalBv} BV (GNX)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">
                Delivery Option
              </span>
              <span className="font-bold text-slate-800 capitalize">
                {deliveryMethod === "self_collect"
                  ? "Vault Collection"
                  : "Shipping courier"}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Price
              </span>
              <span className="text-xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                ${totalPrice} USDT
              </span>
            </div>
          </div>
        </div>

        {/* Web3 Wallet Settlement Row */}
        <div className="mx-1">
          {!isConnected ? (
            <button
              type="button"
              onClick={() => openConnectModal?.()}
              className="w-full p-5 rounded-3xl bg-gradient-to-br from-amber-500/[0.02] to-amber-100/[0.1] border border-dashed border-amber-200 flex flex-col items-center justify-center text-center space-y-3 shadow-xs cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 text-[var(--gmc-gold-deep)] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Connect Web3 Wallet
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                  Required to sign blockchain allowance approvals and execute
                  the buy smart contract.
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Account summary pill */}
              <div className="p-4 rounded-3xl bg-white border border-amber-950/5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[var(--gmc-gold-deep)]" />
                    <span className="font-mono font-bold text-slate-800">
                      {shortenedAddress}
                    </span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-100/50">
                  <span className="text-slate-400 font-semibold">
                    BSC Balance:
                  </span>
                  <span
                    className={`font-mono font-bold ${hasInsufficientBalance ? "text-red-600" : "text-slate-700"}`}
                  >
                    {balanceLoading && usdtBalance === null
                      ? "Querying…"
                      : usdtBalance !== null
                        ? `$${Number(formatUnits(usdtBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`
                        : "—"}
                  </span>
                </div>
              </div>

              {hasInsufficientBalance && !errorMessage && (
                <div className="p-3.5 rounded-2xl border border-red-100 bg-red-50 text-[11px] text-red-700 leading-relaxed">
                  Your wallet only holds $
                  {Number(formatUnits(usdtBalance ?? 0n, 18)).toFixed(2)} USDT.
                  This purchase requires ${totalPrice} USDT.
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-2xl border border-red-100 bg-red-50 text-[11px] text-red-700 leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {/* Native timeline */}
              <div className="space-y-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  On-Chain Handshake Sequence
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white shadow-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isStepApproveDone
                            ? "bg-emerald-100 text-emerald-600"
                            : isStepApproveActive
                              ? "bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] animate-pulse"
                              : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isStepApproveDone ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          "1"
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${isStepApproveDone ? "text-slate-400 line-through" : "text-slate-700"}`}
                      >
                        Approve USDT allowance
                      </span>
                    </div>
                    {isStepApproveActive && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--gmc-gold)]" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white shadow-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isStepBuyActive
                            ? "bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] animate-pulse"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        "2"
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        Sign smart contract buy order
                      </span>
                    </div>
                    {isStepBuyActive && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--gmc-gold)]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile Bottom CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex flex-col gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={previousStep}
              disabled={isBusy}
              className="px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 disabled:opacity-40 active:scale-95 transition-all"
            >
              Back
            </button>

            {isConnected ? (
              typeof window !== 'undefined' && localStorage.getItem("pendingOrderTxHash") ? (
                <button
                  type="button"
                  onClick={handleRecoverOrder}
                  disabled={isBusy}
                  className="flex-[2] py-3.5 rounded-xl text-xs sm:text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/25 disabled:opacity-60 disabled:pointer-events-none cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isBusy ? "Recovering..." : "Recover Pending Order"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayAndBuy}
                  disabled={isBusy || hasInsufficientBalance}
                  className="flex-[2] py-3.5 rounded-xl text-[11px] font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] shadow-md shadow-[var(--gmc-gold)]/25 disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{phaseLabel[phase] || "Processing…"}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Sign Order</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => openConnectModal?.()}
                className="flex-1 py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
          {/* <button
            type="button"
            onClick={() => reset()}
            disabled={isBusy}
            className="text-[9px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest disabled:opacity-40 cursor-pointer self-center"
          >
            Cancel Order
          </button> */}
        </div>
      </div>
    </>
  );
}
