import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/lib/models/Notification";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getNotifications(req: NextRequest, ctx: any, user: JWTPayload) {
  try {
    await connectDB();
    const notifications = await NotificationModel.find({ recipientId: user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[getNotifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getNotifications, ["investigator", "analyst", "admin"]);
