import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ChatOptions, VisionOptions, ProviderResult } from "./provider-interface";

function resolveGeminiModelName(model: string): string {
  if (
    !model ||
    model === "gemini-2.0-flash" ||
    model === "gemini-2.0-flash-exp" ||
    model === "gemini-2.0-flash-001"
  ) {
    return "gemini-2.5-flash";
  }
  return model;
}

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  async chat(options: ChatOptions, model: string): Promise<ProviderResult> {
    const targetModel = resolveGeminiModelName(model);
    const systemMessage = options.messages.find((m) => m.role === "system")?.content;
    let contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || " " }],
      }));

    if (contents.length === 0) {
      contents = [{ role: "user", parts: [{ text: "Hello" }] }];
    } else if (contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Context:" }] });
    }

    try {
      const modelInstance = this.genAI.getGenerativeModel({
        model: targetModel,
        systemInstruction: systemMessage,
        generationConfig: options.jsonMode ? { responseMimeType: "application/json" } : undefined,
      });

      const result = await modelInstance.generateContent({ contents });
      const response = await result.response;
      const text = response.text() || "";

      return {
        text,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("not found")) {
        console.warn(`[GeminiProvider] Model ${targetModel} 404, falling back to gemini-1.5-flash`);
        const fallbackInstance = this.genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemMessage,
          generationConfig: options.jsonMode ? { responseMimeType: "application/json" } : undefined,
        });
        const result = await fallbackInstance.generateContent({ contents });
        const response = await result.response;
        return {
          text: response.text() || "",
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        };
      }
      throw err;
    }
  }

  async chatStream(
    options: ChatOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
    const targetModel = resolveGeminiModelName(model);
    const systemMessage = options.messages.find((m) => m.role === "system")?.content;
    let contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || " " }],
      }));

    if (contents.length === 0) {
      contents = [{ role: "user", parts: [{ text: "Hello" }] }];
    } else if (contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Context:" }] });
    }

    try {
      const modelInstance = this.genAI.getGenerativeModel({
        model: targetModel,
        systemInstruction: systemMessage,
        generationConfig: options.jsonMode ? { responseMimeType: "application/json" } : undefined,
      });

      const result = await modelInstance.generateContentStream({ contents });
      let fullText = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      const response = await result.response;

      return {
        text: fullText,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("not found")) {
        console.warn(`[GeminiProvider] Stream model ${targetModel} 404, falling back to gemini-1.5-flash`);
        const fallbackInstance = this.genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemMessage,
          generationConfig: options.jsonMode ? { responseMimeType: "application/json" } : undefined,
        });

        const result = await fallbackInstance.generateContentStream({ contents });
        let fullText = "";

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }

        const response = await result.response;
        return {
          text: fullText,
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        };
      }
      throw err;
    }
  }

  async vision(options: VisionOptions, model: string): Promise<ProviderResult> {
    const targetModel = resolveGeminiModelName(model);
    const contents = [
      ...(options.history || [])
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      {
        role: "user",
        parts: [
          { text: options.message },
          {
            inlineData: {
              data: options.imageBase64,
              mimeType: options.mimeType,
            },
          },
        ],
      },
    ];

    try {
      const modelInstance = this.genAI.getGenerativeModel({ model: targetModel });
      const result = await modelInstance.generateContent({ contents });
      const response = await result.response;
      const text = response.text() || "";

      return {
        text,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("not found")) {
        console.warn(`[GeminiProvider] Vision model ${targetModel} 404, falling back to gemini-1.5-flash`);
        const fallbackInstance = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await fallbackInstance.generateContent({ contents });
        const response = await result.response;
        return {
          text: response.text() || "",
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        };
      }
      throw err;
    }
  }

  async visionStream(
    options: VisionOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
    const targetModel = resolveGeminiModelName(model);
    const contents = [
      ...(options.history || [])
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      {
        role: "user",
        parts: [
          { text: options.message },
          {
            inlineData: {
              data: options.imageBase64,
              mimeType: options.mimeType,
            },
          },
        ],
      },
    ];

    try {
      const modelInstance = this.genAI.getGenerativeModel({ model: targetModel });
      const result = await modelInstance.generateContentStream({ contents });
      let fullText = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      const response = await result.response;

      return {
        text: fullText,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("not found")) {
        console.warn(`[GeminiProvider] VisionStream model ${targetModel} 404, falling back to gemini-1.5-flash`);
        const fallbackInstance = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await fallbackInstance.generateContentStream({ contents });
        let fullText = "";

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }

        const response = await result.response;
        return {
          text: fullText,
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        };
      }
      throw err;
    }
  }
}
