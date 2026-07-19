import dotenv from "dotenv";
import path from "path";
import Groq from "groq-sdk";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testGroqVision() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAElEQVR42mP8z8AARAwMjAxQAAAAMgAD+H5t6QAAAABJRU5ErkJggg==";
  
  try {
    console.log("Calling Groq Qwen 3.6 Vision...");
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
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"
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
