import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About GMC", href: "/#about" },
  { label: "Products", href: "/#products" },
  { label: "Vision & Mission", href: "/#vision-mission" },
  { label: "Ecosystem", href: "/#ecosystem" },
  { label: "GNX Token", href: "/#gnx-token" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = NAV_ITEMS.map((item) => item.href.substring(1));
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const id = href.substring(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-[var(--gmc-gold)]/20 shadow-md shadow-amber-950/5 py-3"
          : "bg-white/70 backdrop-blur-sm py-4 border-b border-amber-900/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <a href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-br from-[var(--gmc-gold)]/10 via-amber-50 to-[var(--gmc-cream)] border border-[var(--gmc-gold)]/30 group-hover:border-[var(--gmc-gold)] transition-all duration-300 shadow-sm">
              <img
                src="/logo.svg"
                alt="GMC Logo"
                className="h-11 sm:h-14 object-contain drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  const fallback = document.getElementById(
                    "header-fallback-logo",
                  );
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <img
                src="/gmc.webp"
                alt="GMC Logo Fallback"
                className="h-8 w-auto object-contain hidden border-none"
                id="header-fallback-logo"
              />
            </div>
            <div className="hidden flex flex-col">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent">
                GMC
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500 -mt-1">
                GenXMeta Corporation
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-amber-50/80 border border-[var(--gmc-gold)]/20 px-4 py-1.5 rounded-full backdrop-blur-md shadow-inner">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href.substring(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-md shadow-[var(--gmc-gold)]/25"
                      : "text-slate-700 hover:text-[var(--gmc-mahogany)] hover:bg-white/80"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg hover:shadow-[var(--gmc-gold)]/40 transition-all duration-300 active:scale-95"
            >
              <span>Launch App</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-amber-50 border border-[var(--gmc-gold)]/20 text-slate-700 hover:text-black hover:bg-amber-100/60 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-white/95 backdrop-blur-xl border-b border-[var(--gmc-gold)]/20 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href.substring(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                    isActive
                      ? "bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] border-l-4 border-[var(--gmc-gold)]"
                      : "text-slate-700 hover:bg-amber-50 hover:text-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <ArrowUpRight className="w-4 h-4 text-[var(--gmc-gold)]" />
                  )}
                </a>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm tracking-wider uppercase text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] shadow-lg shadow-[var(--gmc-gold)]/30"
              >
                <span>Launch App</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
