import { Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { IdentitySection } from "./identity-section";
import { PhaseSection } from "./phase-section";
import { WalletSection } from "./wallet-section";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] via-[var(--gmc-gold-amber)] to-[var(--gmc-gold-deep)] flex items-center justify-center shadow-lg shadow-[var(--gmc-gold)]/30 animate-pulse border border-white">
            <span className="text-white font-black text-2xl tracking-wider">
              GMC
            </span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-[var(--gmc-gold)]/40 animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-black tracking-widest uppercase text-slate-500">
            Loading GMC Dashboard…
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)]">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-8 space-y-4 sm:space-y-8">
        {/* 1. Identity & Referral Card */}
        <IdentitySection user={user} />

        {/* 2. Interactive Wallets (Token Wallet, Income Wallet, Deposit Wallet) */}
        <WalletSection user={user} />

        {/* 3. GNX Token Sale Phases — links into the Order flow */}
        <PhaseSection />

        {/* Password Alert */}
        {!user?.password?.createdAt && (
          <div
            className="bg-white/90 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-amber-200/80 shadow-md shadow-amber-950/5 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-[var(--gmc-gold-deep)] shrink-0 shadow-xs">
                <KeyRound
                  size={22}
                  className="animate-pulse text-[var(--gmc-gold-deep)]"
                />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Secure Your Account with a Password
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-xl leading-relaxed">
                  Set up a password to sign in from any browser or device
                  without requiring a Web3 connection.
                </p>
              </div>
            </div>
            <Link
              to="/set-password"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black text-center text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
            >
              Set Password
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
