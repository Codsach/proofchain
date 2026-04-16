import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

// This endpoint is polled by the PWA service worker to check connectivity
// and confirm queued submissions were received
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ online: true, userId: user.userId });
  } catch {
    return NextResponse.json({ online: false }, { status: 200 });
  }
}