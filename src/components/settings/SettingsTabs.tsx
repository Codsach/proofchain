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
    trustedDevices: Device[];
  };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  const roleTabsActive = {
    investigator: "data-[state=active]:bg-dash-hover data-[state=active]:text-emerald-700",
    analyst: "data-[state=active]:bg-dash-hover data-[state=active]:text-cyan-700",
    admin: "data-[state=active]:bg-dash-hover data-[state=active]:text-purple-700",
  }[user.role];

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-dash-card border border-dash-border p-1 rounded-xl mb-6 shadow-md">
        <TabsTrigger 
          value="account" 
          className={`font-mono text-xs uppercase rounded-lg text-dash-muted transition-all ${roleTabsActive}`}
        >
          Account
        </TabsTrigger>
        <TabsTrigger 
          value="security" 
          className={`font-mono text-xs uppercase rounded-lg text-dash-muted transition-all ${roleTabsActive}`}
        >
          Security
        </TabsTrigger>
        <TabsTrigger 
          value="danger" 
          className="font-mono text-xs uppercase rounded-lg text-dash-muted transition-all data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-700"
        >
          Danger Zone
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-0 outline-none">
        <AccountSettings role={user.role} user={{ fullName: user.fullName, email: user.email }} />
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
