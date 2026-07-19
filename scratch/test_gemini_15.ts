import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testGemini() {
  console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined in environment.");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // 1x1 transparent pixel base64
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAFElEQVQIW2P8z8AARAwMjAxQAAAAMgAD+H5t6QAAAABJRU5ErkJggg==";
  
  try {
    console.log("Calling Gemini 1.5 Flash Vision...");
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: "What is this image? Reply in 3 words." },
            {
              inlineData: {
                data: dummyBase64,
                mimeType: "image/png"
              }
            }
          ]
        }
      ]
    });
    console.log("Gemini 1.5 Flash Success! Response:", result.response.text());
  } catch (err: any) {
    console.error("Gemini 1.5 Flash Error:", err);
  }
}

testGemini();
