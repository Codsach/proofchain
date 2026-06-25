"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardContainer } from "@/components/ui/card";
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
    <Card className="bg-rose-950/5 border border-rose-950/40 relative overflow-hidden rounded-2xl shadow-2xl ring-0">
      <CardContainer className="absolute top-0 left-0 h-[2px] w-full bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
      <CardHeader>
        <CardTitle className="text-xl font-heading tracking-wider uppercase text-rose-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-rose-400/60 font-mono text-xs uppercase tracking-wider">
          Irreversible actions that affect your account status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardContainer className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-rose-950/15 border border-rose-950/30 rounded-xl gap-4">
          <CardContainer className="space-y-1">
            <p className="text-sm font-medium text-rose-200 font-mono uppercase">Deactivate Account</p>
            <p className="text-xs text-rose-400/60 font-mono leading-relaxed">
              Suspends your access to the system. You will need an administrator to reactivate your account.
            </p>
          </CardContainer>
          <Button 
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="bg-rose-600 hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.4)] text-white font-mono font-bold uppercase rounded-xl h-11 px-6 transition-all duration-300 shrink-0"
          >
            {isDeactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeactivating ? "Processing..." : "Deactivate"}
          </Button>
        </CardContainer>
      </CardContent>
    </Card>
  );
}
