import dotenv from "dotenv";
import path from "path";
import Groq from "groq-sdk";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testGroqVision() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  // A verified 2x2 pixel solid color base64 PNG string
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAFElEQVQIW2P8z8AARAwMjAxQAAAAMgAD+H5t6QAAAABJRU5ErkJggg==";
  
  try {
    console.log("Calling Groq Qwen 3.6 Vision with base64...");
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is this image? Reply in 3 words." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${dummyBase64}`
              }
            }
          ]
        }
      ]
    });
    console.log("Groq Qwen Success! Response:", response.choices[0].message.content);
  } catch (err: any) {
    console.error("Groq Qwen Error:", err);
  }
}

testGroqVision();
