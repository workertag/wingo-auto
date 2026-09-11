import { Link } from "@tanstack/react-router";
import { ArrowUp, ChevronRight, ShieldCheck } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const _scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative w-full bg-[#1e130a] text-slate-300 text-sm border-t border-[var(--gmc-gold)]/30 overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--gmc-gold)]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10 space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-white/80 border border-[var(--gmc-gold)]/30">
                <img
                  src="/logo.svg"
                  alt="GMC Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <div className="text-xl font-black text-white tracking-wider bg-gradient-to-r from-[var(--gmc-gold-light)] to-[var(--gmc-gold)] bg-clip-text text-transparent">
                  GMC
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-amber-200/80">
                  GenXMeta Corporation
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              GMC is a wellness-focused community ecosystem built around premium
              nutraceutical products, growth opportunities, and value-based
              digital participation.
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-200 font-medium">
              <ShieldCheck className="w-4 h-4 text-[var(--gmc-gold)]" />
              <span>FSSAI / GMP / ISO Compliant Standards</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-amber-200 uppercase tracking-widest border-b border-amber-500/20 pb-2">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { label: "Home", id: "/" },
                { label: "About GMC", id: "/#about" },
                { label: "Mito C Care Product", id: "/#products" },
                { label: "Vision & Mission", id: "/#vision-mission" },
                { label: "Ecosystem Architecture", id: "/#ecosystem" },
                { label: "GNX Token Rewards", id: "/#gnx-token" },
              ].map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.id}
                    className="hover:text-[var(--gmc-gold-light)] transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                  >
                    <ChevronRight className="w-3 h-3 text-[var(--gmc-gold)]" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Product & Utility */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-amber-200 uppercase tracking-widest border-b border-amber-500/20 pb-2">
              Ecosystem
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300 font-medium">
                  GMC Mito C Care
                </span>
              </li>
              <li>
                <span className="text-slate-300 font-medium">
                  GNX Wellness Rewards
                </span>
              </li>
              <li>
                <span className="text-slate-300 font-medium">
                  Decentralized Wallet
                </span>
              </li>
              <li>
                <span className="text-slate-300 font-medium">
                  Community Platform
                </span>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-[var(--gmc-gold-light)] font-bold hover:underline"
                >
                  Launch Portal &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-[11px] text-slate-400 leading-relaxed">
          <div className="font-bold text-amber-200 uppercase tracking-wider text-[10px]">
            Compliance & Regulatory Disclaimer
          </div>
          <p>
            GMC products and GNX Tokens are governed by applicable terms and
            reward policies. GNX is provided as a complimentary Wellness Reward
            upon eligible product purchases and does not constitute a financial
            security or direct investment solicitation. Product availability,
            regulatory approvals (FSSAI, ISO, GMP), and terms are subject to
            change.
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} GenXMeta Corporation (GMC). All rights
            reserved.
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[var(--gmc-gold)]/30 border border-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
