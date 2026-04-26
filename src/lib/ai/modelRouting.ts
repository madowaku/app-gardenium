import { GoogleGenAI } from "@google/genai";

/**
 * AI Model Tasks for App Gardenium
 * Defines semantic workloads rather than raw model IDs.
 */
export type AIModelTask = 
  | 'idea_polish'               // Refining/Enhancing initial idea seeds
  | 'analysis_report'           // Regular user sentiment/feedback analysis
  | 'analysis_report_premium'   // Deep PM analysis for pro users/admins
  | 'translate_content'         // Multi-language translation
  | 'moderate_profile_image'    // Safety checks for avatars
  | 'summarize_text'            // General text summarization
  | 'experiment_compare'        // Sandbox for testing new models
  | 'preview_test';             // Limited preview feature access

/**
 * Model Route Configuration
 * CENTRAL SOURCE OF TRUTH for task-to-model mapping.
 */
const STABLE_MODELS: Record<AIModelTask, string> = {
  idea_polish: 'gemini-2.5-flash',
  analysis_report: 'gemini-2.5-flash',
  analysis_report_premium: 'gemini-2.5-pro',
  translate_content: 'gemini-2.5-flash',
  moderate_profile_image: 'gemini-2.5-flash',
  summarize_text: 'gemini-2.5-flash', 
  experiment_compare: 'gemini-2.5-flash', // Default to stable for safety
  preview_test: 'gemini-2.5-flash',
};

const PREVIEW_MODES: Partial<Record<AIModelTask, string>> = {
  experiment_compare: 'gemini-3-flash-preview',
  preview_test: 'gemini-3-flash-preview',
};

/**
 * Resolves the appropriate Gemini model ID for a given task.
 * @param task The semantic goal of the AI call.
 * @param options Routing options (e.g., force preview, environment).
 */
export function getAIModelForTask(
  task: AIModelTask, 
  options: { usePreview?: boolean } = {}
): string {
  const isPreviewDesired = options.usePreview || (process.env.NODE_ENV === 'development' && task === 'experiment_compare');
  
  let model: string;
  
  if (isPreviewDesired && PREVIEW_MODES[task]) {
    model = PREVIEW_MODES[task]!;
  } else {
    model = STABLE_MODELS[task] || 'gemini-2.5-flash';
  }

  // Log usage for observability (standardized across the app)
  console.log(`[AI Routing] Task: ${task} | Resolved Model: ${model} | Preview: ${!!isPreviewDesired}`);
  
  return model;
}

/**
 * Helper to initialize the SDK with a standard config.
 */
export function getAIService() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI Routing] GEMINI_API_KEY is not set.");
    throw new Error("GEMINI_API_KEY is not set. Please configure the AI Studio environment.");
  }
  return new GoogleGenAI({ apiKey });
}
