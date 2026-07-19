import dotenv from "dotenv";
import path from "path";
import Groq from "groq-sdk";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function listModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const models = await groq.models.list();
  console.log("Active models on Groq:");
  models.data.forEach((m) => console.log(`- ${m.id}`));
}

listModels();
