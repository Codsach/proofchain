import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./db";
import User, { UserRole } from "./models/User";
import { logAction } from "./audit";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET must be defined");
}

// ── Token shapes ─────────────────────────────────────────────────────────────
export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthedRequest extends NextRequest {
  user: JWTPayload;
}

// ── Sign tokens ──────────────────────────────────────────────────────────────
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

// ── Verify tokens ────────────────────────────────────────────────────────────
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}

// ── Refresh cookie helpers ────────────────────────────────────────────────────
export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });
}

export function clearRefreshCookie(res: NextResponse): void {
  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

// ── withAuth middleware wrapper ───────────────────────────────────────────────
// Usage: export const POST = withAuth(handler, ["analyst", "admin"])
type RouteHandler = (
  req: NextRequest,
  context: unknown,
  user: JWTPayload
) => Promise<NextResponse>;

export function withAuth<TContext>(
  handler: (
    req: NextRequest,
    context: TContext,
    user: JWTPayload
  ) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (
    req: NextRequest,
    context: TContext
  ): Promise<NextResponse> => {
    try {
      // 1. Extract token from Authorization header
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Missing or invalid authorization header" },
          { status: 401 }
        );
      }

      const token = authHeader.split(" ")[1];

      // 2. Verify JWT
      let payload: JWTPayload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return NextResponse.json(
          { error: "Token expired or invalid" },
          { status: 401 }
        );
      }

      // 3. Re-validate role against DB — never trust JWT role blindly
      await connectDB();
      const user = await User.findById(payload.userId).select(
        "role isActive isVerified"
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: "Account is deactivated" },
          { status: 403 }
        );
      }

      if (!user.isVerified) {
        return NextResponse.json(
          { error: "Email not verified" },
          { status: 403 }
        );
      }

      // 4. Check role permissions
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      // 5. Attach fresh role from DB (not JWT) to payload
      const freshPayload: JWTPayload = {
        userId: payload.userId,
        role: user.role,
        email: payload.email,
      };

      return handler(req, context, freshPayload);
    } catch (err) {
      console.error("[withAuth] Unexpected error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// ── withOptionalAuth — for public routes that show more if logged in ──────────
export function withOptionalAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: unknown
  ): Promise<NextResponse> => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      // Pass null-like user for unauthenticated access
      return handler(req, context, { userId: "", role: "investigator", email: "" });
    }

    try {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);
      return handler(req, context, payload);
    } catch {
      return handler(req, context, { userId: "", role: "investigator", email: "" });
    }
  };
}

// ── Get IP from request ───────────────────────────────────────────────────────
export function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function verifyAuth(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
