import { NextRequest, NextResponse } from "next/server";
import { clearRefreshCookie, getIp, verifyAccessToken } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = "unknown";
    let role = "unknown";

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = verifyAccessToken(authHeader.split(" ")[1]);
        userId = payload.userId;
        role = payload.role;
      } catch {
        // Token may already be expired — still proceed with logout
      }
    }

    await logAction({
      actorId: userId !== "unknown" ? userId : null,
      actorRole: role,
      actionType: "user.logout",
      targetType: "user",
      targetId: userId,
      ipAddress: getIp(req),
    });

    const res = NextResponse.json({ message: "Logged out successfully" });
    clearRefreshCookie(res);
    return res;
  } catch (err) {
    console.error("[logout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
