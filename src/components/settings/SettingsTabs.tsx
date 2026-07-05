"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "./AccountSettings";
import { SecuritySettings } from "./SecuritySettings";
import { DangerZone } from "./DangerZone";

interface Device {
  deviceTokenHash: string;
  expiresAt: string;
}

interface SettingsTabsProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    mfaEnabled: boolean;
    isActive: boolean;
    role: "investigator" | "analyst" | "admin";
    landingPage: string;
    timezone: string;
    notificationPreferences: {
      securityAlerts: boolean;
      caseReports: boolean;
      systemUpdates: boolean;
    };
    trustedDevices: Device[];
  };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  const roleTabsActive = {
    investigator: "data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-[0_2px_8px_rgba(16,185,129,0.08)] data-[state=active]:border-emerald-500/10",
    analyst: "data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-[0_2px_8px_rgba(6,182,212,0.08)] data-[state=active]:border-cyan-500/10",
    admin: "data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-[0_2px_8px_rgba(168,85,247,0.08)] data-[state=active]:border-purple-500/10",
  }[user.role];

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full max-w-[420px] grid-cols-3 bg-dash-input/50 border border-dash-border/60 p-[3px] rounded-xl mb-8 shadow-sm h-11">
        <TabsTrigger 
          value="account" 
          className={`text-[13px] font-medium rounded-lg text-dash-muted transition-all duration-200 ease-out px-4 h-[38px] border border-transparent hover:text-dash-text ${roleTabsActive}`}
        >
          Account
        </TabsTrigger>
        <TabsTrigger 
          value="security" 
          className={`text-[13px] font-medium rounded-lg text-dash-muted transition-all duration-200 ease-out px-4 h-[38px] border border-transparent hover:text-dash-text ${roleTabsActive}`}
        >
          Security
        </TabsTrigger>
        <TabsTrigger 
          value="danger" 
          className="text-[13px] font-medium rounded-lg text-dash-muted transition-all duration-200 ease-out px-4 h-[38px] border border-transparent hover:text-dash-text data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-[0_2px_8px_rgba(244,63,94,0.08)] data-[state=active]:border-rose-500/10"
        >
          Danger Zone
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-0 outline-none">
        <AccountSettings 
          role={user.role} 
          user={{ 
            fullName: user.fullName, 
            email: user.email,
            landingPage: user.landingPage,
            timezone: user.timezone,
            notificationPreferences: user.notificationPreferences
          }} 
        />
      </TabsContent>

      <TabsContent value="security" className="mt-0 outline-none">
        <SecuritySettings role={user.role} user={{ mfaEnabled: user.mfaEnabled, trustedDevices: user.trustedDevices }} />
      </TabsContent>

      <TabsContent value="danger" className="mt-0 outline-none">
        <DangerZone />
      </TabsContent>
    </Tabs>
  );
}
