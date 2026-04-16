"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = {
  investigator: [
    { label: "My Cases", href: "/investigator" },
    { label: "Submit Evidence", href: "/investigator/submit" },
  ],
  analyst: [
    { label: "Case Queue", href: "/analyst" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Audit Log", href: "/admin/audit" },
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

  const items = navItems[user.role as keyof typeof navItems] ?? [];

  return (
    <div className="relative flex min-h-screen bg-[#000000] text-white selection:bg-emerald-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-20" />
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 border-r border-white/5 flex flex-col bg-white/[0.01] backdrop-blur-2xl">
        {/* Brand */}
        <div className="px-6 py-8 border-b border-white/5">
          <Link href="/" className="group flex items-center gap-3 mb-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <img src="/logo.png" alt="ProofChain Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-lg font-bold text-white tracking-tight transition-colors group-hover:text-emerald-400">ProofChain</p>
          </Link>
          <div className="flex items-center gap-2 pl-6">
            <div className="h-0.5 w-3 bg-white/10" />
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {roleLabel[user.role]}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 focus:outline-none">
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
                  className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-300 group outline-none ${
                    isActive
                      ? "bg-white/[0.03] text-emerald-400 border border-white/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                      : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full"
                    />
                  )}
                  <span className={isActive ? "pl-2 font-semibold" : "pl-2 group-hover:pl-3 transition-all font-medium"}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-6 py-6 border-t border-white/5 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Logged in as</p>
            <p className="text-xs text-white/60 truncate font-medium" title={user.email}>
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/40 hover:text-emerald-400 hover:bg-emerald-500/5 px-0 h-auto transition-colors group"
            onClick={logout}
          >
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:pl-1 transition-all">Terminate Session →</span>
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="relative z-10 flex-1 min-h-screen overflow-y-auto custom-scrollbar">
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