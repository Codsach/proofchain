import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server-session";
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
    trustedDevices: (user.trustedDevices || []).map((device: any) => ({
      deviceTokenHash: device.deviceTokenHash as string,
      expiresAt: (device.expiresAt as Date).toISOString()
    }))
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--dash-text)] uppercase font-mono">Control Room</h1>
        <p className="text-[var(--dash-muted)] font-mono text-sm uppercase">System Preferences & Security</p>
      </div>

      <SettingsTabs user={serializedUser} />
    </div>
  );
}
