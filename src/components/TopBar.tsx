import { Bell, Clock3, Search, ShieldEllipsis } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="border-b border-white/10 bg-zinc-950/60 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Evidence Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Investigation Workspace
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-400 sm:min-w-72">
            <Search className="size-4 shrink-0 text-zinc-500" />
            <span className="truncate">
              Search cases, file hashes, verdict anchors...
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-zinc-200 hover:bg-white/10 hover:text-white dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Clock3 className="size-4 text-emerald-200" />
            Review Queue
          </Button>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="hidden rounded-2xl bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200 sm:block">
              Secure
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-2xl text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Bell className="size-4" />
            </Button>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                AD
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  Admin Desk
                </p>
                <p className="truncate text-xs text-zinc-500">
                  Static top bar placeholder
                </p>
              </div>
              <ShieldEllipsis className="size-4 shrink-0 text-emerald-200" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
