export type AgentLanguage = "ja" | "en";

export type AgentType =
  | "growth_review"
  | "public_page_polish"
  | "progress_coach"
  | "store_review_readiness"
  | "share_boost";

export type AgentRunStatus = "running" | "succeeded" | "failed";

export type AgentSuggestionType =
  | "idea_diagnosis"
  | "mvp_plan"
  | "tester_strategy"
  | "public_pitch"
  | "progress_next_action"
  | "store_review_readiness"
  | "share_boost";

export type AgentSuggestionStatus = "draft" | "accepted" | "dismissed";

export interface AgentRun {
  id: string;
  ideaId: string;
  userId: string;
  agentType: AgentType;
  language: AgentLanguage;
  status: AgentRunStatus;
  inputSnapshot: {
    idea?: Record<string, unknown>;
    testerCall?: Record<string, unknown>;
    activityReport?: Record<string, unknown>;
  };
  outputSuggestionIds: string[];
  errorMessage?: string;
  model?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AgentSuggestion<TContent extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  ideaId: string;
  userId: string;
  runId: string;
  type: AgentSuggestionType;
  language: AgentLanguage;
  status: AgentSuggestionStatus;
  title: string;
  summary: string;
  content: TContent;
  createdAt: unknown;
  updatedAt: unknown;
  acceptedAt?: unknown;
  dismissedAt?: unknown;
}

export interface GrowthReviewOutput {
  ideaDiagnosis: {
    title: string;
    summary: string;
    targetUsers: string[];
    coreValue: string;
    unclearPoints: string[];
    risks: string[];
  };
  mvpPlan: {
    title: string;
    summary: string;
    mustHaveFeatures: string[];
    niceToHaveFeatures: string[];
    firstWeekTasks: string[];
    validationMethod: string;
  };
  testerStrategy: {
    title: string;
    summary: string;
    idealTesterPersona: string;
    testerCallCopy: string;
    feedbackQuestions: string[];
  };
  nextActions: {
    title: string;
    summary: string;
    actions: string[];
  };
}

export interface PublicPagePolishOutput {
  improvedTitle: string;
  shortPitch: string;
  longDescription: string;
  seoDescription: string;
  ogpTitle: string;
  ogpDescription: string;
  xPost: string;
  testerCallCopy: string;
}

export interface ProgressCoachOutput {
  progressSummary: string;
  detectedBlockers: string[];
  suggestedNextActions: string[];
  encouragement: string;
  risksToWatch: string[];
}

export type StoreReviewRiskLevel = "low" | "medium" | "high";

export interface StoreReviewReadinessOutput {
  overallScore: number;
  appStoreScore?: number;
  googlePlayScore?: number;
  riskLevel: StoreReviewRiskLevel;
  riskItems: Array<{
    platform: "app_store" | "google_play" | "both";
    category:
      | "privacy"
      | "safety"
      | "payments"
      | "user_generated_content"
      | "ai_content"
      | "metadata"
      | "permissions"
      | "children"
      | "technical"
      | "review_notes";
    severity: StoreReviewRiskLevel;
    title: string;
    reason: string;
    recommendedFix: string;
  }>;
  requiredAssets: string[];
  reviewNotesDraft: {
    appStore?: string;
    googlePlay?: string;
  };
  checklist: string[];
  disclaimer: string;
}

export type ShareIntent = "tester_call" | "feedback" | "progress" | "launch";

export interface ShareBoostOutput {
  intent: ShareIntent;
  shortPost: string;
  friendlyPost: string;
  testerCallPost: string;
  hashtags: string[];
  shareUrl: string;
}

export interface AgentApplyPatch {
  idea?: Record<string, unknown>;
  testerCall?: {
    suggestedTesterPersona?: string;
    suggestedFeedbackQuestions?: string[];
    testerCallCopy?: string;
  };
}
