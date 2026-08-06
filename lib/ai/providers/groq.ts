import Groq from "groq-sdk";
import { AIProvider, ChatOptions, VisionOptions, ProviderResult } from "./provider-interface";

function getGroqClient(): Groq {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });
}

export class GroqProvider implements AIProvider {
  name = "groq";

  async chat(options: ChatOptions, model: string): Promise<ProviderResult> {
    const groqClient = getGroqClient();
    const response = await groqClient.chat.completions.create({
      model,
      messages: options.messages,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
    });

    const text = response.choices[0]?.message?.content || "";
    return {
      text,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    };
  }

  async chatStream(
    options: ChatOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
    const groqClient = getGroqClient();
    const stream = await groqClient.chat.completions.create({
      model,
      messages: options.messages,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
      temperature: options.temperature,
      stream: true,
    });

    let fullText = "";
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullText += text;
        onChunk(text);
      }
      
      // Attempt to extract usage from final chunk if present
      const usage = (chunk as any).x_groq?.usage || (chunk as any).usage;
      if (usage) {
        promptTokens = usage.prompt_tokens;
        completionTokens = usage.completion_tokens;
      }
    }

    return {
      text: fullText,
      promptTokens,
      completionTokens,
    };
  }

  async vision(options: VisionOptions, model: string): Promise<ProviderResult> {
    const messages = [
      ...(options.history || []).map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: options.message },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${options.mimeType};base64,${options.imageBase64}`,
            },
          },
        ],
      },
    ];

    const groqClient = getGroqClient();
    const response = await groqClient.chat.completions.create({
      model,
      messages,
    });

    const text = response.choices[0]?.message?.content || "";
    return {
      text,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    };
  }

  async visionStream(
    options: VisionOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult> {
    const messages = [
      ...(options.history || []).map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: options.message },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${options.mimeType};base64,${options.imageBase64}`,
            },
          },
        ],
      },
    ];

    const groqClient = getGroqClient();
    const stream = await groqClient.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    let fullText = "";
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullText += text;
        onChunk(text);
      }

      const usage = (chunk as any).x_groq?.usage || (chunk as any).usage;
      if (usage) {
        promptTokens = usage.prompt_tokens;
        completionTokens = usage.completion_tokens;
      }
    }

    return {
      text: fullText,
      promptTokens,
      completionTokens,
    };
  }
}
