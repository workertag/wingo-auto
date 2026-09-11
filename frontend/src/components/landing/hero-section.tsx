import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EcosystemActivity {
  id: string;
  type: "reward" | "product" | "community";
  title: string;
  detail: string;
}

const SAMPLE_ACTIVITIES: EcosystemActivity[] = [
  {
    id: "1",
    type: "reward",
    title: "GNX Reward Allocated",
    detail: "+250 GNX credited for Mito C Care Purchase",
  },
  {
    id: "2",
    type: "product",
    title: "Mito C Care Shipped",
    detail: "60 Tablets Pack dispatched to Mumbai, IN",
  },
  {
    id: "3",
    type: "community",
    title: "New Ecosystem Member",
    detail: "Joined GMC Global Wellness Community",
  },
  {
    id: "4",
    type: "reward",
    title: "Auto Pool Entry Completed",
    detail: "Participant qualified for Tier-1 Rewards",
  },
  // {
  //   id: "5",
  //   type: "product",
  //   title: "Mito C Care Shipped",
  //   detail: "60 Tablets Pack dispatched to Mumbai, IN",
  // },
  // {
  //   id: "6",
  //   type: "community",
  //   title: "New Ecosystem Member",
  //   detail: "Joined GMC Global Wellness Community",
  // },
];

const HERO_SLIDES = [
  {
    id: "slide-1",
    src: "/gmc5.webp",
    alt: "GenXMeta Bio-Wellness Platform",
    title: "GenXMeta Bio-Wellness",
    subtitle: "Pioneering Future Bio-Technology",
    badge: "Luxury Wellness",
  },
  {
    id: "slide-2",
    src: "/gmc2.webp",
    alt: "GMC Mito C Care Nutraceutical",
    title: "GMC Mito C Care",
    subtitle: "L-Ergothioneine Bio-Nutraceutical",
    badge: "Flagship Formula",
  },
  {
    id: "slide-3",
    src: "/gmc4.webp",
    alt: "GMC Interconnected Digital Ecosystem",
    title: "Digital Ecosystem",
    subtitle: "Wallet, Exchange & Community",
    badge: "Unified Network",
  },
  {
    id: "slide-4",
    src: "/gmc7.webp",
    alt: "GMC GNX Token & Digital Rewards",
    title: "GNX Token Rewards",
    subtitle: "Digital Health & Longevity Utility",
    badge: "GNX Rewards",
  },
  // {
  //   id: "slide-5",
  //   src: "/gmc2.webp",
  //   alt: "GMC Mito C Care Nutraceutical",
  //   title: "GMC Mito C Care",
  //   subtitle: "L-Ergothioneine Bio-Nutraceutical",
  //   badge: "Flagship Formula",
  // },
  // {
  //   id: "slide-6",
  //   src: "/gmc5.webp",
  //   alt: "GenXMeta Bio-Wellness Platform",
  //   title: "GenXMeta Bio-Wellness",
  //   subtitle: "Pioneering Future Bio-Technology",
  //   badge: "Luxury Wellness",
  // },
];

export default function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Activity ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveActivityIndex((prev) => (prev + 1) % SAMPLE_ACTIVITIES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Infinite Auto-slide for Hero Image Carousel
  useEffect(() => {
    if (isHovered) return;
    const slideInterval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [isHovered]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === 0 ? HERO_SLIDES.length - 1 : prev - 1,
    );
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const _currentActivity = SAMPLE_ACTIVITIES[activeActivityIndex]!;
  const currentSlide = HERO_SLIDES[currentSlideIndex]!;

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative w-full min-h-screen bg-gradient-to-b from-[#ffffff] via-[#fdfbf7] to-[#f8f4ec] text-[#1e293b] pt-28 sm:pt-15 pb-10 overflow-hidden flex flex-col justify-center border-b border-[var(--gmc-gold)]/20"
    >
      {/* Soft Gold Glow Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--gmc-gold)]/10 blur-[130px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
      />
      <div
        className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full bg-amber-200/40 blur-[100px] pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
        }}
      />

      {/* Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(var(--gmc-mahogany) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ════════ LEFT COLUMN ════════ */}
          <div
            className={`lg:col-span-7 space-y-6 sm:space-y-8 text-left transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--gmc-gold)]/15 via-amber-50 to-amber-100/60 border border-[var(--gmc-gold)]/30 shadow-sm backdrop-blur-md">
              <span className="text-xs sm:text-sm font-extrabold text-[var(--gmc-mahogany-dark)] tracking-wider uppercase">
                GenXMeta Corporation Ecosystem
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[var(--gmc-gold-amber)]" />
              <span className="hidden sm:inline-block text-xs font-bold text-slate-700">
                Pioneering Bio-Wellness & Digital Rewards
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] text-[var(--gmc-mahogany-dark)] font-serif">
              Empowering Wealth{" "}
              <span className="hidden sm:inline-block">&</span>
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-[var(--gmc-gold-deep)] via-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] bg-clip-text text-transparent drop-shadow-sm">
                Digital Rewards Utility
              </span>
            </h1>

            <div
              className={`sm:hidden mt-12 relative transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none group">
                {/* Outer Soft Glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-light)] to-[var(--gmc-sage)] opacity-30 group-hover:opacity-50 blur-xl transition duration-500" />

                {/* Main Banner Container */}
                <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--gmc-gold)]/30 shadow-2xl shadow-amber-950/10">
                  {/* Sliding Track */}
                  <div
                    className="flex transition-transform duration-700 ease-in-out w-full"
                    style={{
                      transform: `translateX(-${currentSlideIndex * 100}%)`,
                    }}
                  >
                    {HERO_SLIDES.map((slide) => (
                      <div key={slide.id} className="w-full shrink-0 relative">
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          className="w-full h-400 max-h-[400px] aspect-[4/3] sm:aspect-auto object-cover transform group-hover:scale-105 transition-transform duration-700 rounded-3xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/hero-banner-new.webp";
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Left/Right Carousel Controls */}
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Previous Slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-[var(--gmc-gold)]/30 opacity-70 hover:opacity-100 transition-all z-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next Slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-[var(--gmc-gold)]/30 opacity-70 hover:opacity-100 transition-all z-30 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Pagination Controls */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    {HERO_SLIDES.map((_, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          currentSlideIndex === idx
                            ? "w-6 bg-[var(--gmc-gold)]"
                            : "w-2 bg-white/60 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {/* Top Badge Overlay */}
                <div className="absolute -top-10 left-4 right-4 flex items-center justify-between p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-[var(--gmc-gold)]/30 shadow-md z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--gmc-gold)]/20 text-[var(--gmc-gold-deep)]">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                        {currentSlide.title}
                      </div>
                      <div className="flex text-[10px] text-slate-600 font-semibold items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />{" "}
                        {currentSlide.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
              GMC bridges premium nutraceutical wellness products like{" "}
              <strong className="text-[var(--gmc-mahogany)] font-bold">
                Mito C Care
              </strong>{" "}
              with an integrated digital ecosystem. Experience product-linked{" "}
              <strong className="text-[var(--gmc-gold-deep)] font-bold">
                GNX Token Rewards
              </strong>
              , community growth, and global opportunities.
            </p>

            {/* CTAs */}
            <div className="flex sm:gap-4 gap-2 items-stretch sm:items-center pt-2">
              <button
                type="button"
                onClick={() => scrollToSection("products")}
                className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-8 sm:py-4 rounded-2xl text-white font-extrabold text-base tracking-wide uppercase bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-xl shadow-[var(--gmc-gold)]/25 hover:shadow-2xl hover:shadow-[var(--gmc-gold)]/40 transition-all duration-300 cursor-pointer active:scale-95"
              >
                <span className="flex items-center gap-3">
                  Explore <span className="hidden sm:block">Products</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-3 sm:px-8 sm:py-4 rounded-2xl text-[var(--gmc-mahogany-dark)] hover:text-black font-bold text-base tracking-wide bg-white hover:bg-amber-50 border border-[var(--gmc-gold)]/30 hover:border-[var(--gmc-gold)] shadow-md transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Launch Portal
                  <ChevronRight className="w-4 h-4 text-[var(--gmc-gold)]" />
                </span>
              </Link>
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-4 sm:pt-8 border-t border-amber-900/10">
              <div className="flex flex-col p-4 rounded-2xl bg-white border border-[var(--gmc-gold)]/20 shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                  60 N
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5">
                  Tablets / Bottle
                </span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl bg-white border border-[var(--gmc-gold)]/20 shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-[var(--gmc-gold-deep)] font-serif">
                  $0.10
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5">
                  GNX Base Value
                </span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl bg-white border border-[var(--gmc-gold)]/20 shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-[var(--gmc-sage)] font-serif">
                  140M
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5">
                  Total Token Supply
                </span>
              </div>
              <div className="flex flex-col p-4 rounded-2xl bg-white border border-[var(--gmc-gold)]/20 shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-[var(--gmc-product-red)] font-serif">
                  100%
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-0.5">
                  Wellness Reward
                </span>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: INFINITE SLIDING SHOWCASE ════════ */}
          <div
            ref={showcaseRef}
            className={`hidden sm:block lg:col-span-5 relative transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              {/* Outer Soft Glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[var(--gmc-gold)] via-[var(--gmc-gold-light)] to-[var(--gmc-sage)] opacity-30 group-hover:opacity-50 blur-xl transition duration-500" />

              {/* Main Banner Container */}
              <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--gmc-gold)]/30 shadow-2xl shadow-amber-950/10">
                {/* Sliding Track */}
                <div
                  className="flex transition-transform duration-700 ease-in-out w-full"
                  style={{
                    transform: `translateX(-${currentSlideIndex * 100}%)`,
                  }}
                >
                  {HERO_SLIDES.map((slide) => (
                    <div key={slide.id} className="w-full shrink-0 relative">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="w-full h-600 max-h-[500px] aspect-[4/3] sm:aspect-auto object-cover transform group-hover:scale-105 transition-transform duration-700 rounded-3xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/hero-banner-new.webp";
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Top Badge Overlay */}
                {/* <div className="absolute top-1 left-4 right-4 flex items-center justify-between p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-[var(--gmc-gold)]/30 shadow-md z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--gmc-gold)]/20 text-[var(--gmc-gold-deep)]">
                      <HeartPulse className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                        {currentSlide.title}
                      </div>
                      <div className="flex text-[10px] text-slate-600 font-semibold items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> {currentSlide.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text- text-[10px] font-black uppercase tracking-wider bg-[var(--gmc-gold)] text-white shadow-sm">
                    {currentSlide.badge}
                  </span>
                </div> */}

                {/* Left/Right Carousel Controls */}
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous Slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-[var(--gmc-gold)]/30 opacity-70 hover:opacity-100 transition-all z-30 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next Slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-[var(--gmc-gold)]/30 opacity-70 hover:opacity-100 transition-all z-30 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Pagination Controls */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlideIndex === idx
                          ? "w-6 bg-[var(--gmc-gold)]"
                          : "w-2 bg-white/60 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Top Badge Overlay */}
              <div className="absolute -top-11 left-4 right-4 flex items-center justify-between p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-[var(--gmc-gold)]/30 shadow-md z-20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--gmc-gold)]/20 text-[var(--gmc-gold-deep)]">
                    <HeartPulse className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                      {currentSlide.title}
                    </div>
                    <div className="flex text-[10px] text-slate-600 font-semibold items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />{" "}
                      {currentSlide.subtitle}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text- text-[10px] font-black uppercase tracking-wider bg-[var(--gmc-gold)] text-white shadow-sm">
                  {currentSlide.badge}
                </span>
              </div>

              {/* Decorative Floating Tokens Badge */}
              <div className="absolute -bottom-10 left-14 sm:-left-6 flex items-center gap-3 p-4 rounded-2xl bg-white border border-[var(--gmc-gold)]/40 shadow-xl shadow-amber-950/10 backdrop-blur-xl animate-bounce-slow z-30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gmc-gold)] to-[var(--gmc-gold-deep)] flex items-center justify-center text-white font-extrabold shadow-md">
                  GNX
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[var(--gmc-mahogany-dark)]">
                    Wellness Rewards
                  </div>
                  <div className="text-[11px] font-bold text-[var(--gmc-gold-deep)]">
                    1 GNX = $0.10 Base Value
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
