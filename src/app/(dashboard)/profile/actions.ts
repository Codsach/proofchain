"use server";

import { v2 as cloudinary } from "cloudinary";
import { getServerSessionUser } from "@/lib/server-session";
import { connectDB } from "@/lib/db";
import UserProfile from "@/lib/models/UserProfile";
import User from "@/lib/models/User";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export async function uploadAvatar(formData: FormData) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("avatar") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "proofchain/avatars", format: "webp", transformation: [{ width: 256, height: 256, crop: "fill" }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const url = (uploadResult as any).secure_url;

    // Update DB
    await connectDB();
    await UserProfile.findOneAndUpdate(
      { userId: session.id },
      { avatarUrl: url },
      { upsert: true, new: true }
    );

    return { success: true, url };
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return { success: false, error: error.message || "Failed to upload avatar" };
  }
}

export async function updateDossier(data: { phoneNumber?: string; department?: string; location?: string }) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      throw new Error("Unauthorized");
    }

    await connectDB();
    await UserProfile.findOneAndUpdate(
      { userId: session.id },
      { $set: data },
      { upsert: true, new: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Update dossier error:", error);
    return { success: false, error: error.message || "Failed to update dossier" };
  }
}
