const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load MONGODB_URI from .env.local
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("MONGODB_URI=")) {
        MONGODB_URI = line.substring(line.indexOf("=") + 1).trim();
        break;
      }
    }
  }
}

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in environment or .env.local");
  process.exit(1);
}

async function clearCases() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // We protect the user accounts and profiles from deletion
    const protectedCollections = ["users", "userprofiles", "user_profiles", "user"];

    console.log("\n--- Starting database cleanup ---");
    for (const col of collections) {
      const name = col.name;
      
      // Skip system collections and protected auth collections
      if (name.startsWith("system.") || protectedCollections.includes(name.toLowerCase())) {
        console.log(`- Skipping protected/system collection: '${name}'`);
        continue;
      }

      const result = await db.collection(name).deleteMany({});
      console.log(`✓ Cleared collection '${name}': deleted ${result.deletedCount} documents.`);
    }

    console.log("\nSuccess: All case-related database collections have been cleared!");
    process.exit(0);
  } catch (err) {
    console.error("Error during database cleanup:", err);
    process.exit(1);
  }
}

clearCases();
