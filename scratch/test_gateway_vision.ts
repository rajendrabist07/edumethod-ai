import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testGatewayVision() {
  console.log("🚀 Testing AI Gateway Vision Stream...\n");
  const { aiGateway } = await import("../lib/ai/gateway");
  
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0yAAAAFElEQVQIW2P8z8AARAwMjAxQAAAAMgAD+H5t6QAAAABJRU5ErkJggg==";
  
  let outputText = "";
  try {
    const result = await aiGateway.visionStream(
      {
        message: "Describe this image in 3 words.",
        imageBase64: dummyBase64,
        mimeType: "image/png"
      },
      (chunk) => {
        outputText += chunk;
        process.stdout.write(chunk);
      }
    );
    console.log("\n\n✅ Success! Response text:", outputText.trim());
    console.log("Prompt tokens:", result.promptTokens, "Completion tokens:", result.completionTokens);
  } catch (err: any) {
    console.error("\n❌ Gateway Vision stream failed:", err);
  }
}

testGatewayVision();
