import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import User from "@/lib/models/User";
import AuditLog from "@/lib/models/AuditLog";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getChartStats(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "30d";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOf24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Determine timeline matching parameters
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30d default
    let groupStage: any = {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        cases: { $sum: 1 },
      },
    };

    if (timeframe === "today") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      groupStage = {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            hour: { $hour: "$createdAt" },
          },
          cases: { $sum: 1 },
        },
      };
    } else if (timeframe === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeframe === "1y") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      groupStage = {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          cases: { $sum: 1 },
        },
      };
    }

    const [
      volumeRaw,
      queueRaw,
      incidentRaw,
      userCountsRaw,
      logsTodayCount,
      archivedCasesCount,
      completedCases,
      verifiedCases,
      unanchoredCasesCount,
      storageUsageRaw,
      highRiskPendingCount,
      lockedUsersCount,
      failedAttemptsRaw,
      lastRegisteredUserRaw,
      casesCreatedToday,
      casesCreatedYesterday,
      securityLogsCount,
    ] = await Promise.all([
      // Aggregated Case volume per day/hour/month
      Case.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        groupStage,
      ]),

      // Case status grouping for AI queue
      Case.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Incident types
      Case.aggregate([
        {
          $group: {
            _id: "$incidentType",
            count: { $sum: 1 },
          },
        },
      ]),

      // User counts by role
      User.aggregate([
        {
          $group: {
            _id: "$role",
            total: { $sum: 1 },
            active: { $sum: { $cond: ["$isActive", 1, 0] } },
          },
        },
      ]),

      // Audit logs today
      AuditLog.countDocuments({
        timestamp: { $gte: startOfToday },
      }),

      // Archived cases
      Case.countDocuments({ status: "archived" }),

      // Completed cases for average review time
      Case.find({
        status: { $in: ["verified", "rejected", "archived"] },
      }).select("createdAt updatedAt"),

      // Verified cases for average verification time
      Case.find({ status: "verified" }).select("createdAt updatedAt"),

      // Unanchored cases (sync delay)
      Case.countDocuments({ status: "verified", onChainTxHash: null }),

      // Storage usage bytes sum
      Case.aggregate([
        { $unwind: "$files" },
        { $group: { _id: null, totalBytes: { $sum: "$files.sizeBytes" } } },
      ]),

      // High-risk case awaiting review
      Case.countDocuments({
        status: { $in: ["pending_review", "under_review"] },
        overallRiskLevel: "high",
      }),

      // Locked user count
      User.countDocuments({
        lockUntil: { $gt: now },
      }),

      // Total failed attempts currently accumulated across all users
      User.aggregate([
        { $group: { _id: null, totalAttempts: { $sum: "$loginAttempts" } } }
      ]),

      // Last registered user metadata
      User.findOne()
        .sort({ createdAt: -1 })
        .select("fullName role createdAt")
        .lean(),

      // Cases created calendar day today
      Case.countDocuments({ createdAt: { $gte: startOfToday } }),

      // Cases created calendar day yesterday
      Case.countDocuments({
        createdAt: {
          $gte: startOfYesterday,
          $lt: startOfToday,
        },
      }),

      // Security sensitive logs in the last 24 hours
      AuditLog.countDocuments({
        timestamp: { $gte: startOf24h },
        actionType: {
          $in: [
            "user.deactivate",
            "user.delete",
            "user.reset_password_request",
            "role.updated",
            "user.role_update",
          ],
        },
      } as any),
    ]);

    // --- Shape timeline volume data ---
    let volumeData: { name: string; cases: number }[] = [];

    if (timeframe === "today") {
      const volumeMap: Record<string, number> = {};
      for (const v of volumeRaw) {
        volumeMap[`${v._id.year}-${v._id.month}-${v._id.day}-${v._id.hour}`] = v.cases;
      }
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
        const label = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
        volumeData.push({ name: label, cases: volumeMap[key] ?? 0 });
      }
    } else if (timeframe === "7d") {
      const volumeMap: Record<string, number> = {};
      for (const v of volumeRaw) {
        volumeMap[`${v._id.year}-${v._id.month}-${v._id.day}`] = v.cases;
      }
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        volumeData.push({ name: label, cases: volumeMap[key] ?? 0 });
      }
    } else if (timeframe === "90d") {
      const volumeMap: Record<string, number> = {};
      for (const v of volumeRaw) {
        volumeMap[`${v._id.year}-${v._id.month}-${v._id.day}`] = v.cases;
      }
      for (let i = 89; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        volumeData.push({ name: label, cases: volumeMap[key] ?? 0 });
      }
    } else if (timeframe === "1y") {
      const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const volumeMap: Record<string, number> = {};
      for (const v of volumeRaw) {
        volumeMap[`${v._id.year}-${v._id.month}`] = v.cases;
      }
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        volumeData.push({ name: MONTH_NAMES[d.getMonth()], cases: volumeMap[key] ?? 0 });
      }
    } else {
      // Default: 30d
      const volumeMap: Record<string, number> = {};
      for (const v of volumeRaw) {
        volumeMap[`${v._id.year}-${v._id.month}-${v._id.day}`] = v.cases;
      }
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        volumeData.push({ name: label, cases: volumeMap[key] ?? 0 });
      }
    }

    // --- Shape AI Processing Queue data ---
    let pendingAi = 0;
    let completed = 0;
    let failed = 0;
    let manualReview = 0;

    for (const q of queueRaw) {
      const status = q._id;
      const count = q.count;
      if (status === "pending_ai_review") {
        pendingAi += count;
      } else if (status === "verified" || status === "rejected" || status === "archived") {
        completed += count;
      } else if (status === "ai_timeout") {
        failed += count;
      } else if (status === "pending_review" || status === "under_review") {
        manualReview += count;
      }
    }

    const aiQueueData = [
      { name: "Pending AI Analysis", value: pendingAi, color: "#3b82f6" },
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "Failed", value: failed, color: "#f43f5e" },
      { name: "Requires Manual Review", value: manualReview, color: "#f59e0b" },
    ];

    // --- Shape Incident Type distribution ---
    const INCIDENT_LABELS: Record<string, string> = {
      data_breach: "Data Breach",
      insider_threat: "Insider Threat",
      malware: "Malware",
      phishing: "Fraud",
      other: "Other",
    };
    const incidentMap: Record<string, number> = {
      data_breach: 0,
      insider_threat: 0,
      malware: 0,
      phishing: 0,
      other: 0,
    };
    for (const item of incidentRaw) {
      if (item._id in incidentMap) {
        incidentMap[item._id] = item.count;
      } else {
        incidentMap.other += item.count;
      }
    }
    const incidentTypeData = Object.entries(incidentMap)
      .map(([key, count]) => ({
        name: INCIDENT_LABELS[key] ?? key,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // --- Shape user counts ---
    const userMap: Record<string, { total: number; active: number }> = {
      investigator: { total: 0, active: 0 },
      analyst: { total: 0, active: 0 },
      admin: { total: 0, active: 0 },
    };
    let totalUsers = 0;
    for (const u of userCountsRaw) {
      if (u._id in userMap) {
        userMap[u._id] = { total: u.total, active: u.active };
        totalUsers += u.total;
      }
    }

    // --- Compute Evidence Uploaded Today ---
    const casesWithTodayFiles = await Case.find({
      "files.uploadedAt": { $gte: startOfToday },
    }).select("files");
    let evidenceUploadedToday = 0;
    for (const c of casesWithTodayFiles) {
      evidenceUploadedToday += c.files.filter(f => f.uploadedAt >= startOfToday).length;
    }

    // --- Compute Blockchain Writes Today ---
    const blockchainWritesToday = await Case.countDocuments({
      onChainTxHash: { $ne: null },
      updatedAt: { $gte: startOfToday },
    });

    // --- Compute Security Events (24h) ---
    const failedAttemptsCount = failedAttemptsRaw[0]?.totalAttempts ?? 0;
    const securityEvents24h = securityLogsCount + failedAttemptsCount;

    // --- Cases Created Today diff calculation ---
    const casesCreatedYesterdayDiff = casesCreatedToday - casesCreatedYesterday;

    const operationalSummary = {
      casesCreatedToday,
      casesCreatedYesterdayDiff,
      evidenceUploadedToday,
      blockchainWritesToday,
      securityEvents24h,
    };

    const quickLinkMetrics = {
      totalUsers,
      logsToday: logsTodayCount,
      archivedCasesCount,
    };

    // --- Actionable alerts for "Attention Required" ---
    const attentionRequiredAlerts = [];
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    
    if (highRiskPendingCount > 0) {
      attentionRequiredAlerts.push({
        type: "warning",
        title: "High-Risk Case Awaiting Review",
        description: `${highRiskPendingCount} high-risk case${highRiskPendingCount > 1 ? "s are" : " is"} currently pending review.`,
        detectedTime: tenMinsAgo,
        link: "/admin/cases",
      });
    }
    if (lockedUsersCount > 0) {
      attentionRequiredAlerts.push({
        type: "warning",
        title: "User Accounts Locked",
        description: `${lockedUsersCount} user account${lockedUsersCount > 1 ? "s have" : " has"} been locked due to excessive failed logins.`,
        detectedTime: twoMinsAgo,
        link: "/admin/users",
      });
    } else if (failedAttemptsCount > 0) {
      attentionRequiredAlerts.push({
        type: "warning",
        title: "Failed Logins Logged",
        description: `Cumulative total of ${failedAttemptsCount} failed login attempts registered across active accounts.`,
        detectedTime: hourAgo,
        link: "/admin/audit",
      });
    }
    const storageBytes = storageUsageRaw[0]?.totalBytes ?? 0;
    if (storageBytes > 9 * 1024 * 1024 * 1024) { // > 9GB
      attentionRequiredAlerts.push({
        type: "critical",
        title: "Storage Capacity Threshold Breached",
        description: "Evidence files directory has consumed over 90% of available storage capacity.",
        detectedTime: twoMinsAgo,
        link: "/admin/cases",
      });
    } else if (storageBytes > 8 * 1024 * 1024 * 1024) { // > 8GB
      attentionRequiredAlerts.push({
        type: "warning",
        title: "Storage Space Exhaustion",
        description: "Evidence files directory has consumed over 80% of available storage capacity.",
        detectedTime: tenMinsAgo,
        link: "/admin/cases",
      });
    }
    if (unanchoredCasesCount > 3) {
      attentionRequiredAlerts.push({
        type: "warning",
        title: "Blockchain Synchronization Delayed",
        description: `${unanchoredCasesCount} transaction anchoring queue processes are pending block confirmation.`,
        detectedTime: tenMinsAgo,
        link: "/admin/audit",
      });
    }

    // Last registered user details format
    let lastRegisteredUser = null;
    if (lastRegisteredUserRaw) {
      lastRegisteredUser = {
        fullName: lastRegisteredUserRaw.fullName,
        role: lastRegisteredUserRaw.role,
        createdAt: lastRegisteredUserRaw.createdAt.toISOString(),
      };
    }

    return NextResponse.json({
      volumeData,
      aiQueueData,
      incidentTypeData,
      userCounts: userMap,
      operationalSummary,
      quickLinkMetrics,
      attentionRequiredAlerts,
      lastRegisteredUser,
    });
  } catch (err) {
    console.error("[admin/stats/charts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getChartStats, ["admin"]);
