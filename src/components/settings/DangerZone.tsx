"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deactivateAccount } from "@/app/(dashboard)/settings/actions";
import { useAuth } from "@/components/providers/AuthContext";

export function DangerZone() {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleDeactivate = async () => {
    if (!confirm("Are you absolutely sure you want to deactivate your account? This action will disable your access.")) {
      return;
    }

    setIsDeactivating(true);
    try {
      const res = await deactivateAccount();
      if (res.success) {
        toast({ title: "Account Deactivated", description: "You are being logged out." });
        setTimeout(() => logout(), 1500);
      } else {
        toast({ variant: "destructive", title: "Action Failed", description: res.error });
        setIsDeactivating(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      setIsDeactivating(false);
    }
  };

  return (
    <Card className="bg-rose-950/10 border-rose-900/50 rounded-none relative overflow-hidden">
      <div className="h-1 w-full bg-rose-600" />
      <CardHeader>
        <CardTitle className="text-xl font-mono uppercase text-rose-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-rose-400/70 font-mono text-xs uppercase">
          Irreversible actions that affect your account status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-rose-950/20 border border-rose-900/50 rounded-md gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-rose-200 font-mono uppercase">Deactivate Account</p>
            <p className="text-xs text-rose-400/70 font-mono">
              Suspends your access to the system. You will need an administrator to reactivate your account.
            </p>
          </div>
          <Button 
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="bg-rose-600 text-white hover:bg-rose-700 font-mono font-bold uppercase shrink-0"
          >
            {isDeactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeactivating ? "Processing..." : "Deactivate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
