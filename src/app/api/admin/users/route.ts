import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { EmailDeliveryError, buildAppUrl, sendEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/schemas/auth";
import { z } from "zod";

const CreateAnalystSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().min(2),
  role: z.enum(["analyst", "admin"]).default("analyst"),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAccountCreatedEmailHtml({
  fullName,
  role,
  email,
  tempPassword,
  loginUrl,
}: {
  fullName: string;
  role: "analyst" | "admin";
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const safeName = escapeHtml(fullName);
  const safeRole = escapeHtml(role);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(tempPassword);
  const safeLoginUrl = escapeHtml(loginUrl);

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
      <h2 style="color:#00C9A7;margin-top:0;">ProofChain</h2>
      <p>Hi ${safeName},</p>
      <p>An administrator has created a <strong>${safeRole}</strong> account for you.</p>
      <div style="background:#1C1C28;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Email</p>
        <p style="margin:0 0 16px;">${safeEmail}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Temporary password</p>
        <p style="margin:0;font-family:monospace;font-size:14px;color:#00C9A7;">${safePassword}</p>
      </div>
      <p style="color:#8888AA;font-size:12px;">Please log in and change your password immediately.</p>
      <a href="${safeLoginUrl}"
         style="display:inline-block;background:#00C9A7;color:#000;padding:10px 20px;
                text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
        Log In
      </a>
      <p style="word-break: break-all; color: #8888AA; font-size: 12px; margin-top: 16px;">
        If the button does not work, copy and paste this link into your browser:<br />
        <a href="${safeLoginUrl}" style="color:#7FE7D2;">${safeLoginUrl}</a>
      </p>
    </div>
  `;
}

function getAccountCreatedEmailText({
  fullName,
  role,
  email,
  tempPassword,
  loginUrl,
}: {
  fullName: string;
  role: "analyst" | "admin";
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  return [
    `Hi ${fullName},`,
    "",
    `An administrator has created a ${role} account for you.`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    "",
    "Please log in and change your password immediately.",
    loginUrl,
  ].join("\n");
}

// GET /api/admin/users — list all users
async function listUsers(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, never>> },
  _user: JWTPayload
) {
  try {
    void _ctx;
    void _user;
    await connectDB();
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    const filter: Record<string, unknown> = roleFilter ? { role: roleFilter } : {};
    const users = await User.find(filter)
      .select("-passwordHash -emailVerifyToken -emailVerifyExpires -__v")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users/list]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users — create analyst account
async function createAnalyst(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, never>> },
  user: JWTPayload
) {
  try {
    void _ctx;
    await connectDB();
    const body = await req.json();

    const parsed = CreateAnalystSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, fullName, role } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    const existing = await User.findOne({ email: normalizedEmail, role });
    if (existing) {
      return NextResponse.json(
        { error: `A ${role} account with this email already exists` },
        { status: 409 }
      );
    }

    // Generate a temp password and force reset on first login
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newUser = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName,
      role,
      isVerified: true, // Admin-created accounts skip email verify
      isActive: true,
    });

    const loginUrl = buildAppUrl(role === "admin" ? "/admin/login" : "/login", req);

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your ProofChain account has been created",
        html: getAccountCreatedEmailHtml({
          fullName,
          role,
          email: normalizedEmail,
          tempPassword,
          loginUrl,
        }),
        text: getAccountCreatedEmailText({
          fullName,
          role,
          email: normalizedEmail,
          tempPassword,
          loginUrl,
        }),
      });
    } catch (error) {
      console.error("[admin/users/create] credentials email send failed", error);

      await User.findByIdAndDelete(newUser._id).catch((cleanupError) => {
        console.error(
          "[admin/users/create] failed to remove user after email error",
          cleanupError
        );
      });

      const message =
        error instanceof EmailDeliveryError
          ? error.message
          : "We couldn't send the account email. Please try again.";

      return NextResponse.json({ error: message }, { status: 502 });
    }

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "admin.create_analyst",
      targetType: "user",
      targetId: newUser._id.toString(),
      ipAddress: getIp(req),
      metadata: { email: normalizedEmail, role },
    });

    return NextResponse.json(
      {
        message: "Account created and credentials sent",
        userId: newUser._id.toString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/users/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(listUsers, ["admin"]);
export const POST = withAuth(createAnalyst, ["admin"]);
