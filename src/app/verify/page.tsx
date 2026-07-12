"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyLookupPage() {
  const [caseId, setCaseId] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseId.trim()) {
      router.push(`/verify/${encodeURIComponent(caseId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background grids */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <Image src="/logo.png" alt="ProofChain Icon" width={24} height={24} className="object-contain rounded-md" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Proof</span>
            <span className="text-emerald-500 group-hover:text-emerald-400 transition-colors">Chain</span>
          </span>
        </Link>
        <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-emerald-400 transition-colors">
          Console Login
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 flex flex-col justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 text-center"
        >
          {/* Badge Icon */}
          <div className="mx-auto size-14 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <ShieldCheck size={28} className="text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Public verification
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Enter the Case ID or upload a cryptographic verification signal to check blockchain integrity and retrieve the secure Chain of Custody timeline.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="Case ID (e.g. CASE-12345)"
                required
                className="w-full h-12 pl-11 pr-4 bg-zinc-900/50 border border-white/10 rounded-xl text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-950 transition-all text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!caseId.trim()}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Audit On-Chain Record</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center border-t border-white/5">
        <p className="text-[10px] text-zinc-600 tracking-wider">
          PROOFCHAIN INCIDENT PROTOCOL · POWERED BY POLYGON AMOY
        </p>
      </footer>
    </div>
  );
}
