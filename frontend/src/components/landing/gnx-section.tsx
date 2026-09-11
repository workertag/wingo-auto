import {
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Package,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function GnxSection() {
  return (
    <section
      id="gnx-token"
      className="relative w-full py-12 sm:py-24 bg-[#faf8f5] text-[#1e293b] overflow-hidden border-b border-[var(--gmc-gold)]/20"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/4 w-[550px] h-[550px] bg-[var(--gmc-gold)]/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gmc-gold)]/15 border border-[var(--gmc-gold)]/30 text-[var(--gmc-gold-deep)] text-xs font-extrabold tracking-widest uppercase">
            <Coins className="w-3.5 h-3.5" /> Digital Rewards & Entry
            Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--gmc-mahogany-dark)] font-serif">
            BUY HEALTH.{" "}
            <span className="bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
              <br className="sm:hidden" />
              EARN GNX.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            A health and digital-rewards ecosystem connecting real wellness
            products with future token utility and auto-pool pathways.
          </p>
        </div>

        {/* ════════ 1. GNX TOKEN SPECIFICATION SECTION (DISPLAYED FIRST) ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: 3D GNX Token Banner Visual */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[var(--gmc-gold)] via-[var(--gmc-gold-amber)] to-amber-200 opacity-40 group-hover:opacity-70 blur-xl transition duration-500" />

              <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--gmc-gold)]/30 shadow-2xl shadow-amber-950/10">
                <img
                  src="/gnx-rewards-banner.webp"
                  alt="GNX Token 3D Coin"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Specs Overlay */}
                <div className="absolute bottom-2 left-4 right-4 p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-[var(--gmc-gold)]/40 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--gmc-gold)] text-white flex items-center justify-center font-black shadow-md">
                      GNX
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                        Global Network Exchange
                      </div>
                      <div className="text-[11px] text-[var(--gmc-gold-deep)] font-mono font-bold">
                        Powered by Bio-Wellness
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Base Value
                    </div>
                    <div className="text-sm font-extrabold text-[var(--gmc-gold-deep)]">
                      $0.10 USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: What is GNX Token & Specifications */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/30 space-y-6 shadow-xl shadow-amber-950/5">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif mb-2">
                  What is GNX Token?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  GNX is a health-based digital reward token credited to users
                  upon qualifying GMC Mito C Care product package purchases
                  ($0.10 base value).
                </p>
              </div>

              {/* Specs Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-900/10">
                  <div className="text-xs text-slate-500 font-semibold">
                    Base Token Value
                  </div>
                  <div className="text-xl font-black text-[var(--gmc-gold-deep)] font-serif mt-0.5">
                    $0.10{" "}
                    <span className="text-xs font-normal text-slate-500">
                      / GNX
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-900/10">
                  <div className="text-xs text-slate-500 font-semibold">
                    Total Supply Cap
                  </div>
                  <div className="text-xl font-black text-[var(--gmc-sage)] font-serif mt-0.5">
                    140 Million{" "}
                    <span className="text-xs font-normal text-slate-500">
                      GNX
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Concept Callout */}
              <div className="p-4 rounded-2xl bg-[var(--gmc-gold)]/10 border border-[var(--gmc-gold)]/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--gmc-gold-deep)] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong className="text-[var(--gmc-gold-deep)] font-extrabold">
                    Main Concept:
                  </strong>{" "}
                  Purchase $100 GMC Product Package = Get $100 Worth of Free GNX
                  Tokens + 50 BV.
                </div>
              </div>

              {/* Important Clarification Disclaimer */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed font-medium">
                  <strong className="font-extrabold text-[var(--gmc-mahogany-dark)]">
                    Important Clarification:
                  </strong>{" "}
                  Users do not directly purchase GNX in the initial structure.
                  Tokens are provided as a complimentary Wellness Reward.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ 2. GMC ENTRY OPTIONS SECTION (DISPLAYED BELOW) ════════ */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
              Start Your GMC Journey
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Choose your preferred entry pathway into the GMC Bio-Wellness &
              Auto Pool ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Option 1: Product Package */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[var(--gmc-gold)]/40 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--gmc-gold)] transition-all">
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                Recommended Package
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--gmc-gold)]/15 text-[var(--gmc-gold-deep)] flex items-center justify-center font-black">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase text-[var(--gmc-gold-deep)] tracking-wider">
                    Option 1: Product Package
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif mt-1">
                    $100 Product Package — 50 BV
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Purchase GMC Mito C Care worth $100 and receive complete
                  bio-wellness product delivery along with complimentary digital
                  rewards.
                </p>

                <div className="space-y-2.5 pt-2 border-t border-amber-900/10">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      $100 worth of GNX Tokens (1,000 GNX @ $0.10 base value)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>50 BV (Business Volume) credited</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>60 N Tablets Mito C Care Delivered</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-[var(--gmc-gold)]/20 text-xs text-slate-600 font-semibold text-center">
                Full $100 upfront purchase with maximum product and token
                rewards.
              </div>
            </div>

            {/* Option 2: Auto Pool Entry */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/30 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--gmc-gold)] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <Flame className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-epaxtrabold uppercase text-amber-700 tracking-wider">
                    Option 2: Auto Pool Entry
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif mt-1">
                    $25 Auto Pool Entry — Compulsory Token Burn
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Participate directly in the company Auto Pool rewards system
                  through structured token burn cycles.
                </p>

                <div className="space-y-2.5 pt-2 border-t border-amber-900/10">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Burn $25 worth of tokens (250 GNX) for pool qualification
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <RefreshCcw className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Entry into company Auto Pool for 4 full cycles</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Burn another $25 worth of tokens after every 4 cycles to
                      continue
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-[var(--gmc-gold)]/20 text-xs text-slate-600 font-semibold text-center">
                Compulsory token burn mechanism driving continuous GNX token
                scarcity.
              </div>
            </div>
          </div>

          {/* Flexibility Banner: If You Do Not Have $100 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-100/80 via-white to-amber-100/70 border border-[var(--gmc-gold)]/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/60 border border-[var(--gmc-gold)]/30 text-xs font-black uppercase text-[var(--gmc-mahogany-dark)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--gmc-gold-deep)]" />{" "}
                  Flexible Installment Booking
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                  If You Do Not Have $100
                </h4>
              </div>
              <span className="px-4 py-2 rounded-2xl bg-white border border-[var(--gmc-gold)]/30 text-xs font-extrabold text-[var(--gmc-gold-deep)] shadow-xs">
                Book with $25 • Pay $100 in 30 Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-amber-900/10 space-y-1">
                <div className="text-xs font-bold text-[var(--gmc-gold-deep)]">
                  Step 1: Booking
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Book the product package with an initial <strong>$25</strong>{" "}
                  payment.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-900/10 space-y-1">
                <div className="text-xs font-bold text-[var(--gmc-gold-deep)]">
                  Step 2: 30-Day Window
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Complete total <strong>$100</strong> payment within 30 days.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-900/10 space-y-1">
                <div className="text-xs font-bold text-emerald-700">
                  Step 3: Delivery
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  The product will be dispatched immediately after completing
                  $100.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-900/10 space-y-1">
                <div className="text-xs font-bold text-amber-700">
                  Step 4: Cycle Reset
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  After 30 days, pay $100 to start the next cycle again.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ EQUATION BREAKDOWN BANNER ════════ */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-100/70 via-white to-amber-100/60 border border-[var(--gmc-gold)]/40 shadow-xl text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-[var(--gmc-mahogany-dark)] font-serif uppercase tracking-wider">
              The Ecosystem Value Formula
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              How real-world wellness products drive long-term digital token
              utility and pool liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-8 gap-4 items-center max-w-4xl mx-auto">
            {/* Box 1 */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-white border border-amber-900/10 text-center space-y-1 shadow-sm">
              <div className="text-xs font-extrabold text-[var(--gmc-gold-deep)]">
                $100 Product Package
              </div>
              <div className="text-xs text-slate-500 font-medium">
                60 Tablets + 50 BV
              </div>
            </div>

            {/* Plus */}
            <div className="text-[var(--gmc-gold-deep)] font-black text-xl">
              +
            </div>

            {/* Box 2 */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-white border border-amber-900/10 text-center space-y-1 shadow-sm">
              <div className="text-xs font-extrabold text-emerald-700">
                $100 Free GNX Tokens
              </div>
              <div className="text-xs text-slate-500 font-medium">
                1,000 GNX Rewards
              </div>
            </div>

            {/* Equals */}
            <div className="text-[var(--gmc-gold-deep)] font-black text-xl">
              =
            </div>

            {/* Box 3 */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white text-center space-y-1 shadow-md">
              <div className="text-xs font-black">Auto Pool & Ecosystem</div>
              <div className="text-xs text-amber-100 font-medium">
                $25 Compulsory Burn Cycles
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
