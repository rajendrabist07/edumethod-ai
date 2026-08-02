import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "placeholder-gemini-key");

export const geminiVisionModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});