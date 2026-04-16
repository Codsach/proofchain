import { connectDB } from "./db";
import AuditLog, { AuditActionType } from "./models/AuditLog";

interface LogActionParams {
  actorId: string | null;
  actorRole: string;
  actionType: AuditActionType;
  targetType: string;
  targetId: string;
  ipAddress: string;
  metadata?: Record<string, unknown>;
}

// Call this in every API route that modifies data.
// It is intentionally non-throwing — a log failure must never
// block the main operation.
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      timestamp: new Date(),
      actorId: params.actorId || null,
      actorRole: params.actorRole,
      actionType: params.actionType,
      targetType: params.targetType,
      targetId: params.targetId,
      ipAddress: params.ipAddress,
      metadata: params.metadata || {},
    });
  } catch (err) {
    // Log to console but never throw — audit failure is not a user-facing error
    console.error("[audit] Failed to write audit log:", err);
  }
}