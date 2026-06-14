const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://codsach:CVaSCYKV3RRNO06g@ac-4n5aesx-shard-00-00.xpy4x0p.mongodb.net:27017,ac-4n5aesx-shard-00-01.xpy4x0p.mongodb.net:27017,ac-4n5aesx-shard-00-02.xpy4x0p.mongodb.net:27017/?ssl=true&replicaSet=atlas-9ie7l8-shard-0&authSource=admin&appName=Codsach";

const CaseSchema = new mongoose.Schema({}, { strict: false });
const Case = mongoose.models.Case || mongoose.model("Case", CaseSchema);

async function fix() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");
    
    const result = await Case.updateMany(
      { status: { $in: ["pending_ai_review", "pending_review"] } },
      { $set: { status: "archived" } }
    );
    console.log(`Updated ${result.modifiedCount} stuck cases to 'ai_timeout'.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
