// Test script to run API endpoint validation
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");

require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

// Inline model definition
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: "investigator" },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Waiting 3 seconds for server to ensure it is up...");
  await sleep(3000);

  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to database.");

  const email = "temp-endpoint-test@proofchain.local";
  // Clean up any old test users
  await User.deleteMany({ email });

  // Create a verified investigator user to run the reset flow on
  const initialPassword = "Password@123";
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const testUser = await User.create({
    email,
    passwordHash,
    fullName: "Temp Endpoints Investigator",
    role: "investigator",
    isVerified: true,
  });
  console.log("Created test user:", testUser.email);

  // 1. Test validation on forgot-password
  try {
    console.log("Testing forgot-password validation with invalid email...");
    await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: "invalid-email" });
    throw new Error("Validation succeeded with invalid email!");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log("Success: Validation failed with 400 as expected.");
    } else {
      throw err;
    }
  }

  // 2. Test forgot-password email enumeration mitigation (should return 200 for unregistered email)
  console.log("Testing forgot-password with unregistered email...");
  const nonRegisteredRes = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
    email: "unregistered@proofchain.local",
  });
  if (nonRegisteredRes.status === 200) {
    console.log("Success: Unregistered email returned 200 as expected.");
  } else {
    throw new Error(`Unregistered email returned status ${nonRegisteredRes.status}`);
  }

  // 3. Test forgot-password with registered email
  console.log("Testing forgot-password with registered email...");
  let forgotRes;
  try {
    forgotRes = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
  } catch (err) {
    // If it fails with 502 (e.g. Resend API key is mock/unauthorized), that's acceptable during local test,
    // but let's print and extract the token directly from database to continue reset password test.
    if (err.response && err.response.status === 502) {
      console.log("Note: Email delivery returned 502 (expected in unconfigured environment).");
    } else {
      throw err;
    }
  }

  if (forgotRes && forgotRes.status === 200) {
    console.log("Success: Forgot password request returned 200.");
  }

  // Reload user from DB to get the generated reset token
  const dbUser = await User.findOne({ email });
  const hashedToken = dbUser.passwordResetToken;
  const expiry = dbUser.passwordResetExpires;

  console.log("Hashed Token in DB:", hashedToken);
  console.log("Token Expiration in DB:", expiry);

  if (!hashedToken || !expiry) {
    throw new Error("Token was not generated or saved to DB!");
  }

  // Since we cannot read the plain text token from the email, let's create a known plain token,
  // manually write its SHA-256 hash to the database, and test resetting with it.
  const testPlainToken = crypto.randomUUID();
  const testHashedToken = crypto.createHash("sha256").update(testPlainToken).digest("hex");
  dbUser.passwordResetToken = testHashedToken;
  dbUser.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await dbUser.save();
  console.log("Manually wrote test hashed token to database:", testHashedToken);

  // 4. Test reset-password validation errors (e.g., short password)
  try {
    console.log("Testing reset-password validation with weak password...");
    await axios.post(`${BASE_URL}/api/auth/reset-password`, {
      token: testPlainToken,
      newPassword: "short",
    });
    throw new Error("Weak password was accepted!");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log("Success: Reset password validation failed with 400 as expected.");
    } else {
      throw err;
    }
  }

  // 5. Test reset-password with invalid token
  try {
    console.log("Testing reset-password with invalid token...");
    await axios.post(`${BASE_URL}/api/auth/reset-password`, {
      token: "incorrect-token",
      newPassword: "NewPassword@123",
    });
    throw new Error("Invalid token was accepted!");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log("Success: Reset password with invalid token failed with 400 as expected.");
    } else {
      throw err;
    }
  }

  // 6. Test reset-password with correct token and password
  console.log("Testing reset-password with correct token...");
  const resetRes = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
    token: testPlainToken,
    newPassword: "NewPassword@123",
  });

  if (resetRes.status === 200) {
    console.log("Success: Reset password returned 200.");
  } else {
    throw new Error(`Reset password returned status ${resetRes.status}`);
  }

  // 7. Verify login with new password
  const finalUser = await User.findOne({ email });
  const isOldPasswordMatch = await bcrypt.compare(initialPassword, finalUser.passwordHash);
  const isNewPasswordMatch = await bcrypt.compare("NewPassword@123", finalUser.passwordHash);

  console.log("Old password match check:", isOldPasswordMatch);
  console.log("New password match check:", isNewPasswordMatch);

  if (isOldPasswordMatch || !isNewPasswordMatch) {
    throw new Error("Password was not updated correctly!");
  }

  console.log("Reset fields cleared state (token, expiry):", finalUser.passwordResetToken, finalUser.passwordResetExpires);
  if (finalUser.passwordResetToken !== null || finalUser.passwordResetExpires !== null) {
    throw new Error("Reset fields were not cleared after successful password reset!");
  }

  // Cleanup
  await User.deleteMany({ email });
  await mongoose.disconnect();
  console.log("API Endpoints verification completed successfully!");
}

run().catch((err) => {
  console.error("API Endpoints verification failed:", err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
