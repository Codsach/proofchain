"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Shield, ShieldCheck, Laptop, Smartphone, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { changePassword, revokeDevice } from "@/app/(dashboard)/settings/actions";
import { MfaSetupModal } from "@/components/MfaSetupModal";

const passwordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface Device {
  deviceTokenHash: string;
  expiresAt: string;
}

export function SecuritySettings({ user }: { user: { mfaEnabled: boolean; trustedDevices: Device[] } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMfaOpen, setIsMfaOpen] = useState(false);
  const [devices, setDevices] = useState(user.trustedDevices);
  const { toast } = useToast();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await changePassword(data);
      if (res.success) {
        toast({ title: "Password Updated", description: "Your credentials have been changed." });
        form.reset();
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeDevice = async (deviceTokenHash: string) => {
    try {
      const res = await revokeDevice(deviceTokenHash);
      if (res.success) {
        setDevices(devices.filter(d => d.deviceTokenHash !== deviceTokenHash));
        toast({ title: "Device Revoked", description: "The session has been terminated." });
      } else {
        toast({ variant: "destructive", title: "Action Failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to revoke device." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Reset */}
      <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-none relative overflow-hidden">
        <div className="absolute top-0 left-0 h-[2px] w-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <CardHeader>
          <CardTitle className="text-xl font-mono uppercase text-[var(--dash-text)] flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-600" />
            Authentication Key
          </CardTitle>
          <CardDescription className="text-[var(--dash-muted)] font-mono text-xs uppercase">
            Update your primary access credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--dash-muted)] font-mono text-xs uppercase">Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="bg-[var(--dash-bg)] border-[var(--dash-border)] text-white font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--dash-muted)] font-mono text-xs uppercase">New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-[var(--dash-bg)] border-[var(--dash-border)] text-white font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--dash-muted)] font-mono text-xs uppercase">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-[var(--dash-bg)] border-[var(--dash-border)] text-white font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-[var(--dash-border)]">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isDirty}
                  className="bg-[var(--dash-bg)] text-cyan-500 border border-cyan-500 hover:bg-cyan-900/20 font-mono font-bold uppercase shadow-[0_0_10px_rgba(8,145,178,0.1)]"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? "Encrypting..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-none relative overflow-hidden">
        <div className="absolute top-0 left-0 h-[2px] w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-mono uppercase text-[var(--dash-text)] flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-[var(--dash-muted)] font-mono text-xs uppercase">
              Add an extra layer of security to your account.
            </CardDescription>
          </div>
          {user.mfaEnabled ? (
            <Badge variant="outline" className="rounded-sm font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <ShieldCheck size={12} className="mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-sm font-mono uppercase tracking-wider bg-rose-500/10 text-rose-500 border-rose-500/20">
              Inactive
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-[var(--dash-bg)] border border-[var(--dash-border)] rounded-md">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white font-mono uppercase">Authenticator App</p>
              <p className="text-xs text-[var(--dash-muted)] font-mono">Use an app like Google Authenticator or Authy to generate security codes.</p>
            </div>
            {!user.mfaEnabled && (
              <Button 
                onClick={() => setIsMfaOpen(true)}
                className="bg-emerald-500 text-black hover:bg-emerald-400 font-mono font-bold uppercase"
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card className="bg-[var(--dash-card)] border-[var(--dash-border)] rounded-none relative overflow-hidden">
        <div className="absolute top-0 left-0 h-[2px] w-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        <CardHeader>
          <CardTitle className="text-xl font-mono uppercase text-[var(--dash-text)] flex items-center gap-2">
            <Laptop className="h-5 w-5 text-purple-500" />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-[var(--dash-muted)] font-mono text-xs uppercase">
            Manage your currently logged in devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="p-4 text-center text-[var(--dash-muted)] font-mono text-xs uppercase bg-[var(--dash-bg)] border border-[var(--dash-border)]">
              No active sessions found.
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[var(--dash-bg)] border border-[var(--dash-border)] rounded-md">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/10 rounded-md">
                      <Smartphone className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white font-mono uppercase">Session Token</p>
                      <p className="text-xs text-[var(--dash-muted)] font-mono">Expires: {new Date(device.expiresAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeDevice(device.deviceTokenHash)}
                    className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-mono uppercase text-xs"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MfaSetupModal isOpen={isMfaOpen} onClose={() => {
        setIsMfaOpen(false);
        // We'd ideally refresh the user context here, but since Next.js Router is available
        // we can just force a reload or rely on optimistic UI if we wanted.
        window.location.reload();
      }} />
    </div>
  );
}
