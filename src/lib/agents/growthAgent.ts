import type {
  AgentApplyPatch,
  AgentType,
  AgentLanguage,
  AgentSuggestion,
  GrowthReviewOutput,
  ShareBoostOutput,
  StoreReviewReadinessOutput,
} from "../../types/agents";

const DEFAULT_GROWTH_AGENT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_GROWTH_AGENT_STRONG_MODEL = "gemini-3-flash-preview";

type ModelEnv = Partial<Pick<
  Record<string, string>,
  "GROWTH_AGENT_MODEL" | "GROWTH_AGENT_STRONG_MODEL" | "GROWTH_AGENT_COPY_MODEL"
>>;

export function resolveGrowthAgentModel(
  agentType: AgentType,
  env: ModelEnv = process.env,
): string {
  switch (agentType) {
    case "public_page_polish":
      return env.GROWTH_AGENT_COPY_MODEL || env.GROWTH_AGENT_STRONG_MODEL || DEFAULT_GROWTH_AGENT_STRONG_MODEL;
    case "growth_review":
    case "progress_coach":
    default:
      return env.GROWTH_AGENT_MODEL || DEFAULT_GROWTH_AGENT_MODEL;
  }
}

type ConvertParams = {
  ideaId: string;
  userId: string;
  runId: string;
  language: AgentLanguage;
  output: GrowthReviewOutput;
  timestamp: unknown;
};

type SingleSuggestionParams<TOutput> = {
  ideaId: string;
  userId: string;
  runId: string;
  language: AgentLanguage;
  output: TOutput;
  timestamp: unknown;
};

function suggestionId(runId: string, suffix: string) {
  return `${runId}_${suffix}`;
}

function createSuggestion(
  params: Omit<AgentSuggestion, "status">,
): AgentSuggestion {
  return {
    ...params,
    status: "draft",
  };
}

export function convertGrowthReviewOutputToSuggestions(params: ConvertParams): AgentSuggestion[] {
  const { ideaId, userId, runId, language, output, timestamp } = params;
  const base = {
    ideaId,
    userId,
    runId,
    language,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return [
    createSuggestion({
      ...base,
      id: suggestionId(runId, "idea_diagnosis"),
      type: "idea_diagnosis",
      title: output.ideaDiagnosis.title,
      summary: output.ideaDiagnosis.summary,
      content: output.ideaDiagnosis,
    }),
    createSuggestion({
      ...base,
      id: suggestionId(runId, "mvp_plan"),
      type: "mvp_plan",
      title: output.mvpPlan.title,
      summary: output.mvpPlan.summary,
      content: output.mvpPlan,
    }),
    createSuggestion({
      ...base,
      id: suggestionId(runId, "tester_strategy"),
      type: "tester_strategy",
      title: output.testerStrategy.title,
      summary: output.testerStrategy.summary,
      content: output.testerStrategy,
    }),
    createSuggestion({
      ...base,
      id: suggestionId(runId, "progress_next_action"),
      type: "progress_next_action",
      title: output.nextActions.title,
      summary: output.nextActions.summary,
      content: output.nextActions,
    }),
  ];
}

export function convertStoreReviewReadinessOutputToSuggestion(
  params: SingleSuggestionParams<StoreReviewReadinessOutput>,
): AgentSuggestion {
  const riskLabel = params.output.riskLevel[0].toUpperCase() + params.output.riskLevel.slice(1);
  return createSuggestion({
    id: suggestionId(params.runId, "store_review_readiness"),
    ideaId: params.ideaId,
    userId: params.userId,
    runId: params.runId,
    language: params.language,
    type: "store_review_readiness",
    title: `Store Review Readiness: ${params.output.overallScore}/100`,
    summary: `${riskLabel} risk. ${params.output.riskItems[0]?.title || "Review readiness checklist prepared."}`,
    content: params.output as unknown as Record<string, unknown>,
    createdAt: params.timestamp,
    updatedAt: params.timestamp,
  });
}

export function convertShareBoostOutputToSuggestion(
  params: SingleSuggestionParams<ShareBoostOutput>,
): AgentSuggestion {
  return createSuggestion({
    id: suggestionId(params.runId, "share_boost"),
    ideaId: params.ideaId,
    userId: params.userId,
    runId: params.runId,
    language: params.language,
    type: "share_boost",
    title: params.language === "ja" ? "Share Boost 投稿文" : "Share Boost Copy",
    summary: params.output.testerCallPost || params.output.friendlyPost || params.output.shortPost,
    content: params.output as unknown as Record<string, unknown>,
    createdAt: params.timestamp,
    updatedAt: params.timestamp,
  });
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function buildApplyPatchForSuggestion(suggestion: AgentSuggestion): AgentApplyPatch {
  if (suggestion.status === "accepted") {
    throw new Error("Suggestion is already accepted.");
  }
  if (suggestion.status === "dismissed") {
    throw new Error("Dismissed suggestions cannot be applied.");
  }

  switch (suggestion.type) {
    case "idea_diagnosis":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          riskNotes: asStringArray(suggestion.content.risks),
        },
      };
    case "mvp_plan":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          mvpScope: asStringArray(suggestion.content.mustHaveFeatures),
          nextActions: asStringArray(suggestion.content.firstWeekTasks),
        },
      };
    case "tester_strategy":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
        },
        testerCall: {
          suggestedTesterPersona:
            typeof suggestion.content.idealTesterPersona === "string"
              ? suggestion.content.idealTesterPersona
              : "",
          suggestedFeedbackQuestions: asStringArray(suggestion.content.feedbackQuestions),
          testerCallCopy:
            typeof suggestion.content.testerCallCopy === "string"
              ? suggestion.content.testerCallCopy
              : "",
        },
      };
    case "public_pitch":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          oneLineSummary:
            typeof suggestion.content.shortPitch === "string"
              ? suggestion.content.shortPitch
              : suggestion.summary,
          seoDescription:
            typeof suggestion.content.seoDescription === "string"
              ? suggestion.content.seoDescription
              : suggestion.summary,
        },
      };
    case "progress_next_action":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          nextActions: asStringArray(suggestion.content.actions),
        },
      };
    case "store_review_readiness":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          storeReadinessScore: suggestion.content.overallScore,
          storeReadinessRiskLevel: suggestion.content.riskLevel,
        },
      };
    case "share_boost":
      return {
        idea: {
          latestGrowthSummary: suggestion.summary,
          shareBoostSummary: suggestion.summary,
        },
      };
    default:
      throw new Error(`Unsupported suggestion type: ${(suggestion as AgentSuggestion).type}`);
  }
}

export const growthReviewResponseSchema = {
  type: "OBJECT",
  properties: {
    ideaDiagnosis: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        summary: { type: "STRING" },
        targetUsers: { type: "ARRAY", items: { type: "STRING" } },
        coreValue: { type: "STRING" },
        unclearPoints: { type: "ARRAY", items: { type: "STRING" } },
        risks: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "summary", "targetUsers", "coreValue", "unclearPoints", "risks"],
    },
    mvpPlan: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        summary: { type: "STRING" },
        mustHaveFeatures: { type: "ARRAY", items: { type: "STRING" } },
        niceToHaveFeatures: { type: "ARRAY", items: { type: "STRING" } },
        firstWeekTasks: { type: "ARRAY", items: { type: "STRING" } },
        validationMethod: { type: "STRING" },
      },
      required: ["title", "summary", "mustHaveFeatures", "niceToHaveFeatures", "firstWeekTasks", "validationMethod"],
    },
    testerStrategy: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        summary: { type: "STRING" },
        idealTesterPersona: { type: "STRING" },
        testerCallCopy: { type: "STRING" },
        feedbackQuestions: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "summary", "idealTesterPersona", "testerCallCopy", "feedbackQuestions"],
    },
    nextActions: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        summary: { type: "STRING" },
        actions: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "summary", "actions"],
    },
  },
  required: ["ideaDiagnosis", "mvpPlan", "testerStrategy", "nextActions"],
} as const;
