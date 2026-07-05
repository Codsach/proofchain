"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isInvestigator = pathname?.startsWith("/investigator");
  const isInvestigatorDashboard = pathname === "/investigator";
  const isSubmitPage = pathname === "/investigator/submit";
  const isAnalyst = pathname?.startsWith("/analyst");
  const isProfile = pathname === "/profile";
  const isProfilePage = pathname === "/profile";
  const isSettings = pathname === "/settings";
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dash-bg)]">
        <div className="text-emerald-600/70 text-sm animate-pulse font-mono font-semibold tracking-widest uppercase">Initializing System…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className={cn(
        "relative flex h-screen overflow-hidden bg-[var(--dash-bg)] text-[var(--dash-text)] selection:bg-emerald-500/30 w-full",
        (isInvestigator || isAnalyst || isProfile || isSettings || isAdmin) && "sentinel-theme-v2"
      )}>
        {/* Background decoration */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[var(--dash-bg)]">
          {/* 💡 Ambient Atmospheric Canvas Gradients and Noise Overlay */}
          {(isInvestigator || isAnalyst || isProfile || isSettings || isAdmin) && (
            <>
              {/* Subtle noise texture to prevent flat color banding */}
              <div className="absolute inset-0 noise-bg pointer-events-none mix-blend-overlay" />
              {/* Top-right soft mint/emerald glow */}
              <div className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vh] rounded-full bg-emerald-500/[0.03] blur-[220px] mix-blend-normal pointer-events-none" />
              {/* Bottom-left soft cobalt/blue glow */}
              <div className="absolute -bottom-[20%] -left-[10%] w-[90vw] h-[90vh] rounded-full bg-blue-500/[0.03] blur-[240px] mix-blend-normal pointer-events-none" />
              {/* Center-left soft teal glow */}
              <div className="absolute top-[20%] left-[20%] w-[70vw] h-[70vh] rounded-full bg-teal-500/[0.02] blur-[180px] mix-blend-normal pointer-events-none" />
            </>
          )}
        </div>

        <AppSidebar />

        <main className="relative z-10 flex-1 h-full flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--dash-border)] bg-[var(--dash-sidebar)]/50 backdrop-blur-xl px-4 w-full">
            <SidebarTrigger className="-ml-1 text-dash-muted hover:text-dash-accent transition-colors" />
          </header>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(16, 185, 129, 0.2);
          }
        `}</style>
      </div>
    </SidebarProvider>
  );
}