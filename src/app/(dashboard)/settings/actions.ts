"use server";

import { getServerSessionUser } from "@/lib/server-session";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { notifyPasswordChange } from "@/lib/email";

export async function updateAccountDetails(data: { fullName: string; email: string }) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    
    // Check if the new email is already in use by someone else
    if (data.email !== session.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error("Email is already in use");
      }
    }

    await User.findByIdAndUpdate(session.id, {
      fullName: data.fullName,
      email: data.email
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update account details error:", error);
    return { success: false, error: error.message || "Failed to update account details" };
  }
}

export async function changePassword(data: { oldPassword?: string; newPassword: string }) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    const user = await User.findById(session.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify old password
    if (data.oldPassword) {
      const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
      if (!isMatch) {
        throw new Error("Incorrect old password");
      }
    } else {
      // If no old password provided but user has a password hash, require it
      if (user.passwordHash) {
         throw new Error("Old password is required");
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    await User.findByIdAndUpdate(session.id, {
      passwordHash: hashedPassword
    });

    try {
      await notifyPasswordChange(user.email, user.fullName);
    } catch (emailErr) {
      console.error("Failed to send password change notification email:", emailErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { success: false, error: error.message || "Failed to change password" };
  }
}

export async function revokeDevice(deviceTokenHash: string) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      $pull: { trustedDevices: { deviceTokenHash } }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Revoke device error:", error);
    return { success: false, error: error.message || "Failed to revoke device" };
  }
}

export async function deactivateAccount() {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      isActive: false
    });

    return { success: true };
  } catch (error: any) {
    console.error("Deactivate account error:", error);
    return { success: false, error: error.message || "Failed to deactivate account" };
  }
}
