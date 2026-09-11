import {
  Activity,
  Brain,
  Check,
  Coins,
  Heart,
  Pill,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";

const CORE_BENEFITS = [
  {
    id: "mitochondrial",
    title: "Mitochondrial Function",
    subtitle: "Cellular Energy & ATP Output",
    icon: Zap,
    description:
      "L-Ergothioneine targets mitochondrial membranes directly to neutralize reactive oxygen species (ROS) and optimize ATP cellular energy output.",
    bullets: [
      "Optimizes ATP mitochondrial bio-energy production",
      "Reduces cellular fatigue and oxidative damage",
      "Protects mitochondrial DNA from free radical stress",
    ],
  },
  {
    id: "antioxidant",
    title: "Cellular Antioxidant Defence",
    subtitle: "Master Cellular Protection",
    icon: Activity,
    description:
      "Accumulates preferentially in cells under high oxidative stress via dedicated OCTN1 transporters for long-lasting cellular defense.",
    bullets: [
      "Extended cellular half-life for continuous protection",
      "Neutralizes cytotoxic hydroxyl and peroxynitrite radicals",
      "Synergizes with endogenous antioxidant networks",
    ],
  },
  {
    id: "brain",
    title: "Brain & Cognitive Wellness",
    subtitle: "Neuronal Protection & Focus",
    icon: Brain,
    description:
      "Crosses the blood-brain barrier to shield neurons, enhance mental sharpness, and support long-term healthy cognitive aging.",
    bullets: [
      "Crosses blood-brain barrier via OCTN1 transporter",
      "Sustains memory retention and mental agility",
      "Supports healthy neural integrity and longevity",
    ],
  },
  {
    id: "vitality",
    title: "Daily Energy & Vitality",
    subtitle: "Systemic Performance",
    icon: Heart,
    description:
      "Sustains peak physical performance and daily endurance by preventing cellular oxygen depletion during physical and environmental stress.",
    bullets: [
      "Boosts daily stamina and physical recovery",
      "Reduces systemic fatigue and metabolic drain",
      "Supports vascular and endothelial resilience",
    ],
  },
];

export default function ProductSection() {
  const [activeTabId, setActiveTabId] = useState("mitochondrial");
  const [packageQty, setPackageQty] = useState(1);

  const activeTab =
    CORE_BENEFITS.find((t) => t.id === activeTabId) || CORE_BENEFITS[0]!;

  const packagePrice = 100; // MRP $100 per package
  const bvPerPackage = 50;
  const gnxTokensPerPackage = 1000; // $100 worth of tokens at $0.10 base value

  const totalPrice = packageQty * packagePrice;
  const totalBV = packageQty * bvPerPackage;
  const totalGnxReward = packageQty * gnxTokensPerPackage;

  return (
    <section
      id="products"
      className="relative w-full py-12 sm:py-24 bg-[#ffffff] text-[#1e293b] overflow-hidden border-b border-[var(--gmc-gold)]/20"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-[var(--gmc-gold)]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[var(--gmc-product-red)]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Title Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-amber-900/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-[var(--gmc-product-red)]/30 text-[var(--gmc-product-crimson)] text-xs font-extrabold tracking-widest uppercase">
              <Pill className="w-3.5 h-3.5" /> Flagship Bio-Nutraceutical
              Formula
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--gmc-mahogany-dark)] font-serif">
              GMC{" "}
              <span className="bg-gradient-to-r from-[var(--gmc-product-red)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
                MITO C CARE
              </span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Powered by pure{" "}
              <strong className="text-[var(--gmc-gold-deep)] font-bold">
                L-Ergothioneine
              </strong>{" "}
              — the master longevity antioxidant engineered to support cellular
              energy, brain wellness, and healthy ageing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-amber-50/70 border border-[var(--gmc-gold)]/30 p-4 rounded-2xl shadow-sm">
            <div className="text-left space-y-0.5">
              <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                Pack Size: 60 N Tablets
              </div>
              <div className="text-sm font-black text-[var(--gmc-gold-deep)]">
                MRP: $100 USD
              </div>
            </div>
            <div className="h-8 w-px bg-amber-900/15 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 50 BV + $100
              Tokens Included
            </div>
          </div>
        </div>

        {/* ════════ INTERACTIVE PRODUCT SHOWCASE ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: 3D Product Showcase Banner */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[var(--gmc-product-red)] via-[var(--gmc-gold)] to-[var(--gmc-sage)] opacity-25 group-hover:opacity-45 blur-xl transition duration-500" />

              <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--gmc-gold)]/30 shadow-2xl shadow-amber-950/10">
                <img
                  src="/gmc1.webp"
                  alt="GMC Mito C Care Showcase"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Specs Card */}
                <div className="absolute top-2 left-2 sm:left-4 p-2 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[var(--gmc-gold)]/30 shadow-md flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--gmc-gold)]/20 flex items-center justify-center text-[var(--gmc-gold-deep)]">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                      Active Molecule
                    </div>
                    <div className="text-[11px] text-[var(--gmc-gold-deep)] font-mono font-bold">
                      L-Ergothioneine
                    </div>
                  </div>
                </div>

                {/* Free Reward Callout */}
                <div className="absolute right-2 sm:right-4 bottom-3 p-2 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-500/30 shadow-md flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-800">
                    $100 Free GNX Token Reward Included
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Targeted Cellular Benefits Tabs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                Bio-Wellness Support Pillars
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Explore the targeted cellular mechanisms of GMC Mito C Care:
              </p>
            </div>

            {/* Tab Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-amber-50/60 border border-[var(--gmc-gold)]/20 shadow-inner">
              {CORE_BENEFITS.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTabId === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-md shadow-[var(--gmc-gold)]/25"
                        : "text-slate-600 hover:text-black hover:bg-white/80"
                    }`}
                  >
                    <TabIcon className="w-4 h-4 sm:h-6 sm:w-6 mb-1" />
                    <span className="text-[11px] sm:text-sm text-center leading-tight">
                      {tab.title.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Details Card */}
            <div className="p-6 rounded-2xl bg-white border border-[var(--gmc-gold)]/30 shadow-md space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[var(--gmc-gold)]/20 text-[var(--gmc-gold-deep)]">
                  <activeTab.icon className="w-6 h-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-extrabold text-[var(--gmc-mahogany-dark)]">
                    {activeTab.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--gmc-gold-deep)] font-bold">
                    {activeTab.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {activeTab.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-amber-900/10">
                {activeTab.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium"
                  >
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 sm:h-4 sm:w-4" />
                    </div>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════ REWARD & PRODUCT CALCULATOR CARD ════════ */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-[#ffffff] via-[#fffdfa] to-[#f8f4ec] border border-[var(--gmc-gold)]/40 shadow-2xl shadow-amber-950/10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--gmc-gold-deep)] uppercase tracking-wider">
                <Coins className="w-4 h-4 text-[var(--gmc-gold)]" /> Package &
                Reward Calculator
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                $100 Product Package — 50 BV
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Each $100 GMC Mito C Care product package includes 60 tablets,
                50 Business Volume (BV), plus{" "}
                <strong>$100 worth of free GNX Wellness Rewards</strong> (1,000
                GNX @ $0.10 base value).
              </p>

              {/* Package Quantity Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-700">
                  <span>Product Package Quantity:</span>
                  <span className="text-base font-extrabold text-[var(--gmc-gold-deep)]">
                    {packageQty} {packageQty === 1 ? "Package" : "Packages"} (
                    {packageQty * 60} Tablets)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 4, 5, 10].map((qty) => (
                    <button
                      type="button"
                      key={qty}
                      onClick={() => setPackageQty(qty)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        packageQty === qty
                          ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white font-extrabold shadow-md shadow-[var(--gmc-gold)]/25"
                          : "bg-white border border-amber-900/10 text-slate-700 hover:bg-amber-50"
                      }`}
                    >
                      {qty}x ($100 ea)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-amber-900/10 shadow-sm space-y-1">
                <div className="text-xs text-slate-500 font-semibold">
                  Package Total
                </div>
                <div className="text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                  ${totalPrice} USD
                </div>
                <div className="text-xs text-[var(--gmc-gold-deep)] font-extrabold">
                  + {totalBV} BV Allocated
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-100/60 border border-[var(--gmc-gold)]/40 shadow-sm space-y-1">
                <div className="text-xs text-[var(--gmc-gold-deep)] font-extrabold uppercase tracking-wider">
                  Free GNX Reward
                </div>
                <div className="text-3xl font-black text-[var(--gmc-gold-deep)] font-serif">
                  +{totalGnxReward} GNX
                </div>
                <div className="text-[11px] text-[var(--gmc-gold-ochre)] font-mono font-bold">
                  $100 Value @ $0.10/GNX
                </div>
              </div>

              {/* Partial Payment Flexibility Note */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold p-2">
                    $25
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                      Flexible Booking Option
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Book with <strong>$25</strong> and complete total $100
                      payment within 30 days for product dispatch.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
