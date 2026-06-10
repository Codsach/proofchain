import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import { normalizeEmail } from "./schemas/auth";

// Global cache to prevent multiple connections in Next.js dev hot-reload
declare global {
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global._mongooseCache;
let bootstrapPromise: Promise<void> | null = null;
let userIndexesPromise: Promise<void> | null = null;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    await ensureUserIndexes();
    await ensureBootstrapAdmin();
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  await ensureUserIndexes();
  await ensureBootstrapAdmin();

  return cached.conn;
}

async function ensureUserIndexes(): Promise<void> {
  if (userIndexesPromise) {
    await userIndexesPromise;
    return;
  }

  userIndexesPromise = User.syncIndexes()
    .then(() => undefined)
    .catch((err) => {
      userIndexesPromise = null;
      throw err;
    });

  await userIndexesPromise;
}

async function ensureBootstrapAdmin(): Promise<void> {
  if (bootstrapPromise) {
    await bootstrapPromise;
    return;
  }

  bootstrapPromise = seedAdminIfMissing().catch((err) => {
    console.error("[bootstrap/admin]", err);
  });

  await bootstrapPromise;
}

async function seedAdminIfMissing(): Promise<void> {
  const adminExists = await User.exists({ role: "admin" });
  if (adminExists) {
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const rawEmail =
    process.env.SEED_ADMIN_EMAIL ?? (isProduction ? null : "admin@proofchain.local");
  const fullName =
    process.env.SEED_ADMIN_FULL_NAME ?? (isProduction ? null : "ProofChain Admin");
  const password = process.env.SEED_ADMIN_PASSWORD ?? (isProduction ? null : "Admin@12345");

  if (!rawEmail || !fullName || !password) {
    return;
  }

  const email = normalizeEmail(rawEmail);

  const existingUser = await User.findOne({ email, role: "admin" }).select("role").lean();
  if (existingUser) {
    console.warn(`[bootstrap/admin] Skipped seeding because admin account ${email} exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    email,
    passwordHash,
    fullName,
    role: "admin",
    isVerified: true,
    isActive: true,
  });

  console.info(`[bootstrap/admin] Seeded admin account: ${email}`);
}

export async function pingDatabase() {
  const mongoose = await connectDB();
  return { status: mongoose.connection.readyState === 1 ? "connected" : "disconnected" };
}
