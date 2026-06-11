import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/lib/models/Notification";
import { withAuth, JWTPayload } from "@/lib/auth";

async function markAsRead(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, recipientId: user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[markAsRead]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = withAuth(markAsRead, ["investigator", "analyst", "admin"]);
