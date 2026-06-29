"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LogEntry {
  _id: string;
  timestamp: string;
  actorId: { email: string; fullName: string; role: string } | null;
  actorRole: string;
  actionType: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
}

const ACTION_TYPES = [
  "user.register", "user.login", "user.logout", "user.deactivate", "user.delete",
  "case.create", "case.view", "case.archive",
  "file.upload", "file.ipfs_pin", "file.hash_anchor",
  "ai.started", "ai.complete", "ai.timeout",
  "transfer.initiate", "transfer.complete", "transfer.chain_anchor",
  "verdict.issue", "verify.public_check", "admin.create_analyst",
];

const ACTION_COLORS: Record<string, string> = {
  "verdict.issue": "text-dash-accent group-hover:text-emerald-300",
  "file.hash_anchor": "text-cyan-400 group-hover:text-cyan-300",
  "transfer.chain_anchor": "text-blue-400 group-hover:text-blue-300",
  "user.deactivate": "text-rose-400 group-hover:text-rose-300",
  "user.delete": "text-rose-500 group-hover:text-rose-400",
  "ai.timeout": "text-amber-400 group-hover:text-amber-300",
  "verify.public_check": "text-purple-400 group-hover:text-purple-300",
};

export default function AdminAuditPage() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("50");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", limit);
      if (actionFilter !== "all") params.set("actionType", actionFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(`/api/admin/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotalPages(data.pagination?.pages ?? 1);
      setTotalRecords(data.pagination?.total ?? 0);
    } catch {
      // Non-fatal
    } finally {
      setIsLoading(false);
    }
  }, [getToken, page, limit, actionFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Security Audit</p>
        </div>
        <h1 className="text-4xl font-bold text-dash-text tracking-tight">System Events</h1>
        <p className="text-dash-muted mt-2 font-medium">
          Real-time append-only ledger of all platform operations and cryptographic events.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-dash-card border border-dash-border p-4 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Event Category</p>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all text-dash-muted h-10 rounded-xl">
              <SelectValue placeholder="All instances" />
            </SelectTrigger>
            <SelectContent className="bg-dash-bg border-dash-border text-dash-text">
              <SelectItem value="all">All operations</SelectItem>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-[140px]">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Origin Date</p>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all text-dash-muted h-10 rounded-xl px-4"
          />
        </div>

        <div className="space-y-1.5 min-w-[140px]">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Terminal Date</p>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all text-dash-muted h-10 rounded-xl px-4"
          />
        </div>

        <div className="pt-5 overflow-hidden">
          <AnimatePresence>
            {(actionFilter !== "all" || fromDate || toDate) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActionFilter("all"); setFromDate(""); setToDate(""); setPage(1); }}
                  className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map((n) => <Skeleton key={n} className="h-14 w-full rounded-2xl bg-dash-hover" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-3xl border border-dash-border bg-dash-card backdrop-blur-2xl p-20 text-center shadow-2xl">
          <div className="w-12 h-12 bg-dash-border rounded-full flex items-center justify-center mx-auto mb-4 border border-dash-border">
            <span className="text-dash-muted">?</span>
          </div>
          <p className="text-dash-muted text-sm font-medium">No system events detected mapping current filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dash-border bg-dash-card">
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Temporal Index</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Action Protocol</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden sm:table-cell">Identity Actor</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">Target Object</th>
                  <th className="text-left px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden lg:table-cell">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border font-medium">
                <AnimatePresence>
                  {logs.map((log, idx) => (
                    <motion.tr 
                      key={log._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-emerald-500/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5 text-dash-muted font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-mono px-2 py-1 rounded bg-dash-hover border border-dash-border/60 transition-colors ${ACTION_COLORS[log.actionType] ?? "text-dash-text group-hover:text-dash-accent"}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-5 hidden sm:table-cell text-dash-muted group-hover:text-dash-text transition-colors">
                        {log.actorId?.email ?? <span className="text-dash-muted italic">{log.actorRole}</span>}
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell font-mono text-dash-muted">
                        <span className="opacity-40">{log.targetType}</span>
                        <span className="mx-1 text-dash-muted">/</span>
                        <span className="group-hover:text-dash-muted transition-colors">{log.targetId.slice(0, 12)}…</span>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell text-dash-muted font-mono group-hover:text-dash-accent/40 transition-colors">
                        {log.ipAddress}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {(totalPages > 1 || logs.length > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-2 gap-4">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Items per page</p>
            <Select value={limit} onValueChange={(v) => { setLimit(v); setPage(1); }}>
              <SelectTrigger className="w-20 bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all text-dash-muted h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dash-bg border-dash-border text-dash-text text-xs">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
              className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text hover:bg-dash-hover transition-all outline-none hidden sm:flex"
            >
              First
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="text-[10px] font-bold uppercase tracking-widest text-dash-accent hover:text-dash-accent hover:bg-emerald-500/5 transition-all outline-none"
            >
              ← Prev
            </Button>
            <div className="flex items-center gap-2 sm:gap-4 px-2">
              <div className="h-px w-4 sm:w-8 bg-dash-border" />
              <span className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.2em] text-center">
                Sector <span className="text-dash-text">{page}</span> of {totalPages}
                <br className="sm:hidden" />
                <span className="sm:ml-2 text-dash-accent/40">({totalRecords} logs)</span>
              </span>
              <div className="h-px w-4 sm:w-8 bg-dash-border" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="text-[10px] font-bold uppercase tracking-widest text-dash-accent hover:text-dash-accent hover:bg-emerald-500/5 transition-all outline-none"
            >
              Next →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || isLoading}
              className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text hover:bg-dash-hover transition-all outline-none hidden sm:flex"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
