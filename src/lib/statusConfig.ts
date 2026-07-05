export type CaseStatusGroup = "verified" | "rejected" | "pending";

export const STATUS_BUCKETS = {
  verified: ["verified", "resolved"],
  rejected: ["rejected"],
  pending: ["pending_ai_review", "pending_review", "under_review", "ai_timeout"],
};

export const STATUS_COLORS = {
  verified: {
    hex: "#3B82F6", // Blue
    var: "var(--dash-info)",
    label: "Verified",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    cardVariant: "blue" as const,
  },
  rejected: {
    hex: "#EF4444", // Red
    var: "var(--dash-danger)",
    label: "Rejected",
    badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    cardVariant: "red" as const,
  },
  pending: {
    hex: "#10B981", // Green
    var: "var(--dash-accent)",
    label: "Pending Review",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    cardVariant: "green" as const,
  },
};

export function getStatusGroup(status: string): CaseStatusGroup {
  if (STATUS_BUCKETS.verified.includes(status)) return "verified";
  if (STATUS_BUCKETS.rejected.includes(status)) return "rejected";
  return "pending";
}
