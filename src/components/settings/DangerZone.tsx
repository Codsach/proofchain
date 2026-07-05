"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { deactivateAccount } from "@/app/(dashboard)/settings/actions";
import { useAuth } from "@/components/providers/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function DangerZone() {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleDeactivate = async () => {
    if (confirmText !== "DEACTIVATE") return;

    setIsDeactivating(true);
    try {
      const res = await deactivateAccount();
      if (res.success) {
        toast({ title: "Account deactivated", description: "You are being logged out." });
        setIsDialogOpen(false);
        setTimeout(() => logout(), 1500);
      } else {
        toast({ variant: "destructive", title: "Action failed", description: res.error });
        setIsDeactivating(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className="absolute top-0 left-0 h-[2px] w-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg font-heading font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Irreversible actions that affect your account status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CardContainer className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-rose-500/10 bg-rose-500/[0.01] rounded-xl gap-4 max-w-2xl w-full">
            <CardContainer className="space-y-1 pr-4">
              <p className="text-sm font-medium text-rose-800">Deactivate Account</p>
              <p className="text-xs text-rose-700/70 leading-relaxed">
                Suspends your access to the system. Requires verification and can be reversed only by another administrator.
              </p>
            </CardContainer>
            <Button 
              onClick={() => {
                setConfirmText("");
                setIsDialogOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium rounded-xl h-14 px-6 transition-all duration-300 shrink-0 normal-case"
            >
              Deactivate
            </Button>
          </CardContainer>
        </CardContent>
      </Card>

      {/* Confirmation Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dash-modal border border-dash-border text-dash-text max-w-md rounded-2xl p-[28px] gap-6 font-sans" showCloseButton={false}>
          <DialogHeader className="gap-2">
            <DialogTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Confirm Deactivation
            </DialogTitle>
            <DialogDescription className="text-sm text-dash-muted leading-relaxed">
              This action will immediately disable your credentials. Only another system administrator can reactivate your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-dash-text tracking-tight">
              Type <span className="font-bold text-rose-600">DEACTIVATE</span> below to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DEACTIVATE"
              className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 px-4 font-mono w-full focus-visible:ring-rose-500 focus-visible:border-rose-500 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-0 mt-4 bg-transparent border-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border border-dash-border bg-transparent text-dash-text hover:bg-dash-hover font-semibold rounded-xl h-14 px-6 transition-all normal-case"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirmText !== "DEACTIVATE" || isDeactivating}
              onClick={handleDeactivate}
              className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold rounded-xl h-14 px-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed normal-case"
            >
              {isDeactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
