"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface VerifyResult {
  hashMatch: boolean;
  onChainHash: string;
  onChainTimestamp: string;
  ipfsCid: string;
}

interface Props {
  caseId: string;
}

export function VerifyHashButton({ caseId }: Props) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const verify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verify/${caseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
      setShowDetails(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={verify}
        disabled={isLoading}
        className="border-teal-800 text-teal-400 hover:bg-teal-950/30"
      >
        {isLoading ? "Verifying…" : "Verify On-Chain Hash"}
      </Button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {showDetails && result && (
        <div
          className={`rounded-md border px-3 py-2 text-xs space-y-1 ${
            result.hashMatch
              ? "bg-green-950/30 border-green-900 text-green-300"
              : "bg-red-950/30 border-red-900 text-red-300"
          }`}
        >
          <p className="font-semibold">
            {result.hashMatch ? "✓ Hash verified — file is unmodified" : "✗ Hash mismatch — file may have been altered"}
          </p>
          <p className="text-muted-foreground font-mono break-all">
            {result.onChainHash}
          </p>
          <p className="text-muted-foreground">
            Anchored: {new Date(result.onChainTimestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}