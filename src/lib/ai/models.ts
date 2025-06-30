// models.ts
import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { googleKeyManager } from "./google-key-manager";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

// Create Google models with automatic key rotation
function createGoogleModelWithRotation(modelName: string) {
  const baseModel = google(modelName);

  return {
    // Pass through base model properties first
    ...baseModel,

    // Override with rotation logic
    doGenerate: async (options: any) => {
      let lastError: any;
      let attempts = 0;
      const maxAttempts = 5; // Try up to 5 different keys

      while (attempts < maxAttempts) {
        const apiKey = googleKeyManager.getApiKey();
        if (!apiKey) {
          throw new Error("No available Google API keys");
        }

        try {
          const googleProvider = createGoogleGenerativeAI({ apiKey });
          const model = googleProvider(modelName);
          return await model.doGenerate(options);
        } catch (error: any) {
          lastError = error;
          attempts++;

          // Report error to key manager
          googleKeyManager.reportError(apiKey, error);

          console.warn(
            `Google API error with key ${apiKey.substring(0, 8)}... (attempt ${attempts}):`,
            error?.message || error,
          );

          // If this was a permanent error or we've exhausted attempts, throw
          if (attempts >= maxAttempts) {
            break;
          }
        }
      }

      // If we get here, all attempts failed
      console.error(`All Google API keys failed after ${attempts} attempts`);
      throw lastError || new Error("All Google API keys are unavailable");
    },

    doStream: async (options: any) => {
      let lastError: any;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const apiKey = googleKeyManager.getApiKey();
        if (!apiKey) {
          throw new Error("No available Google API keys");
        }

        try {
          const googleProvider = createGoogleGenerativeAI({ apiKey });
          const model = googleProvider(modelName);
          return await model.doStream(options);
        } catch (error: any) {
          lastError = error;
          attempts++;

          // Report error to key manager
          googleKeyManager.reportError(apiKey, error);

          console.warn(
            `Google API stream error with key ${apiKey.substring(0, 8)}... (attempt ${attempts}):`,
            error?.message || error,
          );

          if (attempts >= maxAttempts) {
            break;
          }
        }
      }

      console.error(
        `All Google API keys failed for streaming after ${attempts} attempts`,
      );
      throw (
        lastError ||
        new Error("All Google API keys are unavailable for streaming")
      );
    },
  };
}

// Helper function to check if provider has API key configured
function hasApiKey(provider: string): boolean {
  switch (provider) {
    case "google":
      return !!(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_2 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_3 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_4 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_5 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_6 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_7 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_8 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_9 ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_10
      );
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "xai":
      return !!process.env.XAI_API_KEY;
    case "ollama":
      return !!process.env.OLLAMA_BASE_URL;
    case "openRouter":
      return !!process.env.OPENROUTER_API_KEY;
    default:
      return false;
  }
}

const allStaticModels = {
  google: {
    "gemini-2.5-flash": createGoogleModelWithRotation(
      "gemini-2.5-flash-preview-04-17",
    ) as any,
    "gemini-2.5-pro": createGoogleModelWithRotation(
      "gemini-2.5-pro-preview-05-06",
    ) as any,
  },
  openai: {
    "4o-mini": openai("gpt-4o-mini", {}),
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "4o": openai("gpt-4o"),
    "o4-mini": openai("o4-mini", {
      reasoningEffort: "medium",
    }),
  },
  anthropic: {
    "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-latest"),
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-latest"),
    "claude-4-sonnet": anthropic("claude-sonnet-4-20250514"),
  },
  xai: {
    "grok-2": xai("grok-2-1212"),
    "grok-3-mini": xai("grok-3-mini-latest"),
    "grok-3": xai("grok-3-latest"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  openRouter: {
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
  },
};

// Filter out providers without API keys
const staticModels = Object.fromEntries(
  Object.entries(allStaticModels).filter(([provider]) => hasApiKey(provider)),
);

// Build unsupported models set only for configured providers
const staticUnsupportedModels = new Set(
  [
    staticModels.openai?.["o4-mini"],
    staticModels.xai?.["grok-3"],
    staticModels.xai?.["grok-3-mini"],
    staticModels.ollama?.["gemma3:1b"],
    staticModels.ollama?.["gemma3:4b"],
    staticModels.ollama?.["gemma3:12b"],
    staticModels.openRouter?.["qwen3-8b:free"],
    staticModels.openRouter?.["qwen3-14b:free"],
  ].filter(Boolean),
);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const firstProvider = Object.keys(allModels)[0];
const firstModel = Object.keys(allModels[firstProvider])[0];

const fallbackModel = allModels[firstProvider][firstModel];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
    })),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};
