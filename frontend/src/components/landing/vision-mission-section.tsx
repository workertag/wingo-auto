import {
  CheckCircle2,
  Eye,
  FileCheck,
  Globe,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export default function VisionMissionSection() {
  return (
    <section
      id="vision-mission"
      className="relative w-full py-10 sm:py-20 bg-[#faf8f5] text-[#1e293b] overflow-hidden border-b border-[var(--gmc-gold)]/20"
    >
      {/* Glow ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[var(--gmc-gold)]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gmc-gold)]/15 border border-[var(--gmc-gold)]/30 text-[var(--gmc-gold-deep)] text-xs font-extrabold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5" /> Core Principles & Governance
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--gmc-mahogany-dark)] font-serif">
            Vision, Mission &{" "}
            <span className="bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
              Compliance
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            GMC GenXMeta Corporation is anchored by transparency, regulatory
            alignment, and long-term community value.
          </p>
        </div>

        {/* 3 Column Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CARD 1: OUR VISION */}
          <div className="group relative p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/30 hover:border-[var(--gmc-gold)] transition-all duration-500 shadow-xl shadow-amber-950/5 hover:shadow-2xl hover:shadow-[var(--gmc-gold)]/15 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Gold Eye Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] flex items-center justify-center text-white shadow-lg shadow-[var(--gmc-gold)]/25 group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black tracking-wide text-[var(--gmc-mahogany-dark)] uppercase font-serif">
                  OUR VISION
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-[var(--gmc-gold)] to-transparent mx-auto rounded-full" />
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-center italic font-normal">
                "To build an integrated global ecosystem where health products,
                digital technology, community participation, and practical token
                utility work seamlessly together."
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-amber-900/10 flex items-center justify-center gap-2 text-xs font-extrabold text-[var(--gmc-gold-deep)]">
              <Globe className="w-4 h-4" /> Global Ecosystem Focus
            </div>
          </div>

          {/* CARD 2: OUR MISSION */}
          <div className="group relative p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/30 hover:border-[var(--gmc-gold)] transition-all duration-500 shadow-xl shadow-amber-950/5 hover:shadow-2xl hover:shadow-[var(--gmc-gold)]/15 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Target Bullseye Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] flex items-center justify-center text-white shadow-lg shadow-[var(--gmc-gold)]/25 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black tracking-wide text-[var(--gmc-mahogany-dark)] uppercase font-serif">
                  OUR MISSION
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-[var(--gmc-gold)] to-transparent mx-auto rounded-full" />
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                {[
                  "Provide quality wellness products",
                  "Build a transparent community platform",
                  "Create product-linked reward opportunities",
                  "Develop secure digital financial tools",
                  "Establish long-term utility for GNX",
                  "Expand GMC into international markets",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--gmc-gold-deep)] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-amber-900/10 flex items-center justify-center gap-2 text-xs font-extrabold text-[var(--gmc-gold-deep)]">
              <Sparkles className="w-4 h-4" /> 6-Pillar Execution Strategy
            </div>
          </div>

          {/* CARD 3: CERTIFICATIONS AND COMPLIANCE */}
          <div className="group relative p-8 rounded-3xl bg-white border border-[var(--gmc-gold)]/30 hover:border-[var(--gmc-gold)] transition-all duration-500 shadow-xl shadow-amber-950/5 hover:shadow-2xl hover:shadow-[var(--gmc-gold)]/15 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Shield Check Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] flex items-center justify-center text-white shadow-lg shadow-[var(--gmc-gold)]/25 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black tracking-wide text-[var(--gmc-mahogany-dark)] uppercase font-serif">
                  CERTIFICATIONS
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-[var(--gmc-gold)] to-transparent mx-auto rounded-full" />
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                {[
                  "Company Registration Certificate Verified",
                  "Product Certification (GMP / ISO Compliant)",
                  "FSSAI Food Safety Standards",
                  "Trademark & Brand Protection",
                  "Secure Exchange & Wallet Architecture",
                  "Regulatory Status & PMS Alignment",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-amber-900/10 flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="w-4 h-4" /> Regulatory Standards
              Maintained
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
