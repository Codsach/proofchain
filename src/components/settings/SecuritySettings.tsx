"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Shield, ShieldCheck, Laptop, Smartphone, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardContainer, CardFooter } from "@/components/ui/card";
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

export function SecuritySettings({ role, user }: { role: "investigator" | "analyst" | "admin"; user: { mfaEnabled: boolean; trustedDevices: Device[] } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMfaOpen, setIsMfaOpen] = useState(false);
  const [devices, setDevices] = useState(user.trustedDevices);
  const { toast } = useToast();

  const roleBarTheme = {
    investigator: "bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    analyst: "bg-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    admin: "bg-purple-650 shadow-[0_0_8px_rgba(168,85,247,0.4)]",
  }[role];

  const roleAccent = {
    investigator: "text-emerald-700",
    analyst: "text-cyan-700",
    admin: "text-purple-700",
  }[role];

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
        toast({ title: "Password updated", description: "Your credentials have been changed successfully." });
        form.reset({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({ variant: "destructive", title: "Update failed", description: res.error });
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
        toast({ title: "Session revoked", description: "The active session has been terminated successfully." });
      } else {
        toast({ variant: "destructive", title: "Action failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to revoke session." });
    }
  };

  return (
    <CardContainer className="space-y-8">
      {/* Password Reset */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="type-section-heading text-dash-text flex items-center gap-2">
            <KeyRound className={`h-5 w-5 ${roleAccent}`} />
            Authentication Key
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Update your primary access credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 lg:gap-6 items-start">
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-dash-text tracking-tight">Current password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 px-4 font-sans focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-dash-muted mt-1.5 leading-relaxed">
                        Verify your current credentials.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-dash-text tracking-tight">New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 px-4 font-sans focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-dash-muted mt-1.5 leading-relaxed">
                        Must be at least 8 characters.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-dash-text tracking-tight">Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 px-4 font-sans focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-dash-muted mt-1.5 leading-relaxed">
                        Must match the new password.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="w-full md:col-span-2 lg:col-span-1 flex flex-col items-end lg:items-start space-y-2">
                  <div className="hidden md:block text-[13px] font-medium text-transparent tracking-tight select-none">Spacer</div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.formState.isDirty}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl h-14 px-8 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed normal-case"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isSubmitting ? "Encrypting..." : "Update password"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 flex flex-row items-center justify-between flex-wrap gap-4">
          <CardContainer className="space-y-1.5">
            <CardTitle className="type-section-heading text-dash-text flex items-center gap-2">
              <Shield className={`h-5 w-5 ${roleAccent}`} />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-sm text-dash-muted">
              Add an extra layer of security to your account.
            </CardDescription>
          </CardContainer>
          {user.mfaEnabled ? (
            <Badge variant="outline" className="rounded-md font-sans font-medium bg-emerald-500/10 text-emerald-800 border-emerald-500/20 px-2.5 py-1 text-xs">
              <ShieldCheck size={12} className="mr-1 inline" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-md font-sans font-medium bg-rose-500/10 text-rose-800 border-rose-500/20 px-2.5 py-1 text-xs">
              Inactive
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <CardContainer className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-dash-border bg-dash-input/30 rounded-xl gap-4 w-full">
            <CardContainer className="space-y-1 pr-4">
              <p className="text-sm font-medium text-dash-text">Authenticator App</p>
              <p className="text-xs text-dash-muted leading-relaxed">Use an app like Google Authenticator or Authy to generate security codes.</p>
            </CardContainer>
            {!user.mfaEnabled && (
              <Button 
                onClick={() => setIsMfaOpen(true)}
                className="border border-dash-border bg-transparent text-dash-text hover:bg-dash-hover font-semibold rounded-xl h-14 px-6 transition-all shrink-0 normal-case"
              >
                Enable 2FA
              </Button>
            )}
          </CardContainer>
        </CardContent>
      </Card>

      {/* Trusted Devices / Active Sessions */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="type-section-heading text-dash-text flex items-center gap-2">
            <Laptop className={`h-5 w-5 ${roleAccent}`} />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Manage your currently logged in devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {devices.length === 0 ? (
            <CardContainer className="p-5 text-center text-dash-muted text-xs border border-dash-border rounded-xl bg-dash-input/10 w-full">
              No active sessions found.
            </CardContainer>
          ) : (
            <div className="border border-dash-border/60 rounded-xl bg-dash-input/10 divide-y divide-dash-border/40 overflow-hidden w-full">
              {devices.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 gap-4 hover:bg-dash-input/20 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-dash-input border border-dash-border/60 rounded-lg text-dash-muted flex items-center justify-center shrink-0">
                      <Laptop className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-medium text-dash-text">
                          Token {device.deviceTokenHash.substring(0, 8)}...
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] px-2 py-0.5 font-sans font-semibold rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/15">
                            Current session
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-dash-muted mt-0.5">
                        Expires: {new Date(device.expiresAt).toLocaleDateString()} at {new Date(device.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeDevice(device.deviceTokenHash)}
                    className="border border-rose-500/20 text-rose-600 hover:bg-rose-500/5 hover:text-rose-700 hover:border-rose-500/30 text-xs rounded-lg h-9 px-3.5 transition-all font-medium normal-case"
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
        window.location.reload();
      }} />
    </CardContainer>
  );
}
