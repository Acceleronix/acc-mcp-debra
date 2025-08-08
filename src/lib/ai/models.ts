// models.ts
import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
// import { xai } from "@ai-sdk/xai";  // Temporarily disabled
import { openrouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

// Helper function to check if provider has API key configured
function hasApiKey(provider: string): boolean {
  switch (provider) {
    case "google":
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    // case "xai":  // Temporarily disabled
    //   return !!process.env.XAI_API_KEY;
    case "ollama":
      return !!process.env.OLLAMA_BASE_URL;
    case "openRouter":
      return !!process.env.OPENROUTER_API_KEY;
    default:
      return false;
  }
}

const allStaticModels = {
  openai: {
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "4o-mini": openai("gpt-4o-mini", {}),
  },
  // xai: {  // Temporarily disabled
  //   "grok-3-mini-fast": xai("grok-3-mini-fast"),
  //   "grok-3": xai("grok-3-latest"),
  // },
  anthropic: {
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-latest"),
    "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-latest"),
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
    // staticModels.xai?.["grok-3"],  // Temporarily disabled
    // staticModels.xai?.["grok-3-mini"],  // Temporarily disabled
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
