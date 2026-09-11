import { Link } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowRight,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { CircularProgress } from "@/components/ui/circular-progress";
import { getContractChainId } from "@/providers/web3-provider";
import { useWalletAddress } from "@/stores/auth-store";

const BALANCE_OF_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const VESTING_LOCKED_ABI = [
  {
    type: "function",
    name: "getTotalLocked",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
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

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface WalletSectionProps {
  // biome-ignore lint/suspicious/noExplicitAny: API typing
  user?: any;
}

export function WalletSection({ user }: WalletSectionProps) {
  // Dummy wallet data fallback (since backend API for new wallet structure is not ready)
  const depositWalletBalance = user?.wallet?.depositWallet ?? 345000; // $3,450.00 in cents
  const incomeWalletBalance = user?.wallet?.incomeWallet ?? 128450; // $1,284.50 in cents

  // Use the actually connected MetaMask wallet (wagmi), with backend profile as fallback
  const { address: connectedAddress } = useAccount();
  const profileWalletAddress = useWalletAddress();
  const walletAddr =
    connectedAddress ?? (profileWalletAddress as `0x${string}` | undefined);
  const contractChainId = getContractChainId();

  // Read real GNX balance from the blockchain
  const { data: onchainGnxBalanceRaw } = useReadContract({
    address: import.meta.env.VITE_GNX_TOKEN_ADDRESS as `0x${string}`,
    abi: BALANCE_OF_ABI,
    functionName: "balanceOf",
    args: walletAddr ? [walletAddr] : undefined,
    chainId: contractChainId,
    query: {
      enabled: Boolean(walletAddr),
      refetchInterval: 10_000,
    },
  });

  const { data: onchainLockedBalanceRaw } = useReadContract({
    address: import.meta.env.VITE_GNX_TOKEN_ADDRESS as `0x${string}`,
    abi: VESTING_LOCKED_ABI,
    functionName: "getTotalLocked",
    args: walletAddr ? [walletAddr] : undefined,
    chainId: contractChainId,
    query: {
      enabled: Boolean(walletAddr),
      refetchInterval: 10_000,
    },
  });

  const { data: onchainRoundInfoRaw } = useReadContract({
    address: import.meta.env.VITE_PHASE_MANAGER_ADDRESS as `0x${string}`,
    abi: PHASE_MANAGER_ABI,
    functionName: "getCurrentRoundInfo",
    chainId: contractChainId,
    query: {
      refetchInterval: 10_000,
    },
  });

  const onchainGnxBalance =
    onchainGnxBalanceRaw !== undefined
      ? Number(onchainGnxBalanceRaw) / 1e18
      : 0;

  const onchainLockedBalance =
    onchainLockedBalanceRaw !== undefined
      ? Number(onchainLockedBalanceRaw) / 1e18
      : 0;

  // Parse dynamic price from PhaseManager (index 2 is price)
  const currentGnxPrice = onchainRoundInfoRaw?.[2]
    ? Number(onchainRoundInfoRaw[2]) / 1e18
    : 0.1; // fallback to 0.1 if loading or failed

  const totalGnxBalance = onchainGnxBalance;

  // GNX Token wallet stats
  const tokenWallet = {
    gnxBalance: totalGnxBalance,
    priceUsd: currentGnxPrice,
    usdEquivalent: totalGnxBalance * currentGnxPrice,
    change24h: "+8.4%",
    stakedAmount: 0.0,
    lockedAmount: onchainLockedBalance,
  };

  const totalIncome = user?.lifetimeWallet?.totalIncome ?? 1485000; // $14,850.00
  const incomeLimit = user?.lifetimeWallet?.incomeLimit ?? 3000000; // $30,000.00
  const progress =
    incomeLimit > 0 ? Math.min(100, (totalIncome / incomeLimit) * 100) : 49.5;
  const remainingLimit = Math.max(0, incomeLimit - totalIncome);

  return (
    <div
      className="space-y-6 animate-fade-in-up"
      style={{ animationDelay: "100ms" }}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-7 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/40" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 leading-none">
              My Wallets
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage your GNX Tokens, Accrued Incomes, and Deposit Balance
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout of 3 Interactive Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. TOKEN WALLET CARD */}
        <div className="group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/40 to-amber-100/20 shadow-md hover:shadow-xl hover:border-[var(--gmc-gold)]">
          {/* Top corner gradient glow */}
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-[var(--gmc-gold)]/20 via-amber-200/30 to-transparent blur-[30px]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white flex items-center justify-center shadow-md shadow-[var(--gmc-gold)]/25">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    GMC Asset
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Token Wallet
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs">
                {tokenWallet.change24h}
              </span>
            </div>

            {/* Token Balance */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {tokenWallet.gnxBalance.toLocaleString()}
                </span>
                <span className="text-xs font-black text-[var(--gmc-gold-deep)] uppercase tracking-wider">
                  GNX
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                ≈ ${tokenWallet.usdEquivalent.toLocaleString()} USD (@ $
                {tokenWallet.priceUsd}/GNX)
              </p>
            </div>

            {/* Micro Details */}
            <div className="pt-3 border-t border-amber-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Locked/Vested:
                </span>
                <span className="font-bold text-amber-700 font-mono">
                  {tokenWallet.lockedAmount.toLocaleString()} GNX
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Liquid/Staked:
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {onchainGnxBalance.toLocaleString()} GNX
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. INCOME WALLET CARD */}
        <div className="group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/20 shadow-md hover:shadow-xl hover:border-emerald-500">
          {/* Top corner gradient glow */}
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-emerald-400/20 via-teal-200/30 to-transparent blur-[30px]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Withdrawal Ready
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Income Wallet
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 border border-emerald-200 shadow-2xs">
                Withdrawable
              </span>
            </div>

            {/* Income Balance */}
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {formatCents(incomeWalletBalance)}
              </span>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Lifetime Earned: {formatCents(totalIncome)}
              </p>
            </div>

            {/* Micro Details */}
            <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Auto Payouts:</span>
              <span className="font-bold text-emerald-700">Instant EVM</span>
            </div>

            {/* Action Link */}
            <Link
              to="/withdraw"
              className="inline-flex items-center justify-between w-full p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-800 transition-all"
            >
              <span>Withdraw Funds</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3. DEPOSIT WALLET CARD */}
        <div className="group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer overflow-hidden border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/50 to-orange-100/20 shadow-md hover:shadow-xl hover:border-[var(--gmc-mahogany)]">
          {/* Top corner gradient glow */}
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-amber-400/20 via-orange-300/30 to-transparent blur-[30px]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--gmc-mahogany)] to-[var(--gmc-mahogany-light)] text-white flex items-center justify-center shadow-md shadow-[var(--gmc-mahogany)]/25">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Top-Up Capital
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Deposit Wallet
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-amber-900 bg-amber-100/80 border border-amber-200 shadow-2xs">
                Active Balance
              </span>
            </div>

            {/* Deposit Balance */}
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {formatCents(depositWalletBalance)}
              </span>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Ready for Package Activations & Upgrades
              </p>
            </div>

            {/* Micro Details */}
            <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Supported:</span>
              <span className="font-bold text-slate-800">
                USDT / BNB / Card
              </span>
            </div>

            {/* Action Link */}
            <Link
              to="/order"
              className="inline-flex items-center justify-between w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-bold text-[var(--gmc-mahogany)] transition-all"
            >
              <span>Order Product</span>
              <ArrowDownCircle className="w-4 h-4 text-[var(--gmc-mahogany)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Headroom Limit / Return Capital Progress Bar (Interactive Light Theme) */}
      <div className="relative rounded-3xl p-6 bg-white/90 backdrop-blur-md border border-amber-200/80 shadow-md shadow-amber-950/5 text-slate-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <CircularProgress
            progress={progress}
            size={96}
            strokeWidth={9}
            colorRgb="255, 141, 1"
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-slate-900 leading-none">
                {progress.toFixed(0)}%
              </span>
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
                Cap Used
              </span>
            </div>
          </CircularProgress>

          <div className="flex-1 w-full space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gmc-gold-deep)]">
                  Income Wallet Headroom Limit (3X Yield Limit)
                </span>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Your GMC packages allow up to 3X in total returns. Once the 3X
                  limit is met, package re-upgrades unlock higher rewards.
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  Remaining Limit
                </span>
                <span className="font-black text-[var(--gmc-gold-deep)] font-mono text-base sm:text-lg">
                  {formatCents(remainingLimit)}
                </span>
              </div>
            </div>

            {/* Custom Light Progress Bar */}
            <div className="w-full h-3 rounded-full bg-amber-100 p-0.5 border border-amber-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-amber)] to-[var(--gmc-gold-deep)] shadow-xs transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
              <span>{progress.toFixed(1)}% Yield Received</span>
              <span>
                {formatCents(totalIncome)} / {formatCents(incomeLimit)} Max 3X
                Cap
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
