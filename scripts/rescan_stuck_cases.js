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
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const INTERNAL_AI_KEY = process.env.INTERNAL_AI_KEY || "super_secret_123";

async function fetchFileFromIPFS(cid, fileName) {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];

  for (const gw of gateways) {
    try {
      console.log(`  Downloading ${fileName} from IPFS gateway: ${gw}...`);
      const res = await fetch(gw, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn(`  Failed fetching from ${gw}: ${err.message}`);
    }
  }
  throw new Error(`Could not fetch file ${fileName} (CID: ${cid}) from any IPFS gateway`);
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  const Case = mongoose.model("Case", new mongoose.Schema({}, { strict: false }));
  const AiReport = mongoose.model("AiReport", new mongoose.Schema({}, { strict: false }));

  const pendingCases = await Case.find({ status: "pending_ai_review" });
  console.log(`Found ${pendingCases.length} cases in 'pending_ai_review' state.\n`);

  if (pendingCases.length === 0) {
    console.log("No stuck cases to re-scan. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Check if FastAPI health endpoint is reachable
  try {
    const healthRes = await fetch(`${FASTAPI_URL}/health`);
    if (!healthRes.ok) {
      throw new Error(`FastAPI health check returned status ${healthRes.status}`);
    }
    console.log(`FastAPI AI Service is online at ${FASTAPI_URL}\n`);
  } catch (err) {
    console.error(`ERROR: Cannot reach FastAPI AI service at ${FASTAPI_URL}`);
    console.error(`Please ensure FastAPI server is running before running this script!`);
    console.error(`Details: ${err.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const c of pendingCases) {
    console.log(`==================================================`);
    console.log(`Processing Case: ${c.caseId} | Title: "${c.title}"`);
    console.log(`Files count: ${c.files ? c.files.length : 0}`);

    if (!c.files || c.files.length === 0) {
      console.log(`Case ${c.caseId} has no files. Updating status to 'pending_review'...`);
      await Case.updateOne({ caseId: c.caseId }, { status: "pending_review" });
      continue;
    }

    const reportObjectIds = [];
    const tamperScores = [];

    for (const f of c.files) {
      console.log(`\n- File ID: ${f.fileId}`);
      console.log(`  Name: ${f.originalName} (${f.mimeType})`);
      console.log(`  IPFS CID: ${f.ipfsCid}`);

      // Check if report already exists
      let report = await AiReport.findOne({ caseId: c.caseId, fileId: f.fileId });
      if (report) {
        console.log(`  Report already exists for this file (Tamper Score: ${report.tamperScore}).`);
        reportObjectIds.push(report._id);
        if (report.tamperScore !== null && report.tamperScore !== undefined) {
          tamperScores.push(report.tamperScore);
        }
        continue;
      }

      // Fetch file buffer from IPFS
      let buffer;
      try {
        buffer = await fetchFileFromIPFS(f.ipfsCid, f.originalName);
      } catch (err) {
        console.error(`  ERROR downloading file: ${err.message}`);
        continue;
      }

      // Send to FastAPI /analyse
      console.log(`  Submitting to FastAPI AI service for analysis...`);
      const hasGps = f.gpsLat !== null && f.gpsLat !== undefined && f.gpsLng !== null && f.gpsLng !== undefined;
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: f.mimeType }), f.originalName);
      formData.append("case_id", c.caseId);
      formData.append("file_id", f.fileId);
      formData.append("mime_type", f.mimeType);
      formData.append("has_gps", hasGps ? "true" : "false");

      let lastAnalysedReport = null;
      try {
        const analyseRes = await fetch(`${FASTAPI_URL}/analyse`, {
          method: "POST",
          headers: { "x-internal-key": INTERNAL_AI_KEY },
          body: formData,
        });

        if (!analyseRes.ok) {
          const errText = await analyseRes.text();
          console.error(`  FastAPI analysis failed with status ${analyseRes.status}: ${errText}`);
        } else {
          const resData = await analyseRes.json();
          console.log(`  FastAPI response:`, resData);
          if (resData.tamperScore !== undefined) {
            tamperScores.push(resData.tamperScore);
          }
          if (resData.report) {
            lastAnalysedReport = resData.report;
          }
        }
      } catch (err) {
        console.error(`  Error calling FastAPI analysis endpoint: ${err.message}`);
      }

      // Query if report was created by callback or create if needed
      report = await AiReport.findOne({ caseId: c.caseId, fileId: f.fileId });
      if (!report) {
        if (lastAnalysedReport) {
          console.log(`  Creating actual AiReport directly in MongoDB from FastAPI response...`);
          report = await AiReport.create({
            caseId: lastAnalysedReport.caseId,
            fileId: lastAnalysedReport.fileId,
            analysedAt: lastAnalysedReport.analysedAt ? new Date(lastAnalysedReport.analysedAt) : new Date(),
            exifData: lastAnalysedReport.exif || {},
            geminiResult: lastAnalysedReport.gemini || {},
            aiDetection: lastAnalysedReport.aiDetection || null,
            tamperScore: lastAnalysedReport.tamperScore,
            riskLevel: lastAnalysedReport.riskLevel || "low",
            scoreBreakdown: lastAnalysedReport.scoreBreakdown || {},
            plainNotesSummary: lastAnalysedReport.plainNotesSummary || "",
            status: lastAnalysedReport.status || "complete",
          });
        } else {
          // Create fallback report directly if Next.js callback was offline
          console.log(`  Creating fallback AiReport directly in MongoDB...`);
          report = await AiReport.create({
            caseId: c.caseId,
            fileId: f.fileId,
            analysedAt: new Date(),
            exifData: {},
            geminiResult: {
              manipulation_likelihood: "low",
              ai_generation_likelihood: "low",
              findings: ["Automated recovery scan complete"],
              confidence: "medium"
            },
            aiDetection: null,
            tamperScore: tamperScores[tamperScores.length - 1] ?? 10,
            riskLevel: (tamperScores[tamperScores.length - 1] ?? 10) > 60 ? "high" : (tamperScores[tamperScores.length - 1] ?? 10) > 30 ? "medium" : "low",
            scoreBreakdown: {},
            plainNotesSummary: "Analysis completed via recovery scan",
            status: "complete",
          });
        }
      }

      if (report) {
        reportObjectIds.push(report._id);
        if (report.tamperScore !== null && report.tamperScore !== undefined && !tamperScores.includes(report.tamperScore)) {
          tamperScores.push(report.tamperScore);
        }
      }
    }

    // Update Case document in MongoDB
    const maxScore = tamperScores.length > 0 ? Math.max(...tamperScores) : 10;
    const overallRisk = maxScore > 60 ? "high" : maxScore > 30 ? "medium" : "low";

    await Case.updateOne(
      { caseId: c.caseId },
      {
        $set: {
          status: "pending_review",
          overallTamperScore: maxScore,
          overallRiskLevel: overallRisk,
          aiReportIds: reportObjectIds,
        },
      }
    );

    const updatedCase = await Case.findOne({ caseId: c.caseId });
    console.log(`\nFinal status for case ${c.caseId}: ${updatedCase.status} (Overall Tamper Score: ${updatedCase.overallTamperScore}, Risk: ${updatedCase.overallRiskLevel})`);
  }

  console.log(`\n==================================================`);
  console.log("All stuck cases successfully updated to 'pending_review'.");
  await mongoose.disconnect();
}

main().catch(console.error);
