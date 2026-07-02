import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import Comment from "@/lib/models/Comment";
import User from "@/lib/models/User";
import { withAuth, JWTPayload } from "@/lib/auth";

// GET /api/cases/[id]/comments
async function getComments(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();
    const { id: caseId } = await ctx.params;

    // Check if the case exists
    const caseDoc = await Case.findOne({ caseId }).select("investigatorId");
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Access control: if investigator, verify they own the case
    if (user.role === "investigator" && caseDoc.investigatorId.toString() !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build filter
    const filter: Record<string, any> = { caseId, deletedAt: null };
    if (user.role === "investigator") {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter).sort({ createdAt: 1 }).lean();
    return NextResponse.json(comments);
  } catch (err) {
    console.error("[comments/get]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cases/[id]/comments
async function createComment(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();
    const { id: caseId } = await ctx.params;
    const body = await req.json();

    const { content } = body;
    let isInternal = body.isInternal === true;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Comment content must be under 2000 characters" }, { status: 400 });
    }

    // Check if case exists
    const caseDoc = await Case.findOne({ caseId }).select("investigatorId");
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Access control: if investigator, verify they own the case and force isInternal=false
    if (user.role === "investigator") {
      if (caseDoc.investigatorId.toString() !== user.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      isInternal = false;
    }

    // Fetch author details to store on comment
    const authorUser = await User.findById(user.userId).select("fullName");
    if (!authorUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const newComment = await Comment.create({
      caseId,
      authorId: user.userId,
      authorRole: user.role,
      authorName: authorUser.fullName,
      content: content.trim(),
      isInternal,
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (err) {
    console.error("[comments/post]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getComments, ["investigator", "analyst", "admin"]);
export const POST = withAuth(createComment, ["investigator", "analyst", "admin"]);
