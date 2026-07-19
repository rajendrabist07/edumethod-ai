import dotenv from "dotenv";
import path from "path";

// Configure environment
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function runTest() {
  console.log("🚀 Starting AI Gateway Verification Test...\n");

  const { aiGateway } = await import("../lib/ai/gateway");

  console.log("🟢 1. Testing Standard Chat Generation (No failover)...");
  try {
    const result = await aiGateway.chat({
      messages: [{ role: "user", content: "Hello! Answer in one word." }],
    });
    console.log(`✅ Success! Response: "${result.text.trim()}"`);
    console.log(`Prompt tokens: ${result.promptTokens}, Completion tokens: ${result.completionTokens}\n`);
  } catch (err: any) {
    console.error("❌ Failed Chat Generation:", err);
  }

  console.log("🟡 2. Testing Gateway Automatic Fallback Routing...");
  try {
    // Config list with two invalid models first, then a valid fallback model
    const testConfigs: any[] = [
      { provider: "groq", model: "non-existent-llama-model-fake-1" },
      { provider: "gemini", model: "non-existent-gemini-model-fake-2" },
      { provider: "groq", model: "llama-3.3-70b-versatile" }, // Good fallback
    ];

    console.log("Sending query through fallback config queue (expecting 2 warnings, then success)...");
    const result = await aiGateway.chat(
      {
        messages: [{ role: "user", content: "Hello! Answer in one word." }],
      },
      "test-user-id",
      testConfigs
    );
    console.log(`✅ Fallback Success! Response: "${result.text.trim()}"`);
    console.log(`Successfully completed via fallback routing!\n`);
  } catch (err: any) {
    console.error("❌ Fallback test failed:", err);
  }
  
  console.log("🟢 3. Testing Streaming chat fallbacks...");
  try {
    let outputText = "";
    await aiGateway.chatStream(
      {
        messages: [{ role: "user", content: "Count 1 to 3 in digits." }],
      },
      (chunk) => {
        outputText += chunk;
      }
    );
    console.log(`✅ Stream Success! Final response text: "${outputText.trim()}"\n`);
  } catch (err: any) {
    console.error("❌ Stream test failed:", err);
  }

  console.log("🏁 All gateway tests complete!");
}

runTest();
