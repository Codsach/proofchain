"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/AuthContext";

export function MfaSetupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getToken, reloadUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOpen = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const res = await fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (err: unknown) {
        toast({ 
          title: "Failed to load MFA setup", 
          description: err instanceof Error ? err.message : "Unknown error", 
          variant: "destructive" 
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      handleOpen();
    } else {
      setQrCodeUrl(null);
      setSecret(null);
      setCode("");
    }
  }, [isOpen, getToken, onClose, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !secret) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/mfa/verify-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code, secret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: "MFA Enabled", description: "Two-Factor Authentication is now active on your account." });
      if (reloadUser) {
        await reloadUser();
      }
      onClose();
    } catch (err: unknown) {
      toast({ 
        title: "Verification Failed", 
        description: err instanceof Error ? err.message : "Invalid code", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0A1A10] border-emerald-900/50 text-emerald-50">
        <DialogHeader>
          <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Scan the QR code with your authenticator app (e.g. Google Authenticator) and enter the code below to verify.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {isLoading && !qrCodeUrl ? (
            <div className="animate-pulse w-48 h-48 bg-emerald-900/20 rounded-xl" />
          ) : qrCodeUrl ? (
            <>
              <div className="bg-white p-4 rounded-xl">
                <Image src={qrCodeUrl} alt="MFA QR Code" width={192} height={192} />
              </div>
              <p className="text-xs text-zinc-500 font-mono text-center">Secret: {secret}</p>
            </>
          ) : null}
          
          <form onSubmit={handleVerify} className="w-full space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em] font-mono text-lg bg-black/40 border-emerald-900/50 text-white"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || code.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
