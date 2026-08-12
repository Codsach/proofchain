"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Database
} from "lucide-react";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface CaseDetail {
  caseId: string;
  title: string;
  description: string;
  incidentDate: string;
  incidentType: string;
  status: string;
  files: Array<{
    fileId: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    sha256Hash: string;
    ipfsCid: string;
    gpsLat: number | null;
    gpsLng: number | null;
  }>;
  createdAt: string;
  investigatorId: UserProfile | null;
  currentCustodian: UserProfile;
  onChainTxHash: string | null;
}

interface Verdict {
  _id: string;
  verdict: "verified" | "rejected";
  reason: string;
  analystId: string;
  issuedAt: string;
  onChainTxHash: string | null;
}

interface TransferEntry {
  _id: string;
  fromUserId: UserProfile;
  toUserId: UserProfile;
  reason: string;
  transferredAt: string;
  onChainTxHash: string | null;
}

export function CustodyInspector() {
  const { user, getToken } = useAuth();
  const { toast } = useToast();

  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch all authorized cases
  useEffect(() => {
    async function loadCases() {
      try {
        const token = await getToken();
        const res = await fetch("/api/cases?limit=all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load cases");
        const data = await res.json();
        setCases(data.cases ?? []);
      } catch {
        toast({
          title: "Registry Error",
          description: "Could not load cases registry list.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCases(false);
      }
    }
    if (user) {
      loadCases();
    }
  }, [user, getToken, toast]);

  // Role-based case filtering
  const filteredCases = useMemo(() => {
    if (!user) return [];
    return cases.filter((c) => {
      if (user.role === "admin") return true;
      if (user.role === "investigator") return true;
      if (user.role === "analyst") {
        const custodianId = typeof c.currentCustodian === "object" && c.currentCustodian
          ? c.currentCustodian._id
          : String(c.currentCustodian);
        return custodianId === user.id;
      }
      return false;
    });
  }, [cases, user]);

  // Search case selection options
  const searchOptions = useMemo(() => {
    if (!searchQuery.trim()) return filteredCases;
    const query = searchQuery.toLowerCase();
    return filteredCases.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.caseId.toLowerCase().includes(query)
    );
  }, [filteredCases, searchQuery]);

  // Fetch single case details, transfers and verdicts
  useEffect(() => {
    if (!selectedCaseId) {
      Promise.resolve().then(() => {
        setCaseData(null);
        setTransfers([]);
        setVerdict(null);
      });
      return;
    }

    async function loadDetails() {
      setIsLoadingDetails(true);
      try {
        const token = await getToken();

        // 1. Fetch case details
        const caseRes = await fetch(`/api/cases/${selectedCaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!caseRes.ok) throw new Error("Case load failed");
        const detailedCase = await caseRes.json();
        setCaseData(detailedCase);

        // 2. Fetch transfers
        const transRes = await fetch(`/api/cases/${selectedCaseId}/transfer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          setTransfers(transData.transfers ?? []);
        }

        // 3. Fetch verdict
        const verdRes = await fetch(`/api/cases/${selectedCaseId}/verdict`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (verdRes.ok) {
          const verdData = await verdRes.json();
          setVerdict(verdData);
        }
      } catch {
        toast({
          title: "Details Retrieval Failure",
          description: "Could not fetch custody parameters for the selected subject.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadDetails();
  }, [selectedCaseId, getToken, toast]);

  // Construct timeline nodes
  const timelineNodes = useMemo<TimelineNode[]>(() => {
    if (!caseData) return [];

    const nodes: TimelineNode[] = [];

    // 1. Initial Upload event
    nodes.push({
      id: "upload-" + caseData.caseId,
      type: "upload",
      title: "Evidence Uploaded & Sealed",
      subtitle: caseData.files.map((f) => f.originalName).join(", "),
      description: "Evidence files originally registered and anchored to blockchain.",
      timestamp: caseData.createdAt,
      txHash: caseData.onChainTxHash,
      actorName: caseData.investigatorId?.fullName || "Investigator",
      actorRole: "investigator",
      isActive: transfers.length === 0 && !verdict,
    });

    // 2. Transfer events
    transfers.forEach((t, index) => {
      const isLastTransfer = index === transfers.length - 1;
      nodes.push({
        id: t._id,
        type: "transfer",
        title: "Custody Hand-off",
        subtitle: `${t.fromUserId?.fullName || "Custodian"} ➔ ${t.toUserId?.fullName || "Custodian"}`,
        description: t.reason,
        timestamp: t.transferredAt,
        txHash: t.onChainTxHash,
        actorName: t.fromUserId?.fullName,
        actorRole: t.fromUserId?.role,
        recipientName: t.toUserId?.fullName,
        recipientRole: t.toUserId?.role,
        isActive: isLastTransfer && !verdict,
      });
    });

    // 3. Verdict event
    if (verdict) {
      nodes.push({
        id: verdict._id,
        type: "verdict",
        title: `Forensic Verdict: ${verdict.verdict.toUpperCase()}`,
        subtitle: `Analyzed and sealed by Verification Protocol`,
        description: verdict.reason,
        timestamp: verdict.issuedAt,
        txHash: verdict.onChainTxHash,
        verdictType: verdict.verdict,
        isActive: true,
      });
    }

    return nodes;
  }, [caseData, transfers, verdict]);

  const selectedCaseName = useMemo(() => {
    const match = cases.find((c) => c.caseId === selectedCaseId);
    return match ? `${match.title} (${match.caseId.slice(0, 8)})` : "Select a Case subject...";
  }, [cases, selectedCaseId]);

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* Search Selection Header Card */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-sm relative z-50">
        <h2 className="text-xs font-bold text-dash-muted uppercase tracking-[0.2em] mb-3">
          Select Subject Dossier
        </h2>
        
        {/* Custom Combobox Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpenDropdown((prev) => !prev)}
            className="w-full flex items-center justify-between bg-dash-input border border-dash-border hover:border-emerald-500/35 px-4 h-12 rounded-xl text-sm text-dash-text text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-dash-muted" />
              <span className={selectedCaseId ? "font-semibold text-dash-text" : "text-dash-muted"}>
                {selectedCaseName}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-dash-muted transition-transform duration-300 ${isOpenDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isOpenDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-dash-card border border-dash-border rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {/* Search query input */}
                <div className="flex items-center border-b border-dash-border p-3 bg-dash-bg">
                  <Search className="w-4 h-4 text-dash-muted shrink-0 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Search by case title or unique ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 text-sm text-dash-text focus:outline-none placeholder:text-dash-muted/70"
                    autoFocus
                  />
                </div>

                <div className="max-h-[260px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {isLoadingCases ? (
                    <div className="p-4 text-center text-xs text-dash-muted animate-pulse">
                      Syncing database subjects...
                    </div>
                  ) : searchOptions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-dash-muted">
                      No matching case archives found.
                    </div>
                  ) : (
                    searchOptions.map((c) => (
                      <button
                        key={c.caseId}
                        type="button"
                        onClick={() => {
                          setSelectedCaseId(c.caseId);
                          setIsOpenDropdown(false);
                          setSearchQuery("");
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-3 hover:bg-dash-hover ${
                          selectedCaseId === c.caseId ? "bg-[var(--dash-active-bg)] text-[var(--dash-active-text)]" : "text-dash-text"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{c.title}</p>
                          <p className="text-[10px] text-dash-muted font-mono mt-0.5 truncate uppercase">
                            UID::{c.caseId}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-55" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Details Inspector Panel */}
      {isLoadingDetails ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl bg-dash-hover" />
        </div>
      ) : caseData ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Chronological Custody Chain Timeline (Full Width) */}
          <CustodyTimeline nodes={timelineNodes} className="w-full shadow-md" />
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dash-border bg-dash-card p-16 text-center shadow-xs">
          <Database className="mx-auto mb-4 text-dash-muted/40" size={32} />
          <p className="text-sm font-medium text-dash-muted">
            Please choose a subject file from the selector above to audit its custody timeline.
          </p>
        </div>
      )}
    </div>
  );
}
