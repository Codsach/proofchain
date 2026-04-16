import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Case from "@/lib/models/Case";
import Verdict, { Transfer } from "@/lib/models/Verdict";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const PatchSchema = z.object({
  isActive: z.boolean(),
});

async function patchUser(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { id: userId } = await ctx.params;
    const body = await req.json();

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
    }

    // Prevent admin deactivating themselves
    if (userId === user.userId) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const target = await User.findByIdAndUpdate(
      userId,
      { isActive: parsed.data.isActive },
      { new: true }
    ).select("email fullName isActive role");

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "user.deactivate",
      targetType: "user",
      targetId: userId,
      ipAddress: getIp(req),
      metadata: { isActive: parsed.data.isActive },
    });

    return NextResponse.json({
      message: `Account ${parsed.data.isActive ? "activated" : "deactivated"}`,
      user: { id: target._id, email: target.email, isActive: target.isActive },
    });
  } catch (err) {
    console.error("[admin/users/patch]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function deleteUser(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { id: userId } = await ctx.params;

    if (userId === user.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const target = await User.findById(userId).select("email fullName role");
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { error: "Administrator accounts cannot be deleted" },
        { status: 403 }
      );
    }

    const [investigatorCaseCount, custodianCaseCount, verdictCount, transferCount] =
      await Promise.all([
        Case.countDocuments({ investigatorId: userId }),
        Case.countDocuments({ currentCustodian: userId }),
        Verdict.countDocuments({ analystId: userId }),
        Transfer.countDocuments({
          $or: [{ fromUserId: userId }, { toUserId: userId }],
        }),
      ]);

    if (
      investigatorCaseCount > 0 ||
      custodianCaseCount > 0 ||
      verdictCount > 0 ||
      transferCount > 0
    ) {
      return NextResponse.json(
        {
          error:
            "This user cannot be deleted because forensic records still reference the account. Deactivate the account instead.",
          details: {
            investigatorCaseCount,
            custodianCaseCount,
            verdictCount,
            transferCount,
          },
        },
        { status: 409 }
      );
    }

    await User.findByIdAndDelete(userId);

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "user.delete",
      targetType: "user",
      targetId: userId,
      ipAddress: getIp(req),
      metadata: {
        email: target.email,
        fullName: target.fullName,
        role: target.role,
      },
    });

    return NextResponse.json({
      message: "User deleted successfully",
      user: {
        id: userId,
        email: target.email,
        fullName: target.fullName,
        role: target.role,
      },
    });
  } catch (err) {
    console.error("[admin/users/delete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = withAuth(patchUser, ["admin"]);
export const DELETE = withAuth(deleteUser, ["admin"]);
