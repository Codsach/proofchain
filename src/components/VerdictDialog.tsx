"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (verdict: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

export function VerdictDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const [selected, setSelected] = useState<"verified" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!selected) {
      setError("Please select a verdict.");
      return;
    }
    if (reason.trim().length < 20) {
      setError("Reason must be at least 20 characters.");
      return;
    }
    await onSubmit(selected, reason.trim());
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelected(null);
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Issue Verdict</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Verdict selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Verdict</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected("verified")}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  selected === "verified"
                    ? "border-green-600 bg-green-950/40 text-green-300"
                    : "border-border text-muted-foreground hover:border-green-800 hover:text-green-400"
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setSelected("rejected")}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  selected === "rejected"
                    ? "border-red-600 bg-red-950/40 text-red-300"
                    : "border-border text-muted-foreground hover:border-red-800 hover:text-red-400"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Reason</Label>
              <span
                className={`text-xs ${
                  reason.length < 20 ? "text-muted-foreground" : "text-teal-400"
                }`}
              >
                {reason.length} / min 20
              </span>
            </div>
            <Textarea
              placeholder="Describe the basis for this verdict. This reason will be hashed and recorded on the blockchain."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-28 resize-none"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="rounded-md bg-amber-950/30 border border-amber-900/40 px-3 py-2">
            <p className="text-xs text-amber-300">
              This verdict is permanent. Once issued, it cannot be changed. A hash of
              this verdict will be recorded on the Polygon blockchain.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selected || reason.length < 20}
            className="bg-teal-500 hover:bg-teal-600 text-black font-semibold"
          >
            {isLoading ? "Submitting…" : "Confirm Verdict"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}