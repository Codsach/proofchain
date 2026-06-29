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
 trustedDevices: (user.trustedDevices || []).map((device: any) => ({
 deviceTokenHash: device.deviceTokenHash as string,
 expiresAt: (device.expiresAt as Date).toISOString()
 }))
 };

  return (
    <Card className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6 bg-[var(--dash-bg)] text-[var(--dash-text)] border-none shadow-none ring-0 sentinel-theme-v2 font-sans">
      <CardHeader className="flex flex-col gap-2 p-0">
        <CardTitle className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Control Room</CardTitle>
        <CardDescription className="text-dash-muted font-mono uppercase tracking-widest label-sm">System Preferences & Security</CardDescription>
      </CardHeader>

      <SettingsTabs user={serializedUser} />
    </Card>
  );
}
