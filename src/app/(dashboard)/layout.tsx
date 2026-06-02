"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Menu, LogOut } from "lucide-react";

const navItems = {
  investigator: [
    { label: "My Cases", href: "/investigator", icon: "M" },
    { label: "Submit Evidence", href: "/investigator/submit", icon: "S" },
  ],
  analyst: [
    { label: "Case Queue", href: "/analyst", icon: "C" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "D" },
    { label: "Users", href: "/admin/users", icon: "U" },
    { label: "Audit Log", href: "/admin/audit", icon: "A" },
  ],
};

const roleLabel: Record<string, string> = {
  investigator: "Investigator",
  analyst: "Forensic Analyst",
  admin: "Administrator",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Auto-collapse sidebar on mobile/tablet when navigating
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="text-emerald-500/50 text-sm animate-pulse font-mono tracking-widest uppercase">Initializing System…</div>
      </div>
    );
  }

  if (!user) return null;

  const items = navItems[user.role as keyof typeof navItems] ?? [];

  return (
    <div className="relative flex h-screen overflow-hidden bg-dash-bg text-dash-text selection:bg-dash-accent/30">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-dash-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,var(--dash-bg)_20%,transparent_100%)] opacity-20" />
      </div>

      {/* Floating Toggle Button (visible when collapsed) */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCollapsed(false)}
            className="fixed top-6 left-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-dash-border bg-dash-sidebar text-dash-muted hover:text-dash-text hover:bg-dash-hover hover:border-dash-accent transition-colors shadow-xl"
            title="Expand Sidebar"
          >
            <Menu size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? 0 : 256, opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-10 flex-shrink-0 border-dash-border flex flex-col bg-dash-sidebar backdrop-blur-2xl overflow-hidden"
        style={{ borderRightWidth: isCollapsed ? 0 : 1 }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute right-4 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-dash-border bg-dash-card text-dash-muted hover:text-dash-accent hover:border-dash-accent transition-colors shadow-md"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Brand */}
        <div className="py-8 border-b border-dash-border flex flex-col px-6 min-w-[256px]">
          <Link href="/" className="group flex items-center gap-3 mb-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <img src="/logo.png" alt="ProofChain Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <p className="text-lg font-bold text-dash-text tracking-tight transition-colors group-hover:text-dash-accent whitespace-nowrap">ProofChain</p>
            )}
          </Link>
          {!isCollapsed && (
            <div className="flex items-center gap-2 pl-6">
              <div className="h-0.5 w-3 bg-dash-border" />
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.2em] whitespace-nowrap">
                {roleLabel[user.role]}
              </p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 focus:outline-none overflow-x-hidden min-w-[256px]">
          {items.map((item) => {
            const isActive =
              item.href === "/investigator" || item.href === "/admin" || item.href === "/analyst"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block outline-none"
              >
                <div
                  className={`relative flex items-center rounded-xl text-sm transition-all duration-300 group outline-none px-4 py-2.5 ${
                    isActive
                      ? "bg-dash-hover text-dash-accent border border-dash-border shadow-[0_0_20px_var(--dash-accent-glow)]"
                      : "text-dash-muted hover:text-dash-text hover:bg-dash-hover border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-5 bg-dash-accent rounded-r-full"
                    />
                  )}
                  <span className={isActive ? "pl-2 font-semibold whitespace-nowrap" : "pl-2 group-hover:pl-3 transition-all font-medium whitespace-nowrap"}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="py-6 border-t border-dash-border space-y-4 px-6 min-w-[256px]">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Logged in as</p>
            <p className="text-xs text-dash-text/80 truncate font-medium" title={user.email}>
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-dash-muted hover:text-dash-accent hover:bg-dash-accent/5 transition-colors group w-full px-0 h-auto"
            onClick={logout}
          >
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:pl-1 transition-all whitespace-nowrap">Terminate Session →</span>
          </Button>
        </div>
      </motion.aside>

      {/* Main content area */}
      <main className="relative z-10 flex-1 h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
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
  );
}