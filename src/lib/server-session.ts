import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { verifyRefreshToken } from "@/lib/auth";
import User, { UserRole } from "@/lib/models/User";

type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

type RequireUserOptions = {
  allowedRoles?: UserRole[];
  loginPath?: string;
  unauthorizedRedirect?: string;
};

export const getServerSessionUser = cache(async (): Promise<SessionUser | null> => {
  const refreshToken = (await cookies()).get("refreshToken")?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    await connectDB();
    const user = await User.findById(payload.userId)
      .select("email fullName role isActive isVerified")
      .lean();

    if (!user || !user.isActive || !user.isVerified) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  } catch {
    return null;
  }
});

export async function requireServerUser({
  allowedRoles,
  loginPath = "/login",
  unauthorizedRedirect = loginPath,
}: RequireUserOptions = {}) {
  const user = await getServerSessionUser();

  if (!user) {
    redirect(loginPath);
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(unauthorizedRedirect);
  }

  return user;
}
