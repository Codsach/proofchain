// Test script to run database verification
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Setup env variables manually since this is running outside next context
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

// Inline model definition for test script
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: "investigator" },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const email = "test-reset-flow@proofchain.local";

  // Clean up any old test users
  await User.deleteMany({ email });

  // 1. Create a test user
  const initialPassword = "Password@123";
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const user = await User.create({
    email,
    passwordHash,
    fullName: "Test Reset Investigator",
    role: "investigator",
  });

  console.log("Created test user:", user.email);

  // 2. Generate a forgot password token
  const plainToken = crypto.randomUUID();
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

  console.log("Generated Plain Token:", plainToken);
  console.log("Generated Hashed Token:", hashedToken);

  // 3. Update User Document
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiry;
  await user.save();
  console.log("Saved reset token and expiry in DB.");

  // 4. Verify Lookup logic (simulate POST /api/auth/reset-password query)
  const lookupUser = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!lookupUser) {
    throw new Error("Failed to find user with hashed token and valid expiration!");
  }
  console.log("Lookup user found:", lookupUser.email);
  console.log("Confirming values match...");
  console.log("Is token matched?", lookupUser.passwordResetToken === hashedToken);
  console.log("Is expiry valid?", lookupUser.passwordResetExpires > new Date());

  // 5. Reset Password (simulate reset password step)
  const newPassword = "NewPassword@123";
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  lookupUser.passwordHash = newPasswordHash;
  lookupUser.passwordResetToken = null;
  lookupUser.passwordResetExpires = null;
  await lookupUser.save();
  console.log("Password reset successfully. Reset fields cleared.");

  // 6. Confirm reset changes in database
  const updatedUser = await User.findById(lookupUser._id);
  console.log("Verify reset fields in DB:");
  console.log("Reset Token (should be null):", updatedUser.passwordResetToken);
  console.log("Reset Expires (should be null):", updatedUser.passwordResetExpires);

  const compareOld = await bcrypt.compare(initialPassword, updatedUser.passwordHash);
  const compareNew = await bcrypt.compare(newPassword, updatedUser.passwordHash);
  console.log("Does old password work? (should be false):", compareOld);
  console.log("Does new password work? (should be true):", compareNew);

  if (compareOld || !compareNew) {
    throw new Error("Password hashing update failed!");
  }

  // Cleanup
  await User.findByIdAndDelete(updatedUser._id);
  console.log("Cleaned up test user.");

  await mongoose.disconnect();
  console.log("Test completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
