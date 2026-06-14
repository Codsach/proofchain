import {
  FileBadge2,
  Fingerprint,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  ShieldHalf,
  Settings2,
  Layers,
  Scale
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function SidebarNav() {
  return (
    <aside className="w-full shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-xl lg:h-screen lg:w-72 lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col px-4 py-5 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-[#0A1A10] overflow-hidden shrink-0">
            <Image src="/icon-v2.png" alt="ProofChain Icon" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">
              Chain of Custody
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="text-white">Proof</span>
              <span className="text-[#07A572]">Chain</span>
            </h1>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
            <Settings2 size={14} />
            Control Room
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Static workspace shell for investigators, analysts, and admins.
          </p>
        </div>

        <nav className="mt-6 space-y-6">
          <div>
            <p className="flex items-center gap-2 mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
              <Layers size={14} />
              Workspace
            </p>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 text-emerald-50 hover:bg-emerald-500/15 hover:text-white"
              >
                <LayoutDashboard className="size-4 text-emerald-200" />
                Overview
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl px-3 text-zinc-300 hover:bg-white/6 hover:text-white"
              >
                <FileBadge2 className="size-4 text-zinc-400" />
                Case Intake
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl px-3 text-zinc-300 hover:bg-white/6 hover:text-white"
              >
                <Sparkles className="size-4 text-zinc-400" />
                AI Analysis
              </Button>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
              <Scale size={14} />
              Governance
            </p>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl px-3 text-zinc-300 hover:bg-white/6 hover:text-white"
              >
                <ShieldCheck className="size-4 text-zinc-400" />
                Verification
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl px-3 text-zinc-300 hover:bg-white/6 hover:text-white"
              >
                <Users className="size-4 text-zinc-400" />
                User Control
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start rounded-2xl px-3 text-zinc-300 hover:bg-white/6 hover:text-white"
              >
                <ScrollText className="size-4 text-zinc-400" />
                Audit Trail
              </Button>
            </div>
          </div>
        </nav>

        <div className="mt-6 hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/7 to-transparent p-4 lg:block">
          <div className="flex items-center gap-2 text-zinc-200">
            <Fingerprint className="size-4 text-emerald-200" />
            <span className="text-sm font-medium">Integrity Snapshot</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Evidence hashes, verdict anchors, and audit actions will live in
            this left rail once the data layer is wired.
          </p>
        </div>
      </div>
    </aside>
  );
}
