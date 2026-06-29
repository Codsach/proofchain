"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
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
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="text-emerald-500/50 text-sm animate-pulse font-mono tracking-widest uppercase">Initializing System…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className={cn(
        "relative flex h-screen overflow-hidden bg-[var(--dash-bg)] text-[var(--dash-text)] selection:bg-emerald-500/30 w-full",
        (isInvestigatorDashboard || isProfilePage)
          ? "sentinel-theme-v2" 
          : (isInvestigator || isAnalyst || isProfile || isSettings || isAdmin) && "sentinel-theme"
      )}>
        {/* Background decoration */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className={cn(
            "absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,var(--dash-bg)_20%,transparent_100%)] opacity-20",
            (isInvestigator || isAnalyst || isProfile || isSettings || isAdmin) && "bg-[linear-gradient(rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:40px_40px]"
          )} />
        </div>

        <AppSidebar />

        <main className="relative z-10 flex-1 h-full flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--dash-border)] bg-[var(--dash-sidebar)]/50 backdrop-blur-xl px-4 w-full">
            <SidebarTrigger className="-ml-1 text-dash-muted hover:text-dash-accent transition-colors" />
            {(user.role === "admin" || user.role === "analyst" || user.role === "investigator") && !isInvestigator && !isAnalyst && !isProfile && !isSettings && !isAdmin && (
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            )}
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