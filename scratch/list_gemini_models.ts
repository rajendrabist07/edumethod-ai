import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined in environment.");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Available Gemini Models:");
    if (data.models) {
      data.models.forEach((m: any) => console.log(`- ${m.name}`));
    } else {
      console.log("No models returned:", data);
    }
  } catch (err) {
    console.error("Error listing Gemini models:", err);
  }
}

listModels();
