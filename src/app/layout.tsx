import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { AuthProvider } from "@/components/providers/AuthContext";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
  themeColor: "#0f1117",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* PWA iOS meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Required for camera access on iOS PWA */}
        <meta name="allow" content="camera; geolocation; microphone" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ServiceWorkerProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ServiceWorkerProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}