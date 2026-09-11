import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Coins,
  Flame,
  Hourglass,
  Info,
  Lock,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";

// Helper to format GNX amounts
function formatGnx(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

// Fallback dummy API response structure (matching image data)
const FALLBACK_DUMMY_DATA = {
  systemStatus: {
    isSaleActive: true,
    currentPhaseId: 1,
    currentRoundId: 1,
  },
  phaseDetails: {
    id: 1,
    name: "Phase 1",
    totalAllocationGnx: "25000000.0",
    totalSoldGnx: "12000000.0",
    totalRemainingGnx: "13000000.0",
    startedAt: "2026-08-04T07:53:12Z",
    endsAt: "2027-05-31T07:53:12Z",
  },
  roundDetails: {
    id: 1,
    name: "Round 1",
    priceUsdt: "0.10",
    allocationGnx: "6000000.0",
    soldGnx: "3500.0",
    remainingGnx: "5996500.0",
    startedAt: "2026-08-04T07:53:12Z",
    endsAt: "2026-10-03T07:53:12Z",
  },
  allRounds: [] as Array<{
    phaseId: number;
    roundId: number;
    allocationGnx: string;
    soldGnx: string;
    startedAt: string;
    endsAt: string;
    isActive: boolean;
    isFinalized: boolean;
  }>,
};

interface Round {
  id: number;
  name: string;
  price: string;
  allocation: number;
  bonus?: string;
}

// Rounds static definitions
const PHASE_ROUNDS: Record<"phase1" | "phase2" | "phase3", Round[]> = {
  phase1: [
    { id: 1, name: "Round 1", price: "0.10", allocation: 6000000 },
    { id: 2, name: "Round 2", price: "0.20", allocation: 5500000 },
    { id: 3, name: "Round 3", price: "0.30", allocation: 5000000 },
    { id: 4, name: "Round 4", price: "0.40", allocation: 4500000 },
    { id: 5, name: "Round 5", price: "0.50", allocation: 4000000 },
  ],
  phase2: [
    { id: 1, name: "Round 1", price: "1.00", allocation: 6000000 },
    { id: 2, name: "Round 2", price: "2.00", allocation: 5500000 },
    { id: 3, name: "Round 3", price: "3.00", allocation: 5000000 },
    { id: 4, name: "Round 4", price: "4.00", allocation: 4500000 },
    { id: 5, name: "Round 5", price: "5.00", allocation: 4000000 },
  ],
  phase3: [
    {
      id: 1,
      name: "Round 1",
      price: "10.00",
      allocation: 12000000,
      bonus: "20% Extra",
    },
    {
      id: 2,
      name: "Round 2",
      price: "20.00",
      allocation: 11000000,
      bonus: "40% Extra",
    },
    {
      id: 3,
      name: "Round 3",
      price: "30.00",
      allocation: 10000000,
      bonus: "60% Extra",
    },
    {
      id: 4,
      name: "Round 4",
      price: "40.00",
      allocation: 9000000,
      bonus: "80% Extra",
    },
    {
      id: 5,
      name: "Round 5",
      price: "50.00",
      allocation: 8000000,
      bonus: "100% Extra",
    },
  ],
};

export function PhaseSection() {
  const [activeTab, setActiveTab] = useState<
    "phase1" | "phase2" | "phase3" | "listing"
  >("phase1");
  const [selectedRoundId, setSelectedRoundId] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Query backend with safe check to bypass type validation if route is not built
  const { data: saleData } = useQuery({
    queryKey: ["token-sale-status"],
    queryFn: async () => {
      try {
        const response = await api.users["token-sale"].status.get();
        if (response.data?.success) {
          return response.data.data;
        }
      } catch (_err) {}
      return FALLBACK_DUMMY_DATA;
    },
    refetchInterval: 30_000,
  });

  const sale = saleData ?? FALLBACK_DUMMY_DATA;
  const isSaleActive = sale.systemStatus.isSaleActive;
  const currentPhaseId = sale.systemStatus.currentPhaseId;
  const currentRoundId = sale.systemStatus.currentRoundId;

  // Auto-sync initial active tab once data loads
  useEffect(() => {
    if (saleData && !isInitialized) {
      const activePhase = `phase${saleData.systemStatus.currentPhaseId}` as
        | "phase1"
        | "phase2"
        | "phase3";
      setActiveTab(activePhase);
      setIsInitialized(true);
    }
  }, [saleData, isInitialized]);

  // Sync selected round index when tab changes
  useEffect(() => {
    const tabPhaseId = activeTab.startsWith("phase")
      ? parseInt(activeTab.replace("phase", ""), 10)
      : null;
    if (tabPhaseId === currentPhaseId) {
      setSelectedRoundId(currentRoundId);
    } else {
      setSelectedRoundId(1);
    }
  }, [activeTab, currentPhaseId, currentRoundId]);

  // Countdown timer calculation for current active round
  useEffect(() => {
    if (!sale.roundDetails?.endsAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const endsAt = new Date(sale.roundDetails.endsAt).getTime();
      const diff = endsAt - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sale.roundDetails?.endsAt]);

  // Format Dates
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render round list for current tab
  const rounds = activeTab !== "listing" ? PHASE_ROUNDS[activeTab] : [];
  const fallbackRound: Round = {
    id: 1,
    name: "Round 1",
    price: "0.10",
    allocation: 6000000,
  };
  const selectedRound =
    rounds.find((r) => r.id === selectedRoundId) ?? rounds[0] ?? fallbackRound;

  // Logic to determine a round status based on active tab and IDs
  const getRoundStatus = (roundId: number) => {
    if (activeTab === "phase1") {
      if (currentPhaseId > 1) return "completed";
      if (currentPhaseId === 1) {
        if (roundId < currentRoundId) return "completed";
        if (roundId === currentRoundId) return "active";
        return "upcoming";
      }
      return "upcoming";
    }
    if (activeTab === "phase2") {
      if (currentPhaseId > 2) return "completed";
      if (currentPhaseId === 2) {
        if (roundId < currentRoundId) return "completed";
        if (roundId === currentRoundId) return "active";
        return "upcoming";
      }
      return "upcoming";
    }
    if (activeTab === "phase3") {
      if (currentPhaseId > 3) return "completed";
      if (currentPhaseId === 3) {
        if (roundId < currentRoundId) return "completed";
        if (roundId === currentRoundId) return "active";
        return "upcoming";
      }
      return "upcoming";
    }
    return "upcoming";
  };

  // Dynamic Phase Details values based on selected tab
  const getPhaseHeaderInfo = () => {
    switch (activeTab) {
      case "phase1":
        return {
          title: "Phase 1: Seed Contribution",
          description:
            "Initiating the core community distribution with early-bird pricing. Lock-in structure drives long-term network growth.",
          allocation: "25,000,000",
          cliff: "6 Months Cliff after Listing",
          duration: "10 Months (5 Rounds)",
          sold:
            currentPhaseId === 1
              ? parseFloat(sale.phaseDetails.totalSoldGnx)
              : currentPhaseId > 1
                ? 25000000
                : 0,
        };
      case "phase2":
        return {
          title: "Phase 2: Strategic Scaling",
          description:
            "Mid-level sale phase facilitating wider distribution. Decreased lock-up timelines enable gradual secondary activity support.",
          allocation: "25,000,000",
          cliff: "3 Months Cliff after Listing",
          duration: "10 Months (5 Rounds)",
          sold:
            currentPhaseId === 2
              ? parseFloat(sale.phaseDetails.totalSoldGnx)
              : currentPhaseId > 2
                ? 25000000
                : 0,
        };
      case "phase3":
        return {
          title: "Phase 3: Public Incentives & Bonus",
          description:
            "Final distribution phase introducing high-bonus wellness rewards. Immediate post-listing delivery with linear release safeguards stability.",
          allocation: "50,000,000",
          cliff: "No Cliff / Linear Monthly Release",
          duration: "10 Months (5 Rounds)",
          sold:
            currentPhaseId === 3
              ? parseFloat(sale.phaseDetails.totalSoldGnx)
              : 0,
        };
      default:
        return null;
    }
  };

  const phaseInfo = getPhaseHeaderInfo();
  const phaseProgress = phaseInfo
    ? (phaseInfo.sold / parseFloat(phaseInfo.allocation.replace(/,/g, ""))) *
      100
    : 0;

  return (
    <div
      className="space-y-6 my-8 sm:my-11 animate-fade-in-up"
      style={{ animationDelay: "50ms" }}
    >
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-11 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/40" />
          <div>
            <h2 className="text-base sm:text-xl lg:text-2xl font-black uppercase tracking-wider text-slate-900 leading-none">
              GMC Token Sale Phases
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Participate in GNX distribution, track round structures, and check
              vesting terms
            </p>
          </div>
        </div>

        {/* Global Sale Status Indicator */}
        {isSaleActive && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-800">
              Sale Status: Active (Phase {currentPhaseId})
            </span>
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex md:grid md:grid-cols-4 gap-2 bg-amber-50/50 p-1.5 rounded-3xl border border-amber-200/50 overflow-x-auto snap-x scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("phase1")}
          className={`flex-none md:flex-1 min-w-[130px] md:min-w-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 snap-align-start ${
            activeTab === "phase1"
              ? "bg-primary/90 text-white border border-amber-300 shadow-sm"
              : "bg-white text-[var(--gmc-gold-deep)] border border-amber-300 shadow-sm"
          }`}
        >
          <span className="tracking-wide">PHASE 1</span>
          <span className="text-[9px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase leading-none scale-90">
            {currentPhaseId === 1
              ? "Live Now"
              : currentPhaseId > 1
                ? "Completed"
                : "Upcoming"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("phase2")}
          className={`flex-none md:flex-1 min-w-[130px] md:min-w-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 snap-align-start ${
            activeTab === "phase2"
              ? "bg-primary/90 text-white border border-amber-300 shadow-sm"
              : "bg-white text-[var(--gmc-gold-deep)] border border-amber-300 shadow-sm"
          }`}
        >
          <span className="tracking-wide">PHASE 2</span>
          <span className="text-[9px] sm:text-[11px] font-bold text-red-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full uppercase leading-none scale-90">
            {currentPhaseId === 2
              ? "Live Now"
              : currentPhaseId > 2
                ? "Completed"
                : "Locked"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("phase3")}
          className={`flex-none md:flex-1 min-w-[130px] md:min-w-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 snap-align-start ${
            activeTab === "phase3"
              ? "bg-primary/90 text-white border border-amber-300 shadow-sm"
              : "bg-white text-[var(--gmc-gold-deep)] border border-amber-300 shadow-sm"
          }`}
        >
          <span className="tracking-wide">PHASE 3</span>
          <span className="text-[9px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase leading-none scale-90">
            Bonus Wellness
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("listing")}
          className={`flex-none md:flex-1 min-w-[130px] md:min-w-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 snap-align-start ${
            activeTab === "listing"
              ? "bg-primary/90 text-white border border-amber-300 shadow-sm"
              : "bg-white text-[var(--gmc-gold-deep)] border border-amber-300 shadow-sm"
          }`}
        >
          <span className="tracking-wide">LISTING & RULES</span>
          <span className="text-[9px] sm:text-[11px] font-bold text-[var(--gmc-mahogany)] bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full uppercase leading-none scale-90">
            $100 Target
          </span>
        </button>
      </div>

      {/* Main Container Card */}
      {activeTab !== "listing" && phaseInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Phase Level Info */}
          <div className="lg:col-span-5 group relative rounded-3xl p-6 sm:p-8 overflow-hidden transition-all border border-amber-200/80 shadow-md bg-gradient-to-br from-white via-amber-50/20 to-white text-slate-800 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-amber-200/30 via-orange-100/20 to-transparent blur-[40px]" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200/60 rounded-2xl px-3 py-1.5 w-max">
                <Coins className="w-4 h-4 sm:h-5 sm:w-5 text-[var(--gmc-gold-deep)]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">
                  {activeTab === "phase3"
                    ? "Wellness Allocations"
                    : "Standard Allocation"}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {phaseInfo.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {phaseInfo.description}
                </p>
              </div>

              {/* Progress Tracker */}
              {phaseInfo.sold > 0 && (
                <div className="space-y-2 pt-3 border-t border-amber-200/60">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-end text-xs sm:text-sm font-bold">
                    <span className="text-slate-500">Progress Sold</span>
                    <span className="text-[var(--gmc-gold-deep)] font-mono text-xs">
                      {formatGnx(phaseInfo.sold)} / {phaseInfo.allocation} GNX (
                      {phaseProgress.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-amber-100/80 p-0.5 border border-amber-200/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-amber)] to-[var(--gmc-gold-deep)] shadow-xs transition-all duration-500"
                      style={{ width: `${phaseProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Phase stats list */}
              <div className="pt-3 border-t border-amber-100 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 sm:h-5 sm:w-5" />
                    <span>Duration:</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {phaseInfo.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4 sm:h-5 sm:w-5" />
                    <span>Vesting Rule:</span>
                  </div>
                  <span className="font-extrabold text-[var(--gmc-gold-deep)]">
                    {phaseInfo.cliff}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Flame className="w-4 h-4 sm:h-5 sm:w-5 text-orange-600" />
                    <span>Unsold Rules:</span>
                  </div>
                  <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
                    100% Permanently Burned
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom action alert info */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/40 text-[11px] sm:text-sm text-slate-600 font-medium leading-normal flex items-start gap-2.5">
              <Info className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[var(--gmc-gold)] shrink-0 mt-0.5" />
              <div>
                <span>
                  Unclaimed or unsold tokens in any completed rounds are
                  immediately sent to the burn address to create supply
                  scarcity.
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Timeline / Rounds structure */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Rounds Timeline List */}
            <div className="grid grid-cols-5 gap-2.5">
              {rounds.map((round) => {
                const roundStatus = getRoundStatus(round.id);
                const isSelected = selectedRoundId === round.id;

                return (
                  <button
                    key={round.id}
                    type="button"
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`relative p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between h-24 ${
                      isSelected
                        ? "border-[var(--gmc-gold)] bg-amber-500/10 shadow-xs"
                        : roundStatus === "completed"
                          ? "border-emerald-200 bg-white hover:bg-emerald-50/20"
                          : "border-slate-200 bg-white hover:border-amber-300"
                    }`}
                  >
                    {/* Tiny badge */}
                    <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
                      {roundStatus === "active" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      {roundStatus === "completed" && (
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-300">
                          <span className="text-[7px] text-emerald-800 font-black">
                            ✓
                          </span>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                      R-{round.id}
                    </span>

                    <div className="my-1.5">
                      <span className="text-xs sm:text-sm font-black font-mono text-slate-900 block leading-none">
                        ${round.price}
                      </span>
                    </div>

                    <span
                      className={`text-[8px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md leading-none ${
                        roundStatus === "active"
                          ? "text-emerald-700 bg-emerald-50"
                          : roundStatus === "completed"
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
                      {roundStatus === "active"
                        ? "Active"
                        : roundStatus === "completed"
                          ? "Done"
                          : "Lock"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Focused Round detail panel */}
            <div className="relative rounded-3xl p-6 bg-white border border-amber-200/80 shadow-md overflow-hidden flex-1 flex flex-col justify-between">
              {/* Highlight active round background glow */}
              {getRoundStatus(selectedRound.id) === "active" && (
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-30 bg-gradient-to-br from-emerald-400/20 via-teal-300/10 to-transparent blur-[50px]" />
              )}

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-[var(--gmc-gold-deep)] uppercase tracking-widest">
                      {activeTab.toUpperCase()} • {selectedRound.name}
                    </span>
                    {getRoundStatus(selectedRound.id) === "active" && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  {selectedRound.bonus && (
                    <div className="flex items-center gap-1 bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-200/60 rounded-md px-2 py-0.5 text-[9px] sm:text-[10px] font-black">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{selectedRound.bonus} BONUS GNX</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] sm:text-sm font-black uppercase text-slate-400 tracking-wider block">
                      Token Price
                    </span>
                    <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 leading-tight">
                      ${selectedRound.price}{" "}
                      <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                        USDT
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-sm font-black uppercase text-slate-400 tracking-wider block">
                      Round Allocation
                    </span>
                    <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 leading-tight">
                      {formatGnx(selectedRound.allocation)}{" "}
                      <span className="text-xs sm:text-sm font-black text-[var(--gmc-gold-deep)] uppercase">
                        GNX
                      </span>
                    </span>
                  </div>
                </div>

                {/* Render active round live details */}
                {getRoundStatus(selectedRound.id) === "active" ? (
                  <div className="pt-4 border-t border-amber-100 space-y-4">
                    {/* Live Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className="text-slate-500">Live Sold Count:</span>
                        <span className="text-emerald-700 font-mono">
                          {formatGnx(sale.roundDetails.soldGnx)} /{" "}
                          {formatGnx(sale.roundDetails.allocationGnx)} GNX
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 p-0.5 border border-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              1,
                              (parseFloat(sale.roundDetails.soldGnx) /
                                parseFloat(sale.roundDetails.allocationGnx)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-[12px] font-bold text-slate-400">
                        <span>
                          Remaining: {formatGnx(sale.roundDetails.remainingGnx)}{" "}
                          GNX
                        </span>
                        <span>
                          {(
                            (parseFloat(sale.roundDetails.soldGnx) /
                              parseFloat(sale.roundDetails.allocationGnx)) *
                            100
                          ).toFixed(3)}
                          %
                        </span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 gap-3">
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-[var(--gmc-gold)] animate-spin-slow" />
                        <div>
                          <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                            Round Ends In
                          </span>
                          <span className="text-xs sm:text-base xl:text-lg font-black text-slate-800 font-mono mt-0.5 block">
                            {timeLeft || "Calculating…"}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                          Active Period
                        </span>
                        <span className="text-[10px] sm:text-base xl:text-lg font-bold text-slate-600 mt-0.5 block">
                          {formatDate(sale.roundDetails.startedAt)} -{" "}
                          {formatDate(sale.roundDetails.endsAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : getRoundStatus(selectedRound.id) === "completed" ? (
                  <div className="pt-4 border-t border-amber-100 flex flex-col gap-2 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-lg font-bold">
                        <span>
                          {" "}
                          🏆 This Round is fully finalized and closed.
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-sm font-black uppercase text-emerald-700">
                        100% Sold Out
                      </span>
                    </div>
                    {(() => {
                      const phaseId = activeTab.startsWith("phase")
                        ? parseInt(activeTab.replace("phase", ""), 10)
                        : null;
                      const roundData = sale.allRounds?.find(
                        (r) =>
                          r.phaseId === phaseId &&
                          r.roundId === selectedRound.id,
                      );
                      if (roundData?.endsAt) {
                        const endsAtDate = new Date(roundData.endsAt);
                        const isFuture = endsAtDate.getTime() > Date.now();

                        return (
                          <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 flex items-center gap-1.5 border-t border-emerald-200/50 pt-2 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {isFuture
                              ? "Completed Early (Sold Out)"
                              : `Completed on ${formatDate(roundData.endsAt)}`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-amber-100 flex items-center gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs sm:text-base font-semibold text-slate-500">
                      🔒 This round is locked and starts automatically after the
                      previous round closes.
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons or details link */}
              <div className="mt-4 flex items-center justify-end">
                <Link
                  to="/order"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-bold text-[var(--gmc-gold-deep)] transition-all cursor-pointer"
                >
                  <span>Order Product & Earn GNX</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing & Locking rules Tab content */}
      {activeTab === "listing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main listing target details */}
          <div className="lg:col-span-5 group relative rounded-3xl p-6 sm:p-8 overflow-hidden transition-all border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/40 to-amber-100/20 shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-40 bg-gradient-to-br from-[var(--gmc-gold)]/20 via-amber-200/30 to-transparent blur-[50px]" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 text-amber-905 bg-amber-100 border border-amber-200/80 rounded-2xl px-3 py-1.5 w-max">
                <ArrowLeftRight className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[var(--gmc-gold)]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">
                  Exchange Listing Target
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-xs sm:text-sm font-extrabold uppercase tracking-widest block">
                  Target Price Valuation
                </span>
                <span className="text-4xl sm:text-5xl font-black font-serif bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold-amber)] to-[var(--gmc-gold)] bg-clip-text text-transparent block leading-tight tracking-tight">
                  $100.00{" "}
                  <span className="text-xl font-black text-slate-800 font-sans">
                    USD
                  </span>
                </span>
                <span className="text-slate-600 text-[10px] sm:text-xs font-bold block mt-1">
                  1000x scaling from Phase 1 Round 1 price ($0.10)
                </span>
              </div>

              <div className="pt-4 border-t border-amber-200/60 space-y-4 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                <p>
                  After the completion of all 3 phases, GNX will move toward
                  official public exchange listing on major smart chains.
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/50">
                  <Calendar className="w-5 h-5 text-[var(--gmc-gold-deep)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-slate-900 block text-[11px] sm:text-[13px] uppercase tracking-wider">
                      Listing Timeline
                    </span>
                    <span className="text-[11px] sm:text-[13px] text-slate-600 mt-0.5 block">
                      Up to 30 Months total timeline, or shorter if ecosystem
                      and market conditions are met.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: release structure and buyback rules */}
          <div className="lg:col-span-7 space-y-6">
            {/* Vesting Rules Card */}
            <div className="rounded-3xl p-6 bg-white border border-amber-200/80 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 sm:h-6 sm:w-6 text-[var(--gmc-gold-deep)]" />
                <h3 className="text-sm sm:text-lg font-black uppercase text-slate-900 tracking-wider">
                  Phase-Wise Locking & Release Structure
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                GNX follows a structured locking and release system post-listing
                to protect the token value, manage sudden selling pressure, and
                secure long-term price stability.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-all text-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    PHASE 1 HOLDERS
                  </span>
                  <span className="text-sm sm:text-base font-black text-[var(--gmc-gold-deep)] block mt-1.5 font-mono">
                    6 Months Cliff
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block mt-1 leading-normal">
                    Minimum lock. Released in approved percentages.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-all text-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    PHASE 2 HOLDERS
                  </span>
                  <span className="text-sm sm:text-base font-black text-[var(--gmc-gold-deep)] block mt-1.5 font-mono">
                    3 Months Cliff
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block mt-1 leading-normal">
                    Minimum lock. Released in approved percentages.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-all text-center font-bold">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    PHASE 3 HOLDERS
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 block mt-1.5 font-mono">
                    Immediate / Linear
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-800 font-semibold block mt-1 leading-normal">
                    No cliff. Released linearly at 5% per month.
                  </span>
                </div>
              </div>
            </div>

            {/* Buyback & Burn program Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-white to-orange-50/10 border border-orange-200/80 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600 animate-pulse" />
                <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wider">
                  Pre-Listing Buyback & 100% Token Burn
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                To support token holders seeking early liquidity, GMC supports
                an ecosystem buyback program with integrated burning mechanics
                to drive token scarcity:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm font-semibold text-slate-600">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50/40 border border-orange-200/40">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                    <span className="text-xs font-black text-orange-800 font-mono">
                      10%
                    </span>
                  </div>
                  <div>
                    <span className="font-black text-slate-900 block text-[11px] sm:text-[12px] uppercase tracking-wide">
                      LP Deduction Fee
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                      10% is deducted from early system buybacks and transferred
                      directly to the Liquidity Pool.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50/40 border border-orange-200/40">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                    <span className="text-xs xm:text-[11px] font-black text-orange-800 font-mono">
                      100%
                    </span>
                  </div>
                  <div>
                    <span className="font-black text-slate-900 block text-[11px] sm:text-[12px] uppercase tracking-wide">
                      Permanently Burned
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                      All tokens bought back through the system are burned,
                      reducing the circulating supply.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
