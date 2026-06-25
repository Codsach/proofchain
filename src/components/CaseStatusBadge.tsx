import { Badge } from "@/components/ui/badge";

type CaseStatus =
  | "pending_ai_review"
  | "pending_review"
  | "ai_timeout"
  | "under_review"
  | "verified"
  | "rejected"
  | "archived";

const config: Record<
  CaseStatus,
  { label: string; className: string }
> = {
  pending_ai_review: {
    label: "AI Scanning",
    className: "bg-blue-900/40 text-blue-300 border-blue-800",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-900/40 text-amber-300 border-amber-800",
  },
  ai_timeout: {
    label: "AI Timeout",
    className: "bg-red-900/40 text-red-300 border-red-800",
  },
  under_review: {
    label: "Under Review",
    className: "bg-cyan-900/40 text-cyan-300 border-cyan-800",
  },
  verified: {
    label: "Verified",
    className: "bg-green-900/40 text-green-300 border-green-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-900/40 text-red-300 border-red-800",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface Props {
  status: CaseStatus | string;
}

export function CaseStatusBadge({ status }: Props) {
  const cfg = config[status as CaseStatus] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 flex items-center gap-1.5 ${cfg.className}`}
    >
      {status === "pending_ai_review" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
        </span>
      )}
      {cfg.label}
    </Badge>
  );
}