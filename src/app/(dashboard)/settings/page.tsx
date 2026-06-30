import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server-session";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const metadata = {
 title: "Settings | Dossier",
};

const SettingsBackground = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-transparent">
      {/* Top Left: Slate */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_30%,#cbd5e1_0%,transparent_40%)]" />
      {/* Top Right: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,#bfdbfe_0%,transparent_40%)]" />
      {/* Bottom Center: Slate */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_80%,#cbd5e1_0%,transparent_40%)]" />
      {/* Bottom Right: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_90%_90%,#bfdbfe_0%,transparent_40%)]" />
    </div>
  );
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
    <div className="relative min-h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden flex justify-center w-full">
      {/* Background mesh gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <SettingsBackground />
      </div>

      <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8 flex justify-center">
        <Card className="flex-1 w-full max-w-4xl p-0 space-y-6 bg-transparent text-[var(--dash-text)] border-none shadow-none ring-0 sentinel-theme-v2 font-sans">
          <CardHeader className="flex flex-col gap-2 p-0">
            <CardTitle className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Control Room</CardTitle>
            <CardDescription className="text-dash-muted font-mono uppercase tracking-widest label-sm">System Preferences & Security</CardDescription>
          </CardHeader>

          <SettingsTabs user={serializedUser} />
        </Card>
      </div>
    </div>
  );
}
