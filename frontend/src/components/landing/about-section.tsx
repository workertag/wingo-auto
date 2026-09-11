import {
  CheckCircle2,
  Crown,
  Gift,
  Heart,
  Leaf,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

const ABOUT_PILLARS = [
  {
    id: "health",
    number: "01",
    title: "Health & Wellness Products",
    icon: Leaf,
    description:
      "Science-backed nutraceuticals designed for cellular mitochondrial energy, cognitive vitality, and longevity support.",
    highlights: [
      "Mito C Care formula",
      "GMP & ISO certified",
      "60 tablets pack",
    ],
  },
  {
    id: "community",
    number: "02",
    title: "Community Growth Model",
    icon: Users,
    description:
      "A peer-driven global network fostering collective empowerment, shared success, and collaborative health education.",
    highlights: [
      "Global peer network",
      "Transparent referral structure",
      "Leadership tiers",
    ],
  },
  {
    id: "reward",
    number: "03",
    title: "Reward-Based Participation",
    icon: Gift,
    description:
      "Every eligible purchase is linked to free GNX Wellness Rewards, establishing tangible value with every product order.",
    highlights: [
      "Free GNX Token rewards",
      "Product-linked value",
      "Auto-pool entry",
    ],
  },
  {
    id: "premium",
    number: "04",
    title: "Premium Services Access",
    icon: Crown,
    description:
      "Exclusive access to specialized portfolio tools, digital ecosystem privileges, and VIP participant events.",
    highlights: [
      "Decentralized wallet",
      "Digital service portal",
      "VIP benefits",
    ],
  },
  {
    id: "opportunity",
    number: "05",
    title: "Long-Term Lifestyle & Business Opportunity",
    icon: TrendingUp,
    description:
      "Sustainable economic models engineered for recurring rewards, residual growth, and generational wellness.",
    highlights: [
      "3X payout cap structure",
      "Residual earning potential",
      "Global reach",
    ],
  },
];

export default function AboutSection() {
  const [selectedPillarId, setSelectedPillarId] = useState("health");

  const _activePillar =
    ABOUT_PILLARS.find((p) => p.id === selectedPillarId) || ABOUT_PILLARS[0]!;

  return (
    <section
      id="about"
      className="relative w-full py-10 sm:py-20 bg-[#faf8f5] text-[#1e293b] overflow-hidden border-b border-[var(--gmc-gold)]/20"
    >
      {/* Soft Glow */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[var(--gmc-gold)]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-amber-100/50 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gmc-gold)]/15 border border-[var(--gmc-gold)]/30 text-[var(--gmc-gold-deep)] text-xs font-extrabold tracking-widest uppercase">
            Discover GenXMeta Corporation
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--gmc-mahogany-dark)] font-serif">
            About{" "}
            <span className="bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
              GMC Ecosystem
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
            GMC is a wellness-focused community ecosystem built around premium
            products, growth opportunities, and value-based participation.
          </p>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: Family Lifestyle Visual Banner */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              {/* Gold Ornamented Frame */}
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-b from-[var(--gmc-gold)] via-[var(--gmc-gold-amber)]/40 to-transparent p-1 opacity-75 group-hover:opacity-100 transition-opacity duration-500 shadow-xl shadow-amber-900/10" />

              <div className="relative overflow-hidden rounded-[2.2rem] bg-white border border-[var(--gmc-gold)]/30 shadow-2xl">
                <img
                  src="/hero-family.webp"
                  alt="GMC Healthy Family Lifestyle"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Gold Overlay Card */}
                <div className="absolute bottom-1 left-4 right-4 p-2 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-[var(--gmc-gold)]/40 shadow-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0 text-white shadow-md">
                    <Heart className="w-6 h-6 fill-white/30 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--gmc-mahogany-dark)]">
                      Family Vitality & Wellness
                    </h4>
                    <p className="text-xs text-slate-600">
                      Designed to support holistic wellbeing for generations to
                      come.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive 5 Pillars List */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/10">
              <h3 className="text-sm sm:text-xl font-extrabold text-[var(--gmc-mahogany-dark)] tracking-wide flex items-center gap-2">
                <span>It Combines:</span>
                <span className="text-[10px] sm:text-xs text-[var(--gmc-gold-deep)] font-mono font-bold">
                  (Click a pillar to explore)
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              {ABOUT_PILLARS.map((pillar) => {
                const IconComponent = pillar.icon;
                const isSelected = selectedPillarId === pillar.id;

                return (
                  <button
                    type="button"
                    key={pillar.id}
                    onClick={() => setSelectedPillarId(pillar.id)}
                    className={`group relative w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "bg-white border-[var(--gmc-gold)] shadow-lg shadow-amber-900/10 scale-[1.01]"
                        : "bg-white/60 border-amber-900/10 hover:border-[var(--gmc-gold)]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Badge */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] text-white shadow-md"
                            : "bg-amber-100/60 text-[var(--gmc-mahogany)] group-hover:bg-[var(--gmc-gold)]/20"
                        }`}
                      >
                        <IconComponent className="w-5.5 h-5.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-base font-extrabold tracking-wide transition-colors ${
                              isSelected
                                ? "text-[var(--gmc-gold-deep)]"
                                : "text-[var(--gmc-mahogany-dark)] group-hover:text-[var(--gmc-gold-deep)]"
                            }`}
                          >
                            {pillar.title}
                          </h4>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {pillar.number}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {pillar.description}
                        </p>

                        {/* Highlights */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-amber-900/10 flex flex-wrap gap-2 animate-in fade-in duration-300">
                            {pillar.highlights.map((h, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--gmc-gold)]/15 border border-[var(--gmc-gold)]/30 text-[11px] font-bold text-[var(--gmc-mahogany-dark)]"
                              >
                                <CheckCircle2 className="w-3 h-3 text-[var(--gmc-gold-deep)]" />
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
