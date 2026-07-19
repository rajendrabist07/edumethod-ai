export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface VisionOptions {
  message: string;
  imageBase64: string;
  mimeType: string;
  history?: ChatMessage[];
}

export interface ProviderResult {
  text: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface AIProvider {
  name: string;
  chat(options: ChatOptions, model: string): Promise<ProviderResult>;
  chatStream(
    options: ChatOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult>;
  vision(options: VisionOptions, model: string): Promise<ProviderResult>;
  visionStream(
    options: VisionOptions,
    model: string,
    onChunk: (text: string) => void
  ): Promise<ProviderResult>;
}
