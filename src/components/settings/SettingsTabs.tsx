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
 trustedDevices: Device[];
 };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
 return (
 <Tabs defaultValue="account" className="w-full">
 <TabsList className="grid w-full grid-cols-3 border mb-6">
 <TabsTrigger 
 value="account" 
 className="font-mono text-xs uppercase text-muted-foreground data-[state=active]: data-[state=active]:text-[var(--dash-accent)]"
 >
 Account
 </TabsTrigger>
 <TabsTrigger 
 value="security" 
 className="font-mono text-xs uppercase text-muted-foreground data-[state=active]: data-[state=active]:text-[var(--dash-accent)]"
 >
 Security
 </TabsTrigger>
 <TabsTrigger 
 value="danger" 
 className="font-mono text-xs uppercase text-muted-foreground data-[state=active]:bg-rose-950/20 data-[state=active]:text-rose-500"
 >
 Danger Zone
 </TabsTrigger>
 </TabsList>

 <TabsContent value="account" className="mt-0 outline-none">
 <AccountSettings user={{ fullName: user.fullName, email: user.email }} />
 </TabsContent>

 <TabsContent value="security" className="mt-0 outline-none">
 <SecuritySettings user={{ mfaEnabled: user.mfaEnabled, trustedDevices: user.trustedDevices }} />
 </TabsContent>

 <TabsContent value="danger" className="mt-0 outline-none">
 <DangerZone />
 </TabsContent>
 </Tabs>
 );
}
