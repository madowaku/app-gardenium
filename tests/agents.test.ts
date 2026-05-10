import assert from "node:assert/strict";
import {
  buildApplyPatchForSuggestion,
  convertGrowthReviewOutputToSuggestions,
  convertStoreReviewReadinessOutputToSuggestion,
  convertShareBoostOutputToSuggestion,
  resolveGrowthAgentModel,
} from "../src/lib/agents/growthAgent";
import type { GrowthReviewOutput, ShareBoostOutput, StoreReviewReadinessOutput } from "../src/types/agents";

const output: GrowthReviewOutput = {
  ideaDiagnosis: {
    title: "Sharper cat companion diagnosis",
    summary: "The idea is strongest when focused on cat owners who want a personal desktop companion.",
    targetUsers: ["Cat lovers", "Desktop pet fans"],
    coreValue: "Turn personal cat photos into a companion users enjoy seeing every day.",
    unclearPoints: ["Whether users want photo-realistic or stylized pets"],
    risks: ["Animation scope can grow too large"],
  },
  mvpPlan: {
    title: "First lovable MVP",
    summary: "Validate the core companion loop before adding advanced reactions.",
    mustHaveFeatures: ["Photo upload", "Desktop companion display", "Basic idle animation"],
    niceToHaveFeatures: ["Mood reactions"],
    firstWeekTasks: ["Mock one cat animation", "Recruit three testers", "Ask for daily-use feedback"],
    validationMethod: "Ask testers to use it for one workday and report whether they noticed or enjoyed it.",
  },
  testerStrategy: {
    title: "Find cat-loving desktop users",
    summary: "Recruit people who already personalize their workspace.",
    idealTesterPersona: "Cat owners who use a laptop or desktop for several hours a day.",
    testerCallCopy: "Try a tiny desktop cat companion made from your own photo and tell us when it feels delightful or distracting.",
    feedbackQuestions: ["Did the companion feel personal?", "When did it distract you?", "What reaction should come next?"],
  },
  nextActions: {
    title: "Next three moves",
    summary: "Keep validation tiny and concrete.",
    actions: ["Create one animated prototype", "Invite three cat owners", "Record feedback after one day"],
  },
};

const suggestions = convertGrowthReviewOutputToSuggestions({
  ideaId: "idea-1",
  userId: "user-1",
  runId: "run-1",
  language: "en",
  output,
  timestamp: 123,
});

assert.equal(suggestions.length, 4);
assert.deepEqual(
  suggestions.map((suggestion) => suggestion.type),
  ["idea_diagnosis", "mvp_plan", "tester_strategy", "progress_next_action"],
);
assert.equal(suggestions[1].title, "First lovable MVP");
assert.deepEqual(suggestions[1].content.mustHaveFeatures, output.mvpPlan.mustHaveFeatures);

const mvpPatch = buildApplyPatchForSuggestion(suggestions[1]);
assert.deepEqual(mvpPatch.idea, {
  latestGrowthSummary: output.mvpPlan.summary,
  mvpScope: output.mvpPlan.mustHaveFeatures,
  nextActions: output.mvpPlan.firstWeekTasks,
});
assert.equal(mvpPatch.testerCall, undefined);

const testerPatch = buildApplyPatchForSuggestion(suggestions[2]);
assert.deepEqual(testerPatch.idea, {
  latestGrowthSummary: output.testerStrategy.summary,
});
assert.equal(testerPatch.testerCall?.suggestedTesterPersona, output.testerStrategy.idealTesterPersona);
assert.deepEqual(testerPatch.testerCall?.suggestedFeedbackQuestions, output.testerStrategy.feedbackQuestions);

assert.throws(
  () => buildApplyPatchForSuggestion({ ...suggestions[1], status: "accepted" }),
  /already accepted/,
);

assert.equal(
  resolveGrowthAgentModel("growth_review", {}),
  "gemini-2.5-flash-lite",
);
assert.equal(
  resolveGrowthAgentModel("public_page_polish", {}),
  "gemini-3-flash-preview",
);
assert.equal(
  resolveGrowthAgentModel("progress_coach", { GROWTH_AGENT_MODEL: "custom-lite" }),
  "custom-lite",
);
assert.equal(
  resolveGrowthAgentModel("public_page_polish", { GROWTH_AGENT_COPY_MODEL: "custom-copy" }),
  "custom-copy",
);

const storeOutput: StoreReviewReadinessOutput = {
  overallScore: 74,
  appStoreScore: 72,
  googlePlayScore: 78,
  riskLevel: "medium",
  riskItems: [
    {
      platform: "both",
      category: "privacy",
      severity: "medium",
      title: "Photo handling needs explanation",
      reason: "The app uses uploaded pet photos.",
      recommendedFix: "Prepare a privacy policy and explain storage/deletion behavior.",
    },
    {
      platform: "both",
      category: "ai_content",
      severity: "medium",
      title: "AI processing disclosure is missing",
      reason: "The app may transform uploaded photos with AI.",
      recommendedFix: "Explain AI processing in review notes and user-facing copy.",
    },
  ],
  requiredAssets: ["Privacy policy URL", "Photo deletion flow", "Review notes"],
  reviewNotesDraft: {
    appStore: "Reviewer note: test the photo upload flow with the demo account.",
    googlePlay: "Play Console note: user photos are used only to create the desktop companion.",
  },
  checklist: ["Add privacy policy URL", "Prepare demo account", "Clarify AI image processing"],
  disclaimer: "This readiness score is not a guarantee of App Store or Google Play approval.",
};

const storeSuggestion = convertStoreReviewReadinessOutputToSuggestion({
  ideaId: "idea-1",
  userId: "user-1",
  runId: "run-store",
  language: "en",
  output: storeOutput,
  timestamp: 456,
});
assert.equal(storeSuggestion.type, "store_review_readiness");
assert.equal(storeSuggestion.title, "Store Review Readiness: 74/100");
assert.equal(storeSuggestion.summary.includes("Medium"), true);
assert.equal(storeSuggestion.content.disclaimer, storeOutput.disclaimer);

const shareOutput: ShareBoostOutput = {
  intent: "tester_call",
  shortPost: "Building Cat Desktop Buddy, a tiny desktop companion made from your cat photos.",
  friendlyPost: "I am prototyping Cat Desktop Buddy and looking for cat lovers to react to the first MVP.",
  testerCallPost: "Looking for 3 cat owners to test a tiny desktop pet prototype and answer a few feedback questions.",
  hashtags: ["#indieapp", "#cats", "#desktop"],
  shareUrl: "https://app-gardenium.com/ideas/idea-1",
};
const shareSuggestion = convertShareBoostOutputToSuggestion({
  ideaId: "idea-1",
  userId: "user-1",
  runId: "run-share",
  language: "en",
  output: shareOutput,
  timestamp: 789,
});
assert.equal(shareSuggestion.type, "share_boost");
assert.deepEqual(shareSuggestion.content.hashtags, shareOutput.hashtags);
assert.equal(buildApplyPatchForSuggestion(shareSuggestion).idea?.latestGrowthSummary, shareSuggestion.summary);

console.log("agents tests passed");
