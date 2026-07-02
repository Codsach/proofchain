// app/page.tsx — ProofChain Landing Page
import type { Metadata } from "next";
import "./landing.css";
import LandingNav      from "@/components/landing/LandingNav";
import HeroSection     from "@/components/landing/HeroSection";
import TrustSection    from "@/components/landing/TrustSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks      from "@/components/landing/HowItWorks";
import RolesSection    from "@/components/landing/RolesSection";
import CTASection      from "@/components/landing/CTASection";
import LandingFooter   from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "ProofChain — Tamper-Proof Digital Forensic Evidence Platform",
  description:
    "Every file cryptographically sealed, AI-analysed for integrity, and anchored on the Polygon blockchain. Signed chain-of-custody transfers. Public QR verification.",
  keywords: [
    "digital forensics",
    "blockchain evidence",
    "tamper-proof",
    "chain of custody",
    "IPFS",
    "Polygon Amoy",
    "Gemini Vision",
    "forensic analysis",
  ],
  openGraph: {
    title: "ProofChain — Tamper-Proof Digital Forensic Evidence",
    description:
      "Cryptographically sealed, AI-analysed, blockchain-anchored digital evidence for cybersecurity forensic teams.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="lp-root" style={{ minHeight: "100dvh", position: "relative" }}>
      <LandingNav />
      <main style={{ position: "relative" }}>
        <HeroSection />
        {/* Premium metrics section — directly below hero */}
        <TrustSection />
        <FeaturesSection />
        <HowItWorks />
        <RolesSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}