"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Loader2, Sliders, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardContainer, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateAccountDetails, updateProfilePreferences, updateNotificationPreferences } from "@/app/(dashboard)/settings/actions";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const accountSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

function Switch({ 
  checked, 
  onChange,
  disabled
}: { 
  checked: boolean; 
  onChange: (val: boolean) => void; 
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 ${
        checked ? 'bg-blue-600' : 'bg-dash-input border-dash-border'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function AccountSettings({ 
  role, 
  user 
}: { 
  role: "investigator" | "analyst" | "admin"; 
  user: { 
    fullName: string; 
    email: string;
    landingPage: string;
    timezone: string;
    notificationPreferences: {
      securityAlerts: boolean;
      caseReports: boolean;
      systemUpdates: boolean;
    };
  };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Profile configuration states
  const [landingPage, setLandingPage] = useState(user.landingPage);
  const [timeZone, setTimeZone] = useState(user.timezone);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [savedLandingPage, setSavedLandingPage] = useState(user.landingPage);
  const [savedTimeZone, setSavedTimeZone] = useState(user.timezone);

  // Notification states
  const [securityAlerts, setSecurityAlerts] = useState(user.notificationPreferences.securityAlerts);
  const [caseReports, setCaseReports] = useState(user.notificationPreferences.caseReports);
  const [systemUpdates, setSystemUpdates] = useState(user.notificationPreferences.systemUpdates);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [savedSecurityAlerts, setSavedSecurityAlerts] = useState(user.notificationPreferences.securityAlerts);
  const [savedCaseReports, setSavedCaseReports] = useState(user.notificationPreferences.caseReports);
  const [savedSystemUpdates, setSavedSystemUpdates] = useState(user.notificationPreferences.systemUpdates);

  const isProfileDirty = landingPage !== savedLandingPage || timeZone !== savedTimeZone;
  const isNotificationsDirty = securityAlerts !== savedSecurityAlerts || caseReports !== savedCaseReports || systemUpdates !== savedSystemUpdates;

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await updateProfilePreferences({ landingPage, timezone: timeZone });
      if (res.success) {
        toast({ title: "Preferences saved", description: "Your system configuration preferences have been successfully updated." });
        setSavedLandingPage(landingPage);
        setSavedTimeZone(timeZone);
      } else {
        toast({ variant: "destructive", title: "Update failed", description: res.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const res = await updateNotificationPreferences({ securityAlerts, caseReports, systemUpdates });
      if (res.success) {
        toast({ title: "Preferences saved", description: "Your notification settings have been successfully updated." });
        setSavedSecurityAlerts(securityAlerts);
        setSavedCaseReports(caseReports);
        setSavedSystemUpdates(systemUpdates);
      } else {
        toast({ variant: "destructive", title: "Update failed", description: res.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSavingNotifications(false);
    }
  };

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

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await updateAccountDetails(data);
      if (res.success) {
        toast({ title: "Account updated", description: "Your details have been successfully saved." });
        form.reset(data);
      } else {
        toast({ variant: "destructive", title: "Update failed", description: res.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContainer className="space-y-8">
      {/* Identity Card */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg font-heading font-semibold text-dash-text flex items-center gap-2">
            <User className={`h-5 w-5 ${roleAccent}`} />
            Identity Protocol
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Update your core personnel details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl w-full">
              <CardContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-dash-text tracking-tight">Full name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 px-4 font-sans focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-dash-text tracking-tight">Email address</FormLabel>
                      <FormControl>
                        <CardContainer className="relative">
                          <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 ${roleAccent}`} />
                          <Input
                            placeholder="john.doe@example.com"
                            className="bg-dash-input border border-dash-border text-dash-text placeholder:text-dash-muted/40 rounded-xl h-14 pl-11 pr-4 font-sans focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all"
                            {...field}
                          />
                        </CardContainer>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContainer>
              <CardFooter className="flex justify-end pt-0 p-0 mt-8 bg-transparent border-none">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isDirty}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl h-14 px-8 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed normal-case"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile Configuration Card */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg font-heading font-semibold text-dash-text flex items-center gap-2">
            <Sliders className={`h-5 w-5 ${roleAccent}`} />
            Profile Configuration
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Configure system preferences for your user profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-w-2xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 flex flex-col">
                <label className="text-[13px] font-medium text-dash-text tracking-tight">Default landing page</label>
                <Select value={landingPage} onValueChange={setLandingPage}>
                  <SelectTrigger className="bg-dash-input border border-dash-border text-dash-text rounded-xl !h-14 px-4 font-sans !w-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all">
                    <SelectValue placeholder="Select landing page" />
                  </SelectTrigger>
                  <SelectContent className="bg-dash-modal border border-dash-border font-sans text-sm text-dash-text">
                    <SelectItem value="dashboard">Dashboard Overview</SelectItem>
                    <SelectItem value="cases">Cases Registry</SelectItem>
                    <SelectItem value="audit">Audit Registry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col">
                <label className="text-[13px] font-medium text-dash-text tracking-tight">System time zone</label>
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger className="bg-dash-input border border-dash-border text-dash-text rounded-xl !h-14 px-4 font-sans !w-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 focus-visible:outline-none transition-all">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-dash-modal border border-dash-border font-sans text-sm text-dash-text">
                    <SelectItem value="UTC">UTC (GMT+00:00)</SelectItem>
                    <SelectItem value="EST">EST (GMT-05:00)</SelectItem>
                    <SelectItem value="PST">PST (GMT-08:00)</SelectItem>
                    <SelectItem value="IST">IST (GMT+05:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-0 mt-8 bg-transparent border-none">
              <Button 
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !isProfileDirty}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl h-14 px-8 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed normal-case"
              >
                {isSavingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSavingProfile ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences Card */}
      <Card className="relative overflow-hidden bg-dash-card border border-dash-border ring-0 shadow-sm rounded-2xl p-[28px] gap-6 flex flex-col">
        <CardContainer className={`absolute top-0 left-0 h-[2px] w-full ${roleBarTheme}`} />
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg font-heading font-semibold text-dash-text flex items-center gap-2">
            <Bell className={`h-5 w-5 ${roleAccent}`} />
            Notification Registry
          </CardTitle>
          <CardDescription className="text-sm text-dash-muted">
            Configure email registry for system updates and audits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-w-2xl w-full">
            <div className="border border-dash-border/60 rounded-xl bg-dash-input/10 divide-y divide-dash-border/40 overflow-hidden">
              <div className="flex items-center justify-between p-5 gap-6 hover:bg-dash-input/20 transition-colors">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-dash-text">Security Alerts</p>
                  <p className="text-xs text-dash-muted leading-relaxed">Receive notifications when new login sessions are established.</p>
                </div>
                <Switch checked={securityAlerts} onChange={setSecurityAlerts} />
              </div>
              <div className="flex items-center justify-between p-5 gap-6 hover:bg-dash-input/20 transition-colors">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-dash-text">Case Reports</p>
                  <p className="text-xs text-dash-muted leading-relaxed">Receive updates on custody chain hashes and analyst logs.</p>
                </div>
                <Switch checked={caseReports} onChange={setCaseReports} />
              </div>
              <div className="flex items-center justify-between p-5 gap-6 hover:bg-dash-input/20 transition-colors">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-dash-text">System Updates</p>
                  <p className="text-xs text-dash-muted leading-relaxed">Receive alerts about registry maintenance and protocol updates.</p>
                </div>
                <Switch checked={systemUpdates} onChange={setSystemUpdates} />
              </div>
            </div>
            <div className="flex justify-end pt-0 mt-8 bg-transparent border-none">
              <Button 
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications || !isNotificationsDirty}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl h-14 px-8 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed normal-case"
              >
                {isSavingNotifications && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSavingNotifications ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </CardContainer>
  );
}
