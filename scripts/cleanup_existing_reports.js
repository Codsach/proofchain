import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file manually
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valParts] = trimmed.split("=");
      const val = valParts.join("=").trim();
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://codsach:CVaSCYKV3RRNO06g@ac-4n5aesx-shard-00-00.xpy4x0p.mongodb.net:27017,ac-4n5aesx-shard-00-01.xpy4x0p.mongodb.net:27017,ac-4n5aesx-shard-00-02.xpy4x0p.mongodb.net:27017/?ssl=true&replicaSet=atlas-9ie7l8-shard-0&authSource=admin&appName=Codsach";

function sanitizeErrorMessage(msg) {
  if (!msg) return msg;
  const winPathRx = /[a-zA-Z]:\\[^\s:|]+(?:\\[^\s:|]+)*/g;
  const unixPathRx = /\/[^\s:|]+(?:\/[^\s:|]+)+/g;

  let sanitized = msg.replace(winPathRx, (match) => {
    return match.substring(match.lastIndexOf("\\") + 1);
  });
  sanitized = sanitized.replace(unixPathRx, (match) => {
    return match.substring(match.lastIndexOf("/") + 1);
  });
  return sanitized;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.\n");

  const Case = mongoose.model("Case", new mongoose.Schema({}, { strict: false }));
  const AiReport = mongoose.model("AiReport", new mongoose.Schema({}, { strict: false }));

  // 0. Repair potential /100 -> 100 corruptions from previous run
  const corruptedReports = await AiReport.find({ plainNotesSummary: /Tamper score: \d+100/ });
  let repairedCount = 0;
  for (const report of corruptedReports) {
    const original = report.plainNotesSummary;
    const repaired = original.replace(/Tamper score: (\d+)100/, "Tamper score: $1/100");
    if (original !== repaired) {
      console.log(`Repaired /100 formatting for case ${report.caseId}, file ${report.fileId}:`);
      console.log(`  OLD: ${original}`);
      console.log(`  NEW: ${repaired}`);
      await AiReport.updateOne({ _id: report._id }, { $set: { plainNotesSummary: repaired } });
      repairedCount++;
    }
  }
  console.log(`Repaired ${repairedCount} corrupted reports.\n`);

  // 1. Sanitize error paths in existing reports
  const allReports = await AiReport.find({});
  let sanitizedCount = 0;

  for (const report of allReports) {
    if (report.plainNotesSummary) {
      const original = report.plainNotesSummary;
      const sanitized = sanitizeErrorMessage(original);

      if (original !== sanitized) {
        console.log(`Sanitizing report for case ${report.caseId}, file ${report.fileId}:`);
        console.log(`  OLD: ${original}`);
        console.log(`  NEW: ${sanitized}`);
        await AiReport.updateOne({ _id: report._id }, { $set: { plainNotesSummary: sanitized } });
        sanitizedCount++;
      }
    }
  }
  console.log(`\nSanitized ${sanitizedCount} reports containing file paths.\n`);

  // 2. Identify placeholder reports and reset cases
  const fallbackReports = await AiReport.find({ plainNotesSummary: "Analysis completed via recovery scan" });
  console.log(`Found ${fallbackReports.length} placeholder reports to reset.`);

  for (const r of fallbackReports) {
    console.log(`Resetting case ${r.caseId} (file ${r.fileId}) to pending_ai_review...`);
    
    // Delete the placeholder report
    await AiReport.deleteOne({ _id: r._id });

    // Update the Case document: status back to pending_ai_review, and pull report ID
    await Case.updateOne(
      { caseId: r.caseId },
      {
        $set: { status: "pending_ai_review" },
        $pull: { aiReportIds: r._id }
      }
    );
  }

  console.log("\nCleanup completed.");
  await mongoose.disconnect();
}

main().catch(console.error);
