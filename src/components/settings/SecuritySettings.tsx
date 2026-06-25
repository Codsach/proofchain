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
    investigator: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    analyst: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]",
    admin: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]",
  }[role];

  const roleAccent = {
    investigator: "text-emerald-400",
    analyst: "text-cyan-400",
    admin: "text-purple-400",
  }[role];

  const roleAccentGlow = {
    investigator: "hover:border-emerald-500/50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50",
    analyst: "hover:border-cyan-500/50 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50",
    admin: "hover:border-purple-500/50 focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50",
  }[role];

  const roleSubmitBtn = {
    investigator: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:bg-emerald-500/50 disabled:cursor-not-allowed",
    analyst: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:bg-cyan-500/50 disabled:cursor-not-allowed",
    admin: "bg-purple-500 text-white hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:bg-purple-500/50 disabled:cursor-not-allowed",
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
    <CardContainer className="space-y-6">
      {/* Password Reset */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader>
          <CardTitle className="text-xl font-heading tracking-wider uppercase text-white flex items-center gap-2">
            <KeyRound className={`h-5 w-5 ${roleAccent}`} />
            Authentication Key
          </CardTitle>
          <CardDescription className="text-dash-muted font-mono text-xs uppercase tracking-wider">
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
                    <FormLabel className="text-dash-muted font-mono text-xs uppercase">Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 font-mono focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dash-muted font-mono text-xs uppercase">New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 font-mono focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`}
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
                      <FormLabel className="text-dash-muted font-mono text-xs uppercase">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className={`bg-dash-hover border border-dash-border text-white placeholder:text-zinc-600 rounded-xl h-11 px-4 font-mono focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none transition-all ${roleAccentGlow}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContainer>
              <CardFooter className="flex justify-end pt-4 border-t border-dash-border bg-transparent p-0">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isDirty}
                  className={`font-mono font-bold uppercase rounded-xl h-11 px-6 transition-all ${roleSubmitBtn}`}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? "Encrypting..." : "Update Password"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-4 flex-wrap gap-4">
          <CardContainer className="space-y-1">
            <CardTitle className="text-xl font-heading tracking-wider uppercase text-white flex items-center gap-2">
              <Shield className={`h-5 w-5 ${roleAccent}`} />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-dash-muted font-mono text-xs uppercase tracking-wider">
              Add an extra layer of security to your account.
            </CardDescription>
          </CardContainer>
          {user.mfaEnabled ? (
            <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1 text-xs">
              <ShieldCheck size={12} className="mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wider bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-1 text-xs">
              Inactive
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <CardContainer className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-dash-border bg-dash-hover/20 rounded-xl gap-4">
            <CardContainer className="space-y-1">
              <p className="text-sm font-medium font-mono uppercase text-white">Authenticator App</p>
              <p className="text-xs text-dash-muted font-mono leading-relaxed">Use an app like Google Authenticator or Authy to generate security codes.</p>
            </CardContainer>
            {!user.mfaEnabled && (
              <Button 
                onClick={() => setIsMfaOpen(true)}
                className={`font-mono font-bold uppercase rounded-xl h-11 px-6 transition-all shrink-0 ${roleSubmitBtn}`}
              >
                Enable 2FA
              </Button>
            )}
          </CardContainer>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-2xl rounded-2xl">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader>
          <CardTitle className="text-xl font-heading tracking-wider uppercase text-white flex items-center gap-2">
            <Laptop className={`h-5 w-5 ${roleAccent}`} />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-dash-muted font-mono text-xs uppercase tracking-wider">
            Manage your currently logged in devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <CardContainer className="p-4 text-center text-dash-muted font-mono text-xs uppercase border border-dash-border rounded-xl bg-dash-hover/10">
              No active sessions found.
            </CardContainer>
          ) : (
            <CardContainer className="space-y-3">
              {devices.map((device, idx) => (
                <CardContainer key={idx} className="flex items-center justify-between p-4 border border-dash-border bg-dash-hover/20 rounded-xl gap-4">
                  <CardContainer className="flex items-center gap-4">
                    <CardContainer className={`p-2.5 bg-dash-hover border border-dash-border/60 rounded-xl ${roleAccent}`}>
                      <Smartphone className="h-5 w-5" />
                    </CardContainer>
                    <CardContainer>
                      <p className="text-sm font-medium font-mono uppercase text-white">Session Token</p>
                      <p className="text-xs text-dash-muted font-mono mt-1">Expires: {new Date(device.expiresAt).toLocaleString()}</p>
                    </CardContainer>
                  </CardContainer>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeDevice(device.deviceTokenHash)}
                    className="border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-mono uppercase text-xs rounded-xl h-9 px-4 transition-all"
                  >
                    Revoke
                  </Button>
                </CardContainer>
              ))}
            </CardContainer>
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
