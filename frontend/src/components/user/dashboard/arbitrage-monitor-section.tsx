import { Activity, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

// Mock exchanges from the slides
const exchanges = [
  "Binance",
  "OKX",
  "Bybit",
  "Gate.io",
  "Coinbase",
  "Bitget",
  "Kucoin",
  "MEXC",
];

// Mock coins
const coins = [
  { symbol: "BTC", name: "Bitcoin", basePrice: 62500 },
  { symbol: "ETH", name: "Ethereum", basePrice: 3450 },
  { symbol: "BNB", name: "BNB", basePrice: 580 },
  { symbol: "SOL", name: "Solana", basePrice: 145 },
];

interface ArbitrageOpportunity {
  coin: string;
  exchangeA: string;
  exchangeB: string;
  priceA: number;
  priceB: number;
  spread: number;
  spreadPct: number;
  time: string;
}

export function ArbitrageMonitorSection() {
  const [activeTab, setActiveTab] = useState<"live" | "types" | "stats">(
    "live",
  );
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    [],
  );
  const [activeStep, setActiveStep] = useState(0);
  const [systemStatus, setSystemStatus] = useState("Scanning Exchanges...");
  const [currentScan, setCurrentScan] = useState({
    coin: "BTC",
    priceA: 62315.45,
    priceB: 63560.77,
    diff: 1245.32,
  });

  // Simulate Workflow steps from arbitrage-tradexbit.webp:
  // Scan Exchanges -> Detect Price Gap -> Check Fees/Liquidity -> Execute Trade -> Risk Control
  const workflowSteps = [
    {
      label: "Scan Exchanges",
      desc: "AI scanning 12+ exchanges for price mismatches",
    },
    {
      label: "Detect Price Gap",
      desc: "Identifying meaningful spread ≥ 20 bps",
    },
    {
      label: "Check Fees",
      desc: "Calculating trading fees and withdrawal charges",
    },
    {
      label: "Execute Trade",
      desc: "Buying low and selling high simultaneously",
    },
    {
      label: "Risk Control",
      desc: "Confirming profit and distributing rewards",
    },
  ];

  // Simulating the live workflow cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % workflowSteps.length;

        // Update statuses based on step
        if (next === 0) {
          setSystemStatus("Scanning Exchanges...");
          // Randomize current scan
          const coinIndex = Math.floor(Math.random() * coins.length);
          const coin = coins[coinIndex] ||
            coins[0] || { symbol: "BTC", basePrice: 62500 };
          const gap = 0.01 + Math.random() * 0.02; // 1% to 3% spread
          const priceA = coin.basePrice * (1 - gap / 2);
          const priceB = coin.basePrice * (1 + gap / 2);
          setCurrentScan({
            coin: coin.symbol,
            priceA: Number(priceA.toFixed(2)),
            priceB: Number(priceB.toFixed(2)),
            diff: Number((priceB - priceA).toFixed(2)),
          });
        } else if (next === 1) {
          setSystemStatus(`Price Gap Detected on ${currentScan.coin}!`);
        } else if (next === 2) {
          setSystemStatus("Calculating Net Profit Spread...");
        } else if (next === 3) {
          setSystemStatus(`Executing Arbitrage Order on ${currentScan.coin}`);
        } else if (next === 4) {
          setSystemStatus("Arbitrage Realized! Distributing Trade Profits");
          // Add to successful history list
          const excA =
            exchanges[Math.floor(Math.random() * exchanges.length)] ||
            "Binance";
          let excB =
            exchanges[Math.floor(Math.random() * exchanges.length)] || "OKX";
          while (excB === excA) {
            excB =
              exchanges[Math.floor(Math.random() * exchanges.length)] || "OKX";
          }

          const newOpp: ArbitrageOpportunity = {
            coin: currentScan.coin || "BTC",
            exchangeA: excA,
            exchangeB: excB,
            priceA: currentScan.priceA,
            priceB: currentScan.priceB,
            spread: currentScan.diff,
            spreadPct: Number(
              ((currentScan.diff / (currentScan.priceA || 1)) * 100).toFixed(2),
            ),
            time: new Date().toLocaleTimeString(),
          };
          setOpportunities((prev) => [newOpp, ...prev.slice(0, 4)]);
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [currentScan]);

  return (
    <div
      className="space-y-5 animate-fade-in-up"
      style={{ animationDelay: "150ms" }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-[var(--royal-orange)] to-[var(--bright-orange)] rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">
            Arbitrage Trading Engine
          </h2>
        </div>
        <div className="h-px bg-gradient-to-r from-[var(--glass-border)] to-transparent flex-1" />
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[var(--brand-green)] bg-[var(--brand-green)]/15 border border-[var(--brand-green)]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)] animate-ping" />
          Active Monitor
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--glass-border)] gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === "live"
              ? "text-[var(--royal-orange)]"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {activeTab === "live" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--royal-orange)]" />
          )}
          Live Scanner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("types")}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === "types"
              ? "text-[var(--royal-orange)]"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {activeTab === "types" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--royal-orange)]" />
          )}
          Arbitrage Types
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === "stats"
              ? "text-[var(--royal-orange)]"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {activeTab === "stats" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--royal-orange)]" />
          )}
          Market Metrics
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live Simulator View */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-[var(--glass-border)] p-5 flex flex-col justify-between min-h-[340px]">
            {/* Simulation Monitor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[var(--royal-orange)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Live Opportunity Scan
                  </span>
                </div>
                <span className="text-xs font-black font-mono text-[var(--gold)]">
                  {systemStatus}
                </span>
              </div>

              {/* Core Scan Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 bg-white/2 rounded-xl border border-white/5 px-4 relative overflow-hidden">
                {/* Buy Exchange */}
                <div className="text-center md:text-left space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    EXCHANGE A (BUY)
                  </p>
                  <p className="text-sm font-black text-slate-400">
                    Binance / OKX
                  </p>
                  <p className="text-2xl font-black font-mono text-[var(--foreground)]">
                    ${currentScan.priceA.toLocaleString()}
                  </p>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black bg-[var(--royal-orange)]/15 text-[var(--royal-orange)]">
                    BUY LOW
                  </span>
                </div>

                {/* Arrow & Difference */}
                <div className="text-center space-y-1 py-2 border-y md:border-y-0 md:border-x border-[var(--glass-border)]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--gold)]">
                    SPREAD OPPORTUNITY
                  </p>
                  <p className="text-2xl font-black font-mono text-[var(--brand-green)]">
                    +${currentScan.diff.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Price Difference
                  </p>
                </div>

                {/* Sell Exchange */}
                <div className="text-center md:text-right space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    EXCHANGE B (SELL)
                  </p>
                  <p className="text-sm font-black text-slate-400">
                    Bybit / Gate.io
                  </p>
                  <p className="text-2xl font-black font-mono text-[var(--foreground)]">
                    ${currentScan.priceB.toLocaleString()}
                  </p>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black bg-[var(--brand-green)]/15 text-[var(--brand-green)]">
                    SELL HIGH
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Workflow from arbitrage-tradexbit.webp */}
            <div className="mt-6 border-t border-[var(--glass-border)] pt-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
                TradeXbit Arbitrage Workflow Progress
              </p>
              <div className="grid grid-cols-5 gap-2">
                {workflowSteps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  const isCompleted = idx < activeStep;
                  return (
                    <div key={step.label} className="text-center space-y-1">
                      <div
                        className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs transition-all duration-300 ${
                          isCompleted
                            ? "bg-[var(--brand-green)] text-white"
                            : isActive
                              ? "bg-[var(--royal-orange)] text-white shadow-md shadow-[var(--royal-orange)]/25 animate-pulse"
                              : "bg-white/5 border border-white/10 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <p
                        className={`text-[8px] font-black uppercase tracking-wider truncate ${
                          isActive
                            ? "text-[var(--royal-orange)]"
                            : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* History / Log List */}
          <div className="glass-card rounded-2xl border border-[var(--glass-border)] p-5 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center gap-1.5 border-b border-[var(--glass-border)] pb-3 mb-3">
                <ShieldCheck className="h-4 w-4 text-[var(--brand-green)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Live Executed Trades
                </span>
              </div>

              {opportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                  <span className="text-3xl animate-pulse">📡</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-2">
                    Waiting for first execution...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between text-xs animate-fade-in-up"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[var(--foreground)]">
                            {opp.coin}/USDT
                          </span>
                          <span className="text-[9px] font-bold text-slate-500">
                            {opp.time}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {opp.exchangeA} → {opp.exchangeB}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[var(--brand-green)]">
                          +${opp.spread.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-500">
                          +{opp.spreadPct}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[var(--royal-orange)]/5 border border-[var(--royal-orange)]/10 text-center">
              <p className="text-[9px] text-slate-400 font-medium">
                System executes arbitrage in less than{" "}
                <span className="text-[var(--royal-orange)] font-bold">
                  3.5 seconds
                </span>{" "}
                to secure profits.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "types" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              id: "01",
              name: "Inter-Exchange",
              desc: "Buy low on one exchange, sell high on another. Capitalizes on direct market price gaps.",
              share: "35%",
              color: "var(--royal-orange)",
            },
            {
              id: "02",
              name: "Funding-Rate",
              desc: "Use spot/perpetual or perp-to-perp positions to benefit from swap funding differences.",
              share: "25%",
              color: "var(--gold)",
            },
            {
              id: "03",
              name: "Triangular",
              desc: "Use 3 distinct trading pairs on the exact same exchange to exploit price imbalances.",
              share: "20%",
              color: "var(--brand-green)",
            },
            {
              id: "04",
              name: "CEX-DEX",
              desc: "Capture instant price gaps between centralized books and decentralized liquidity pools.",
              share: "15%",
              color: "var(--brand-green-light)",
            },
            {
              id: "05",
              name: "Statistical",
              desc: "Mathematical mean reversion and coin price correlation algorithms designed by AI.",
              share: "5%",
              color: "var(--silver)",
            },
          ].map((type) => (
            <div
              key={type.id}
              className="glass-card rounded-2xl p-4 border border-[var(--glass-border)] hover:border-white/10 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-black font-mono opacity-20">
                    {type.id}
                  </span>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: `${type.color}15`, color: type.color }}
                  >
                    {type.share} Share
                  </span>
                </div>
                <h4 className="text-xs font-black text-[var(--foreground)] mb-1">
                  {type.name}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  {type.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Reserves card */}
          <div className="glass-card rounded-2xl border border-[var(--glass-border)] p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)]">
              Exchange Reserves Growth
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--brand-green)]">
                $225.4B
              </span>
              <span className="text-xs text-slate-500 font-bold">Feb 2026</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Early 2024</span>
                <span>$152.1B</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[var(--royal-orange)] to-[var(--brand-green)] h-full"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Top 12 CEX reserves increased significantly, enhancing liquidity
                for arbitrage.
              </p>
            </div>
          </div>

          {/* Scale card */}
          <div className="glass-card rounded-2xl border border-[var(--glass-border)] p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)]">
              Daily Trading Scale
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--royal-orange)]">
                $142B/day
              </span>
              <span className="text-xs text-slate-500 font-bold">May 2026</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>2025 Average</span>
                <span>$57.5B/day</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--royal-orange)] h-full"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Higher market volumes yield larger and more frequent pricing
                mismatches.
              </p>
            </div>
          </div>

          {/* Spread card */}
          <div className="glass-card rounded-2xl border border-[var(--glass-border)] p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)]">
              Spreads Distribution
            </h4>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                {/* Simplistic SVG Donut Chart */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 36 36"
                  aria-hidden="true"
                >
                  <path
                    className="text-white/5"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[var(--royal-orange)]"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="17, 100"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-[var(--royal-orange)]">
                  17%
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-[var(--foreground)]">
                  17% Spread ≥ 20 bps
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Observations confirm 17% of rates represent high margin
                  opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
