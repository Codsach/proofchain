import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server-session";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import UserProfile from "@/lib/models/UserProfile";
import { EvidenceModel as Evidence } from "@/lib/models/Evidence";
import Case from "@/lib/models/Case";
import Verdict from "@/lib/models/Verdict";
import AuditLog from "@/lib/models/AuditLog";
import User from "@/lib/models/User";
import { DossierHeader } from "@/components/profile/DossierHeader";
import { InvestigatorDossier } from "@/components/profile/InvestigatorDossier";
import { AnalystDossier } from "@/components/profile/AnalystDossier";
import { AdminDossier } from "@/components/profile/AdminDossier";

export const metadata = {
 title: "Profile | Dossier",
};

export default async function ProfilePage() {
 const session = await getServerSessionUser();
 if (!session) {
 redirect("/login");
 }

 await connectDB();

 // Fetch full user and profile
 const user = await User.findById(session.id).lean();
 if (!user) {
 redirect("/login");
 }

 const profile = await UserProfile.findOne({ userId: session.id }).lean();

 const userProps = {
 fullName: user.fullName as string,
 email: user.email as string,
 role: user.role as "investigator" | "analyst" | "admin",
 createdAt: (user.createdAt as Date).toISOString(),
 lastLoginAt: user.lastLoginAt ? (user.lastLoginAt as Date).toISOString() : null,
 mfaEnabled: user.mfaEnabled as boolean,
 };

 const profileProps = profile ? {
 avatarUrl: profile.avatarUrl as string | null,
 phoneNumber: profile.phoneNumber as string | null,
 department: profile.department as string | null,
 location: profile.location as string | null,
 bio: profile.bio as string | null,
 emergencyContactName: profile.emergencyContactName as string | null,
 emergencyContactPhone: profile.emergencyContactPhone as string | null,
 skills: profile.skills as string[],
 assignedDevices: profile.assignedDevices as string[],
 } : null;

 // Compute stats and fetch recent logs based on role
 let roleComponent = null;

 if (user.role === "investigator") {
 const evidenceSubmitted = await Evidence.countDocuments({ uploadedBy: session.id });
 const activeCases = await Case.countDocuments({ 
 investigatorId: session.id,
 status: { $nin: ["archived", "rejected", "verified"] } 
 });
 const recentSubmissions = await Evidence.find({ uploadedBy: session.id })
 .sort({ createdAt: -1 })
 .limit(5)
 .select("title createdAt fileHash")
 .lean();

 roleComponent = (
 <InvestigatorDossier 
 stats={{ evidenceSubmitted, activeCases }} 
 recentSubmissions={JSON.parse(JSON.stringify(recentSubmissions))} 
 />
 );
 } else if (user.role === "analyst") {
 // Assuming Evidence model has an 'assignedAnalyst' and 'status' field, or we just count all pending
 const pendingReviews = await Evidence.countDocuments({ status: "pending_review" });
 const verdictsIssued = await Verdict.countDocuments({ analystId: session.id });
 
 // Aggregate authentic vs tampered
 const authenticReviews = await Verdict.countDocuments({ analystId: session.id, status: "authentic" });
 const tamperedReviews = await Verdict.countDocuments({ analystId: session.id, status: "tampered" });

 const recentVerdicts = await Verdict.find({ analystId: session.id })
 .sort({ createdAt: -1 })
 .limit(5)
 .select("status createdAt evidenceId")
 .lean();

 roleComponent = (
 <AnalystDossier 
 stats={{ pendingReviews, verdictsIssued, authenticReviews, tamperedReviews }} 
 recentVerdicts={JSON.parse(JSON.stringify(recentVerdicts))} 
 />
 );
 } else if (user.role === "admin") {
 const totalUsers = await User.countDocuments();
 const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
 const recentAudits = await AuditLog.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
 
 const recentActions = await AuditLog.find({ actorId: session.id })
 .sort({ createdAt: -1 })
 .limit(5)
 .select("action targetId createdAt")
 .lean();

 roleComponent = (
 <AdminDossier 
 stats={{ totalUsers, recentAudits }} 
 recentActions={JSON.parse(JSON.stringify(recentActions))} 
 />
 );
 }

  return (
    <Card className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6 bg-[var(--dash-bg)] text-[var(--dash-text)] border-none shadow-none ring-0 sentinel-theme font-sans">
      <CardHeader className="flex flex-col gap-2 p-0">
        <CardTitle className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Dossier</CardTitle>
        <CardDescription className="text-dash-muted font-mono uppercase tracking-widest label-sm">Classified Personnel Record</CardDescription>
      </CardHeader>

      <DossierHeader user={userProps} profile={profileProps} />
      
      {roleComponent}
    </Card>
  );
}
