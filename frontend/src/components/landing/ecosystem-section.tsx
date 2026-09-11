import {
  ArrowRight,
  Blocks,
  ChevronRight,
  Coins,
  Crown,
  GraduationCap,
  Network,
  Pill,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

const ECOSYSTEM_NODES = [
  {
    id: "health",
    title: "1. GMC Health Products",
    shortTitle: "GMC Health Products",
    description:
      "Premium health and cellular bio-wellness products for everyday longevity and vitality.",
    icon: Pill,
    status: "Active Now",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "rewards",
    title: "2. GNX Wellness Rewards",
    shortTitle: "GNX Wellness Rewards",
    description:
      "Product-linked digital utility rewards credited on eligible bio-wellness purchases ($0.10 base value).",
    icon: Coins,
    status: "Active Now",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "exchange",
    title: "3. GMC Crypto Exchange",
    shortTitle: "GMC Crypto Exchange",
    description:
      "A planned digital-asset exchange for seamless future ecosystem liquidity and transactions.",
    icon: RefreshCw,
    status: "In Roadmap",
    statusColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "wallet",
    title: "4. Decentralized Wallet",
    shortTitle: "Decentralized Wallet",
    description:
      "A secure Web3 wallet for holding, transferring, and managing supported ecosystem digital assets.",
    icon: Wallet,
    status: "In Development",
    statusColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "genxC",
    title: "5. GenX Capital Management Services",
    shortTitle: "GenX Capital Management",
    description:
      "Professional portfolio-related services, subject to applicable regulatory approvals.",
    icon: TrendingUp,
    status: "Planned",
    statusColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "services",
    title: "6. Premium Digital Services",
    shortTitle: "Premium Digital Services",
    description:
      "Additional digital services and privileged features available to eligible GMC community members.",
    icon: Crown,
    status: "Active Tiers",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "community",
    title: "7. Community Business Platform",
    shortTitle: "Community Platform",
    description:
      "A structured community growth model for product promotion, auto-pool tiers, and rewards.",
    icon: Users,
    status: "Active Now",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "academy",
    title: "8. GenX Academy",
    shortTitle: "GenX Academy",
    description:
      "Educational initiative empowering community members through Web3, bio-wellness, and financial literacy courses.",
    icon: GraduationCap,
    status: "In Roadmap",
    statusColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    id: "blockchain",
    title: "9. GenX Blockchain",
    shortTitle: "GenX Blockchain",
    description:
      "High-performance, secure blockchain infrastructure powering decentralized health data and GNX rewards.",
    icon: Blocks,
    status: "In Development",
    statusColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
];

const ROADMAP_STEPS = [
  { step: "01", title: "Health Products", status: "Live", current: false },
  { step: "02", title: "GNX Utility", status: "Active", current: true },
  {
    step: "03",
    title: "Decentralized Wallet",
    status: "Development",
    current: false,
  },
  { step: "04", title: "GMC Exchange", status: "Upcoming", current: false },
  {
    step: "05",
    title: "Integrated Global Ecosystem",
    status: "Vision",
    current: false,
  },
];

export default function EcosystemSection() {
  const [activeNodeId, setActiveNodeId] = useState("health");

  const activeNode =
    ECOSYSTEM_NODES.find((n) => n.id === activeNodeId) || ECOSYSTEM_NODES[0]!;

  return (
    <section
      id="ecosystem"
      className="relative w-full py-12 sm:py-24 bg-[#ffffff] text-[#1e293b] overflow-hidden border-b border-[var(--gmc-gold)]/20"
    >
      {/* Glow ambient background */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--gmc-gold)]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gmc-gold)]/15 border border-[var(--gmc-gold)]/30 text-[var(--gmc-gold-deep)] text-xs font-extrabold tracking-widest uppercase">
            <Network className="w-3.5 h-3.5" /> Interconnected Network
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--gmc-mahogany-dark)] font-serif">
            THE GMC{" "}
            <span className="bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
              ECOSYSTEM
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            GMC is built as a 9-pillar interconnected wellness and digital
            ecosystem combining real-world products, education, blockchain
            technology, and decentralized rewards.
          </p>
        </div>

        {/* ════════ INTERACTIVE 9-PILLAR NODE HUB ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: 9 Nodes Grid */}
          <div className="lg:col-span-7 relative p-5 sm:p-8 rounded-3xl bg-amber-50/40 border border-[var(--gmc-gold)]/30 shadow-xl space-y-6">
            {/* Center Brand Badge Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] shadow-lg shadow-[var(--gmc-gold)]/25 text-white font-serif font-black text-lg sm:text-xl">
                GMC ECOSYSTEM PILLARS
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-2">
                Select any of the 9 interconnected pillars to explore details:
              </p>
            </div>

            {/* 9 Nodes Grid (Responsive 3x3 layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ECOSYSTEM_NODES.map((node) => {
                const NodeIcon = node.icon;
                const isSelected = activeNodeId === node.id;
                return (
                  <button
                    type="button"
                    key={node.id}
                    onClick={() => setActiveNodeId(node.id)}
                    className={`group relative p-3 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "bg-white border-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/20 scale-[1.03]"
                        : "bg-white/80 border-amber-900/10 hover:border-[var(--gmc-gold)]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[var(--gmc-gold)] text-white shadow-sm"
                            : "bg-amber-100/60 text-[var(--gmc-mahogany)] group-hover:bg-[var(--gmc-gold)]/20"
                        }`}
                      >
                        <NodeIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div
                          className={`text-xs font-extrabold truncate ${
                            isSelected
                              ? "text-[var(--gmc-gold-deep)]"
                              : "text-[var(--gmc-mahogany-dark)]"
                          }`}
                        >
                          {node.shortTitle}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border mt-0.5 font-semibold ${node.statusColor}`}
                        >
                          {node.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active Node Focus Detail Box */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/40 shadow-2xl shadow-amber-950/10 space-y-6 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] text-white flex items-center justify-center shadow-lg shadow-[var(--gmc-gold)]/25 shrink-0">
                  <activeNode.icon className="w-7 h-7" />
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border mb-1 ${activeNode.statusColor}`}
                  >
                    {activeNode.status}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--gmc-mahogany-dark)]">
                    {activeNode.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {activeNode.description}
              </p>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-[var(--gmc-gold)]/20 space-y-1.5">
                <div className="text-xs font-bold text-[var(--gmc-gold-deep)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Key Ecosystem Advantage
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Integrated directly within GMC's unified reward network,
                  enabling interconnected growth between health, education, and
                  digital utilities.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-amber-900/10">
                <span>
                  Pillar #
                  {ECOSYSTEM_NODES.findIndex((n) => n.id === activeNodeId) + 1}{" "}
                  of 9
                </span>
                <span className="text-[var(--gmc-gold-deep)] font-extrabold flex items-center gap-1">
                  Active Focus <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ ECOSYSTEM ROADMAP TIMELINE ════════ */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-amber-100/50 border border-[var(--gmc-gold)]/30 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--gmc-mahogany-dark)] font-serif uppercase tracking-wider">
                Ecosystem Roadmap
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Phase-by-phase rollout towards global wellness and blockchain
                integration.
              </p>
            </div>
            <span className="px-3.5 py-1.5 w-fit rounded-full text-xs font-extrabold bg-[var(--gmc-gold)]/20 border border-[var(--gmc-gold)]/40 text-[var(--gmc-gold-deep)]">
              Phase 2 Active Now
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ROADMAP_STEPS.map((s, idx) => (
              <div
                key={idx}
                className={`relative p-4 rounded-2xl border transition-all ${
                  s.current
                    ? "bg-white border-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/20"
                    : "bg-white/60 border-amber-900/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[var(--gmc-gold-deep)]">
                    Phase {s.step}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      s.current
                        ? "bg-[var(--gmc-gold)] text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[var(--gmc-mahogany-dark)]">
                  {s.title}
                </div>
                {idx < ROADMAP_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-amber-400 absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
