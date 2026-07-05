import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server-session";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const metadata = {
 title: "Settings | Dossier",
};

export default async function SettingsPage() {
 const session = await getServerSessionUser();
 if (!session) {
 redirect("/login");
 }

 await connectDB();

 const user = await User.findById(session.id).lean();
 if (!user) {
 redirect("/login");
 }

  const serializedUser = {
    id: user._id.toString(),
    fullName: user.fullName as string,
    email: user.email as string,
    mfaEnabled: user.mfaEnabled as boolean,
    isActive: user.isActive as boolean,
    role: user.role as "investigator" | "analyst" | "admin",
    landingPage: (user.landingPage || "dashboard") as string,
    timezone: (user.timezone || "UTC") as string,
    notificationPreferences: {
      securityAlerts: user.notificationPreferences?.securityAlerts !== false,
      caseReports: user.notificationPreferences?.caseReports !== false,
      systemUpdates: !!user.notificationPreferences?.systemUpdates
    },
    trustedDevices: (user.trustedDevices || []).map((device: any) => ({
      deviceTokenHash: device.deviceTokenHash as string,
      expiresAt: (device.expiresAt as Date).toISOString()
    }))
  };

  return (
    <div className="flex justify-center w-full">
      <Card className="flex-1 w-full max-w-5xl p-0 space-y-8 bg-transparent text-[var(--dash-text)] border-none shadow-none ring-0 sentinel-theme-v2 font-sans">
        <CardHeader className="flex flex-col gap-1.5 p-0">
          <CardTitle className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Control Room</CardTitle>
          <CardDescription className="text-dash-muted font-mono uppercase tracking-widest label-sm">System Preferences & Security</CardDescription>
        </CardHeader>

        <SettingsTabs user={serializedUser} />
      </Card>
    </div>
  );
}
