import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AuditLog from "@/lib/models/AuditLog";
import Comment from "@/lib/models/Comment";
import { withAuth, JWTPayload } from "@/lib/auth";

export const runtime = "nodejs";

async function getActivity(
  req: NextRequest,
  _ctx: any,
  user: JWTPayload
) {
  try {
    await connectDB();

    const filter: Record<string, any> =
      user.role === "investigator" ? { investigatorId: user.userId } : {};

    const cases = await Case.find(filter)
      .select("caseId title files overallTamperScore overallRiskLevel onChainTxHash status createdAt updatedAt")
      .lean();

    const caseIds = cases.map(c => c.caseId);
    if (caseIds.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    const caseIdToTitle: Record<string, string> = {};
    cases.forEach(c => {
      caseIdToTitle[c.caseId] = c.title;
    });

    // 1. Fetch real audit logs
    const logs = await AuditLog.find({
      $or: [
        { targetId: { $in: caseIds } },
        { "metadata.caseId": { $in: caseIds } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // 2. Fetch comments
    const comments = await Comment.find({
      caseId: { $in: caseIds },
      deletedAt: null
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 3. Map real logs to activities
    const activitiesMap: Record<string, any> = {};

    logs.forEach(log => {
      let caseId = "";
      if (caseIdToTitle[log.targetId]) {
        caseId = log.targetId;
      } else if (log.metadata && typeof log.metadata.caseId === "string" && caseIdToTitle[log.metadata.caseId]) {
        caseId = log.metadata.caseId;
      }

      if (!caseId) return;

      const caseName = caseIdToTitle[caseId];
      const key = `${caseId}-${log.actionType}-${log.timestamp.getTime()}`;

      activitiesMap[key] = {
        id: log._id.toString(),
        caseId,
        caseName,
        actionType: log.actionType,
        actorRole: log.actorRole,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata || {},
      };
    });

    // 4. Map comments
    comments.forEach(c => {
      const key = `${c.caseId}-comment-${c.createdAt.getTime()}`;
      activitiesMap[key] = {
        id: c._id.toString(),
        caseId: c.caseId,
        caseName: caseIdToTitle[c.caseId] || "Unknown Case",
        actionType: "case.comment",
        actorRole: c.authorRole,
        timestamp: c.createdAt.toISOString(),
        metadata: {
          authorName: c.authorName,
          content: c.content,
        },
      };
    });

    // 5. Synthesize events from case details if they are missing
    cases.forEach(c => {
      // Case create (assigned)
      const caseCreateKey = `${c.caseId}-case.create`;
      const hasRealCreate = logs.some(l => l.targetId === c.caseId && l.actionType === "case.create");
      if (!hasRealCreate) {
        activitiesMap[caseCreateKey] = {
          id: `synth-create-${c.caseId}`,
          caseId: c.caseId,
          caseName: c.title,
          actionType: "case.create",
          actorRole: "system",
          timestamp: new Date(c.createdAt).toISOString(),
          metadata: {},
        };
      }

      // Evidence uploads
      if (c.files && c.files.length > 0) {
        c.files.forEach((file) => {
          const fileKey = `${c.caseId}-file.upload-${file.fileId}`;
          const hasRealUpload = logs.some(l => l.targetId === file.fileId && l.actionType === "file.upload");
          if (!hasRealUpload) {
            activitiesMap[fileKey] = {
              id: `synth-file-${file.fileId}`,
              caseId: c.caseId,
              caseName: c.title,
              actionType: "file.upload",
              actorRole: "investigator",
              timestamp: new Date(file.uploadedAt || c.createdAt).toISOString(),
              metadata: {
                fileName: file.originalName,
                sizeBytes: file.sizeBytes,
              },
            };
          }
        });
      }

      // AI complete
      if (c.overallTamperScore !== null) {
        const aiKey = `${c.caseId}-ai.complete`;
        const hasRealAi = logs.some(l => l.targetId === c.caseId && l.actionType === "ai.complete");
        if (!hasRealAi) {
          activitiesMap[aiKey] = {
            id: `synth-ai-${c.caseId}`,
            caseId: c.caseId,
            caseName: c.title,
            actionType: "ai.complete",
            actorRole: "ai",
            timestamp: new Date(c.updatedAt || c.createdAt).toISOString(),
            metadata: {
              score: c.overallTamperScore,
              risk: c.overallRiskLevel,
            },
          };
        }
      }

      // Blockchain hash anchored
      if (c.onChainTxHash) {
        const chainKey = `${c.caseId}-file.hash_anchor`;
        const hasRealChain = logs.some(l => l.targetId === c.caseId && l.actionType === "file.hash_anchor");
        if (!hasRealChain) {
          activitiesMap[chainKey] = {
            id: `synth-chain-${c.caseId}`,
            caseId: c.caseId,
            caseName: c.title,
            actionType: "file.hash_anchor",
            actorRole: "system",
            timestamp: new Date(new Date(c.createdAt).getTime() + 120000).toISOString(), // + 2 mins
            metadata: {
              txHash: c.onChainTxHash,
            },
          };
        }
      }

      // Verdict verified / rejected
      if (["verified", "rejected"].includes(c.status)) {
        const verdictKey = `${c.caseId}-verdict.issue`;
        const hasRealVerdict = logs.some(l => l.targetId === c.caseId && l.actionType === "verdict.issue");
        if (!hasRealVerdict) {
          activitiesMap[verdictKey] = {
            id: `synth-verdict-${c.caseId}`,
            caseId: c.caseId,
            caseName: c.title,
            actionType: "verdict.issue",
            actorRole: "analyst",
            timestamp: new Date(c.updatedAt).toISOString(),
            metadata: {
              verdict: c.status,
            },
          };
        }
      }

      // Tamper score alert
      if (c.overallRiskLevel === "high") {
        const tamperKey = `${c.caseId}-ai.tamper_alert`;
        activitiesMap[tamperKey] = {
          id: `synth-tamper-${c.caseId}`,
          caseId: c.caseId,
          caseName: c.title,
          actionType: "ai.tamper_alert",
          actorRole: "ai",
          timestamp: new Date(c.updatedAt || c.createdAt).toISOString(),
          metadata: {
            score: c.overallTamperScore,
          },
        };
      }
    });

    // Sort all activities chronologically descending
    const sortedActivities = Object.values(activitiesMap).sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ activities: sortedActivities });
  } catch (err) {
    console.error("[activity-feed]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getActivity, ["investigator", "analyst", "admin"]);
