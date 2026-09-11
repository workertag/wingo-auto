import AboutSection from "./about-section";
import EcosystemSection from "./ecosystem-section";
import Footer from "./footer";
import GnxSection from "./gnx-section";
import Header from "./header";
import HeroSection from "./hero-section";
import ProductSection from "./product-section";
import VisionMissionSection from "./vision-mission-section";

export default function LandingPage() {
  return (
    <div className="bg-[#faf8f6] text-[#1e293b] font-sans antialiased selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)] min-h-screen">
      <Header />
      <main className="w-full">
        <HeroSection />
        <AboutSection />
        <ProductSection />
        <VisionMissionSection />
        <EcosystemSection />
        <GnxSection />
      </main>
      <Footer />
    </div>
  );
}
