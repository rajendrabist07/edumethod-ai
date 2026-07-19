import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testAll() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
  ];
  
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAFElEQVQIW2P8z8AARAwMjAxQAAAAMgAD+H5t6QAAAABJRU5ErkJggg==";
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
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
      console.log(`✅ Success for ${m}! Response: "${result.response.text().trim()}"`);
    } catch (err: any) {
      console.log(`❌ Fail for ${m}. Error:`, err.message || err);
    }
  }
}

testAll();
