import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/statusConfig";

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
    className: STATUS_COLORS.pending.badgeClass,
  },
  pending_review: {
    label: "Pending Review",
    className: STATUS_COLORS.pending.badgeClass,
  },
  ai_timeout: {
    label: "AI Timeout",
    className: STATUS_COLORS.pending.badgeClass,
  },
  under_review: {
    label: "Under Review",
    className: STATUS_COLORS.pending.badgeClass,
  },
  verified: {
    label: "Verified",
    className: STATUS_COLORS.verified.badgeClass,
  },
  rejected: {
    label: "Rejected",
    className: STATUS_COLORS.rejected.badgeClass,
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