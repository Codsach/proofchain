import type { Metadata, Viewport } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { AuthProvider } from "@/components/providers/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "ProofChain — Digital Forensic Evidence Platform",
  description: "Secure, blockchain-anchored evidence capture and verification",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ProofChain",
  },
  formatDetection: {
    telephone: false,
  },
    icons: {
      icon: [
        { url: "/logo.png", sizes: "any" },
      ],
      apple: [
        { url: "/logo.png", sizes: "180x180" },
      ],
    },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* PWA iOS meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Required for camera access on iOS PWA */}
        <meta name="allow" content="camera; geolocation; microphone" />
      </head>
      <body className="font-sans antialiased bg-background selection:bg-emerald-500/30">
        <ServiceWorkerProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </ServiceWorkerProvider>
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}