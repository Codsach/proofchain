import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { RegisterSchema, normalizeEmail } from "@/lib/schemas/auth";
import { logAction } from "@/lib/audit";
import { getIp } from "@/lib/auth";
import { EmailDeliveryError, buildAppUrl, sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getVerificationEmailHtml(fullName: string, verifyUrl: string) {
  const safeName = escapeHtml(fullName);

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #00C9A7;">ProofChain</h2>
      <p>Hi ${safeName},</p>
      <p>Please verify your email to activate your account.</p>
      <a href="${verifyUrl}" 
         style="display:inline-block;background:#00C9A7;color:#000;padding:12px 24px;
                text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0;">
        Verify Email
      </a>
      <p style="word-break: break-all; color: #666; font-size: 12px;">
        If the button does not work, copy and paste this link into your browser:<br />
        <a href="${verifyUrl}">${verifyUrl}</a>
      </p>
      <p style="color:#888;font-size:12px;">
        This link expires in 24 hours. If you did not create an account, ignore this email.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // 1. Validate input
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    // 2. Check if this investigator account already exists
    const existing = await User.findOne({
      email: normalizedEmail,
      role: "investigator",
    });
    if (existing?.isVerified) {
      return NextResponse.json(
        { error: "An investigator account with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 5. Create or refresh the unverified user so they can request a new email.
    const wasExistingUnverifiedUser = Boolean(existing);
    const user = existing
      ? await existing
          .set({
            passwordHash,
            fullName,
            emailVerifyToken,
            emailVerifyExpires,
          })
          .save()
      : await User.create({
          email: normalizedEmail,
          passwordHash,
          fullName,
          role: "investigator", // default role; analyst/admin created by admin
          isVerified: false,
          emailVerifyToken,
          emailVerifyExpires,
        });

    // 6. Send verification email
    const verifyUrl = buildAppUrl("/api/auth/verify-email", req, {
      token: emailVerifyToken,
      id: user._id.toString(),
    });

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your ProofChain account",
        html: getVerificationEmailHtml(fullName, verifyUrl),
      });
    } catch (error) {
      console.error("[register] verification email send failed", error);

      if (!wasExistingUnverifiedUser) {
        await User.findByIdAndDelete(user._id).catch((cleanupError) => {
          console.error("[register] failed to remove user after email error", cleanupError);
        });
      }

      const message =
        error instanceof EmailDeliveryError
          ? error.message
          : "We couldn't send the verification email. Please try again.";

      return NextResponse.json({ error: message }, { status: 502 });
    }

    // 7. Log the action
    await logAction({
      actorId: user._id.toString(),
      actorRole: "investigator",
      actionType: "user.register",
      targetType: "user",
      targetId: user._id.toString(),
      ipAddress: getIp(req),
      metadata: {
        email: normalizedEmail,
        verificationEmail: wasExistingUnverifiedUser ? "resent" : "sent",
      },
    });

    return NextResponse.json(
      {
        message: wasExistingUnverifiedUser
          ? "Verification email resent. Check your inbox to verify your account."
          : "Account created. Check your email to verify.",
      },
      { status: wasExistingUnverifiedUser ? 200 : 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
