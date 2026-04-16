interface Props {
  score: number | null | undefined;
  showLabel?: boolean;
}

export function TamperScoreBadge({ score, showLabel = true }: Props) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
        {showLabel && "Pending"}
      </span>
    );
  }

  const isLow = score <= 30;
  const isMed = score > 30 && score <= 60;

  const colorClass = isLow
    ? "bg-green-900/40 text-green-300 border-green-800"
    : isMed
    ? "bg-amber-900/40 text-amber-300 border-amber-800"
    : "bg-red-900/40 text-red-300 border-red-800";

  const dotClass = isLow
    ? "bg-green-400"
    : isMed
    ? "bg-amber-400"
    : "bg-red-400";

  const riskLabel = isLow ? "Low" : isMed ? "Medium" : "High";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {score}
      {showLabel && <span className="opacity-70">/ 100 · {riskLabel} Risk</span>}
    </span>
  );
}