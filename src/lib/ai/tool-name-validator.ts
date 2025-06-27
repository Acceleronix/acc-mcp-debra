import type { LanguageModel } from "ai";
import type { Tool } from "ai";

/**
 * Sanitizes a tool name to be compatible with Google Gemini API requirements
 * Gemini requires: ^[a-zA-Z_][a-zA-Z0-9_.-]{0,63}$
 */
export function sanitizeToolNameForGemini(toolName: string): string {
  if (!toolName) return "unknown_tool";
  
  let sanitized = toolName;
  
  // Remove invalid characters, keep only alphanumeric, underscore, dot, dash
  sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]/g, "_");
  
  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  
  // Truncate to 64 characters max, but be more aggressive to leave room for uniqueness suffixes
  if (sanitized.length > 60) {
    sanitized = sanitized.substring(0, 60);
  }
  
  // Ensure it ends with a valid character (not a special char)
  sanitized = sanitized.replace(/[.-]+$/, "");
  
  // If empty after sanitization, provide a default
  if (!sanitized || sanitized.length < 1) {
    sanitized = "sanitized_tool";
  }
  
  return sanitized;
}

/**
 * Checks if a language model is a Google Gemini model
 */
export function isGeminiModel(model: LanguageModel): boolean {
  const modelId = model.modelId.toLowerCase();
  const providerId = model.provider?.toLowerCase() || "";
  
  // Check various ways Gemini models might be identified
  const isGemini = modelId.includes("gemini") || 
                   modelId.includes("google") || 
                   providerId.includes("google") ||
                   providerId.includes("gemini") ||
                   model.provider === "google" ||
                   // Check the constructor name or prototype
                   model.constructor?.name?.toLowerCase().includes("google") ||
                   // Check if it's a Google AI model based on common patterns
                   (model as any).settings?.apiKey === process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  console.log(`Model check: ${modelId}, provider: ${providerId}, constructor: ${model.constructor?.name}, isGemini: ${isGemini}`);
  
  return isGemini;
}

/**
 * Validates and sanitizes tool names for specific LLM providers
 */
export function validateToolsForProvider(
  tools: Record<string, Tool>,
  model: LanguageModel
): Record<string, Tool> {
  const isGemini = isGeminiModel(model);
  
  console.log(`Tool validation: Model ${model.modelId}, Provider: ${model.provider}, isGemini: ${isGemini}`);
  
  if (!isGemini) {
    // For non-Gemini models, return tools as-is
    console.log(`Skipping tool validation for non-Gemini model: ${model.modelId}`);
    return tools;
  }
  
  console.log(`Validating ${Object.keys(tools).length} tools for Gemini...`);
  
  const validatedTools: Record<string, Tool> = {};
  const usedNames = new Set<string>();
  
  for (const [originalName, tool] of Object.entries(tools)) {
    let sanitizedName = sanitizeToolNameForGemini(originalName);
    
    // Handle name collisions by adding a suffix
    let counter = 1;
    while (usedNames.has(sanitizedName)) {
      const baseName = sanitizedName.length > 60 ? sanitizedName.substring(0, 58) : sanitizedName;
      sanitizedName = `${baseName}_${counter}`;
      counter++;
      
      // Safety check to prevent infinite loop
      if (counter > 1000) {
        sanitizedName = `tool_${Math.random().toString(36).substring(2, 8)}`;
        break;
      }
    }
    
    usedNames.add(sanitizedName);
    
    // Final validation check
    const geminiPattern = /^[a-zA-Z_][a-zA-Z0-9_.-]{0,63}$/;
    if (!geminiPattern.test(sanitizedName)) {
      console.error(`Tool name still invalid after sanitization: "${sanitizedName}"`);
      sanitizedName = `tool_${Math.random().toString(36).substring(2, 8)}`;
    }
    
    // Create new tool with sanitized name
    validatedTools[sanitizedName] = {
      ...tool,
    };
    
    // Log when names are changed for debugging
    if (originalName !== sanitizedName) {
      console.warn(`Tool name sanitized for Gemini: "${originalName}" (${originalName.length} chars) -> "${sanitizedName}" (${sanitizedName.length} chars)`);
    }
  }
  
  console.log(`Tool validation complete: ${Object.keys(validatedTools).length} tools validated`);
  return validatedTools;
}