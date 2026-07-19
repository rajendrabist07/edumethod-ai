import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ChatOptions, VisionOptions, ProviderResult } from "./provider-interface";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  async chat(options: ChatOptions, model: string): Promise<ProviderResult> {
    const systemMessage = options.messages.find((m) => m.role === "system")?.content;
    const contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const modelInstance = this.genAI.getGenerativeModel({
      model,
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
  }

  async chatStream(
    options: ChatOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
    const systemMessage = options.messages.find((m) => m.role === "system")?.content;
    const contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const modelInstance = this.genAI.getGenerativeModel({
      model,
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
  }

  async vision(options: VisionOptions, model: string): Promise<ProviderResult> {
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

    const modelInstance = this.genAI.getGenerativeModel({ model });
    const result = await modelInstance.generateContent({ contents });
    const response = await result.response;
    const text = response.text() || "";

    return {
      text,
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
    };
  }

  async visionStream(
    options: VisionOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
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

    const modelInstance = this.genAI.getGenerativeModel({ model });
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
  }
}
