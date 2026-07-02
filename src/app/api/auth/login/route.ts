import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import UserProfile from "@/lib/models/UserProfile";
import { LoginSchema } from "@/lib/schemas/auth";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  getIp,
  signMfaToken,
  setTrustedDeviceCookie,
} from "@/lib/auth";
import { logAction } from "@/lib/audit";
import crypto from "crypto";

const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // 1. Validate — only email + password accepted, no role from client
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 2. Fetch ALL users by email (since email+role is unique)
    const users = await User.find({ email }).select(
      "+passwordHash +loginAttempts +lockUntil"
    ).sort({ role: 1 }); // admin (a), analyst (an), investigator (i)

    if (!users || users.length === 0) {
      // Run bcrypt anyway to prevent timing attacks / user enumeration
      await bcrypt.hash("dummy_constant_string", 12);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let matchedUser = null;
    let lockedUser = null;

    for (const u of users) {
      // 3. Check lockout
      if (u.lockUntil && u.lockUntil > new Date()) {
        lockedUser = u;
        continue;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, u.passwordHash);
      if (passwordMatch) {
        matchedUser = u;
        break;
      } else {
        u.loginAttempts = (u.loginAttempts ?? 0) + 1;
        if (u.loginAttempts >= MAX_ATTEMPTS) {
          u.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
          u.loginAttempts = 0;
        }
        await u.save();
      }
    }

    if (!matchedUser) {
      if (lockedUser) {
        const minutesLeft = Math.ceil(
          (lockedUser.lockUntil!.getTime() - Date.now()) / 60_000
        );
        return NextResponse.json(
          {
            error: `Account locked. Try again in ${minutesLeft} minute${
              minutesLeft !== 1 ? "s" : ""
            }.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = matchedUser; // TypeScript now knows matchedUser is not null

    // 3. Check account status
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Contact your administrator." },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    // 6. Reset attempt counter on success
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // 7. Check if MFA is enabled
    if (user.mfaEnabled) {
      const trustedDeviceCookie = req.cookies.get("trustedDevice")?.value;
      let bypassMfa = false;

      if (trustedDeviceCookie && user.trustedDevices) {
        const hashedToken = crypto.createHash("sha256").update(trustedDeviceCookie).digest("hex");
        const validDevice = user.trustedDevices.find(
          (d: any) => d.deviceTokenHash === hashedToken && d.expiresAt > new Date()
        );
        if (validDevice) {
          bypassMfa = true;
        }
      }

      if (!bypassMfa) {
        const mfaToken = signMfaToken({ userId: user._id.toString() });
        return NextResponse.json({
          requiresMfa: true,
          mfaToken,
        });
      }
    }

    // 8. Build token payload — role is ALWAYS taken from DB here
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,   // ← from DB, never from request body
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // 9. Determine redirect path by role — computed server-side
    const redirectMap: Record<string, string> = {
      admin:         "/admin",
      analyst:       "/analyst",
      investigator:  "/investigator",
    };
    const redirectTo = redirectMap[user.role] ?? "/";

    // 10. Audit log
    await logAction({
      actorId: user._id.toString(),
      actorRole: user.role,
      actionType: "user.login",
      targetType: "user",
      targetId: user._id.toString(),
      ipAddress: getIp(req),
    });

    // 11. Build response — refresh token in httpOnly cookie
    const profile = await UserProfile.findOne({ userId: user._id });
    const res = NextResponse.json({
      accessToken,
      redirectTo,           // ← frontend just follows this, doesn't decide it
      user: {
        id:       user._id.toString(),
        email:    user.email,
        fullName: user.fullName,
        role:     user.role,
        avatarUrl: profile?.avatarUrl || null,
      },
    });

    // Track active session
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    if (!user.trustedDevices) user.trustedDevices = [];
    user.trustedDevices.push({ deviceTokenHash: hashedToken, expiresAt });
    if (user.trustedDevices.length > 5) {
      user.trustedDevices = user.trustedDevices.slice(-5);
    }
    await user.save();

    setTrustedDeviceCookie(res, rawToken);
    setRefreshCookie(res, refreshToken);
    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
