"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Stats {
  total: number;
  pending: number;
  highRisk: number;
  verified: number;
}

export default function AdminPage() {
  const { user, getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/cases/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch {
        // Stats are non-critical
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [getToken]);

  const statCards = [
    { label: "Total Cases", value: stats?.total, color: "text-white", glow: "emerald" },
    { label: "Pending Review", value: stats?.pending, color: "text-amber-400", glow: "amber" },
    { label: "High Risk", value: stats?.highRisk, color: "text-rose-500", glow: "rose" },
    { label: "Verified Data", value: stats?.verified, color: "text-emerald-400", glow: "emerald" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">System Overview</p>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-white/40 mt-2 font-medium">
          Welcome back, <span className="text-white">{user?.fullName}</span>. Operational status is nominal.
        </p>
      </div>

      {/* Stats */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((card) => (
          <motion.div 
            variants={item}
            key={card.label} 
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 space-y-3 group transition-all hover:border-white/10"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest leading-none">{card.label}</p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <Skeleton className="h-10 w-16 bg-white/5" />
              ) : (
                <p className={`text-4xl font-bold tracking-tight ${card.color}`}>
                  {card.value ?? "0"}
                </p>
              )}
            </div>
            <div className={`h-1 w-8 rounded-full transition-all duration-500 group-hover:w-full ${
              card.glow === "emerald" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
              card.glow === "amber" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
              "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            }`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          { label: "Identity & Access", desc: "Manage system analysts and investigator accounts", href: "/admin/users" },
          { label: "Operational Audit", desc: "Cryptographically signed history of all system events", href: "/admin/audit" },
          { label: "Global Repository", desc: "Universal access to all evidence cases and metadata", href: "/admin/cases" },
        ].map((link, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
            key={link.href}
            className="group relative rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-1 transition-all duration-300 hover:border-emerald-500/20 shadow-2xl"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{link.label}</p>
                <p className="text-xs text-white/40 leading-relaxed font-medium">{link.desc}</p>
              </div>
              
              <Button asChild variant="ghost" className="w-full justify-between h-10 px-4 bg-white/5 border border-white/5 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-white transition-all rounded-xl group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Link href={link.href}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Access Module</span>
                  <span className="text-lg opacity-50 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}