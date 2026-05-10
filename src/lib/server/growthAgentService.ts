import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { generateStructuredJson } from "./geminiClient";
import {
  convertShareBoostOutputToSuggestion,
  convertGrowthReviewOutputToSuggestions,
  convertStoreReviewReadinessOutputToSuggestion,
  growthReviewResponseSchema,
  resolveGrowthAgentModel,
} from "../agents/growthAgent";
import type {
  AgentLanguage,
  AgentSuggestion,
  GrowthReviewOutput,
  ShareBoostOutput,
  StoreReviewReadinessOutput,
} from "../../types/agents";

function growthSystemInstruction(language: AgentLanguage) {
  const base = [
    "You are App Gardenium Growth Agent.",
    "Your job is to help solo app builders turn rough ideas into tested, launchable products.",
    "You must be practical, specific, and kind.",
    "Do not invent unavailable user data.",
    "Do not promise guaranteed business success.",
    "Focus on the next concrete action.",
    "Return only valid JSON that matches the provided schema.",
  ];
  if (language === "ja") {
    base.push("回答は自然な日本語で書く。個人開発者に向けて、やさしく実行可能な表現にする。");
  } else {
    base.push("Write in clear, friendly English for solo builders. Avoid hype.");
  }
  return base.join("\n");
}

function buildGrowthReviewPrompt(idea: Record<string, any>, language: AgentLanguage) {
  return `Analyze this App Gardenium idea and generate a practical growth review.

Language: ${language}

Idea:
- Title: ${idea.title || ""}
- Short description: ${idea.oneLineSummary || idea.summary || ""}
- Long description: ${idea.problemDetails || idea.whatItDoes || idea.description || ""}
- Stage: ${idea.stage || ""}
- Target users: ${idea.targetUsers || ""}
- Minimum features: ${idea.minFeatures || ""}
- Tags: ${(idea.tags || []).join(", ")}

Generate:
1. Idea diagnosis
2. MVP plan
3. Tester strategy
4. Next 3 actions

Constraints:
- Keep it realistic for a solo builder.
- Prefer small experiments over large plans.
- Tester questions must be answerable by real users after trying a prototype.
- Output must match the JSON schema exactly.`;
}

function mockGrowthReviewOutput(idea: Record<string, any>, language: AgentLanguage): GrowthReviewOutput {
  const title = idea.title || "Untitled app idea";
  if (language === "ja") {
    return {
      ideaDiagnosis: {
        title: `${title} の成長診断`,
        summary: "いま一番強い価値を小さく検証できる形に絞ると、初期ユーザーに伝わりやすくなります。",
        targetUsers: ["課題をすでに感じている初期ユーザー", "新しいアプリを試すのが好きな人"],
        coreValue: "雑なアイデアを、試せる小さなプロトタイプへ近づけること。",
        unclearPoints: ["最初に検証したいユーザー行動", "ユーザーが継続して使う場面"],
        risks: ["MVPの範囲が広がりすぎる", "テスター質問が抽象的になる"],
      },
      mvpPlan: {
        title: "最初のMVP計画",
        summary: "1週間で試せる体験に絞り、反応を見て次を決めます。",
        mustHaveFeatures: ["核となる1つの利用フロー", "簡単なオンボーディング", "フィードバック導線"],
        niceToHaveFeatures: ["通知", "共有機能"],
        firstWeekTasks: ["1画面のプロトタイプを作る", "3人の候補テスターに声をかける", "試用後に3問だけ聞く"],
        validationMethod: "実際に触ってもらい、困った瞬間ともう一度使いたい理由を聞く。",
      },
      testerStrategy: {
        title: "テスター募集戦略",
        summary: "課題を自分ごととして話せる人を少人数集めます。",
        idealTesterPersona: "この課題を最近経験していて、試作品に率直な感想をくれる個人ユーザー。",
        testerCallCopy: `${title} の初期版を試して、使いたい瞬間と迷った点を教えてください。`,
        feedbackQuestions: ["最初に期待したことは何ですか？", "どこで迷いましたか？", "次に追加してほしい最小機能は何ですか？"],
      },
      nextActions: {
        title: "次の3アクション",
        summary: "大きく作る前に、小さな反応を集めます。",
        actions: ["MVPの1フローを紙に書く", "候補テスターを3人リストアップする", "募集文を公開ページに貼る"],
      },
    };
  }

  return {
    ideaDiagnosis: {
      title: `${title} growth diagnosis`,
      summary: "The idea will be easier to validate if the first user value is narrowed to one concrete test.",
      targetUsers: ["People already feeling the problem", "Early adopters who enjoy trying small apps"],
      coreValue: "Turn a rough idea into a tiny experience that real users can react to.",
      unclearPoints: ["The first behavior to validate", "The repeat-use moment"],
      risks: ["The MVP scope may grow too wide", "Tester questions may stay too abstract"],
    },
    mvpPlan: {
      title: "First MVP plan",
      summary: "Build one testable flow this week and use tester feedback to choose the next step.",
      mustHaveFeatures: ["One core user flow", "Light onboarding", "Feedback prompt"],
      niceToHaveFeatures: ["Notifications", "Sharing"],
      firstWeekTasks: ["Prototype one screen flow", "Invite three testers", "Ask three post-use questions"],
      validationMethod: "Watch testers use the prototype and ask what confused them and what would make them return.",
    },
    testerStrategy: {
      title: "Tester recruitment strategy",
      summary: "Start with a small group that can describe the problem in their own words.",
      idealTesterPersona: "A person who recently experienced this problem and can give candid prototype feedback.",
      testerCallCopy: `Try an early version of ${title} and tell us where it feels useful or confusing.`,
      feedbackQuestions: ["What did you expect first?", "Where did you hesitate?", "What is the smallest feature you want next?"],
    },
    nextActions: {
      title: "Next three actions",
      summary: "Collect concrete signals before expanding the build.",
      actions: ["Sketch the MVP flow", "List three tester candidates", "Add the tester call copy to the public page"],
    },
  };
}

function mockStoreReviewReadinessOutput(idea: Record<string, any>, language: AgentLanguage): StoreReviewReadinessOutput {
  const usesPhotos = /photo|image|写真|画像|cat|猫/i.test(
    [idea.title, idea.oneLineSummary, idea.problemDetails, idea.minFeatures].filter(Boolean).join(" "),
  );
  const riskItems: StoreReviewReadinessOutput["riskItems"] = [
    {
      platform: "both",
      category: "privacy",
      severity: usesPhotos ? "medium" : "low",
      title: language === "ja" ? "プライバシーポリシーとデータ扱いの説明" : "Privacy policy and data handling explanation",
      reason: language === "ja"
        ? "画像、ログイン、AI処理を扱う場合、データ利用と削除方法を提出前に説明できる必要があります。"
        : "If the app uses photos, login, or AI processing, reviewers need a clear explanation of data use and deletion.",
      recommendedFix: language === "ja"
        ? "プライバシーポリシーURL、画像の保存有無、削除方法を準備します。"
        : "Prepare a privacy policy URL, photo storage explanation, and deletion flow.",
    },
    {
      platform: "app_store",
      category: "review_notes",
      severity: "medium",
      title: language === "ja" ? "レビュー用の動作説明" : "Reviewer notes and demo access",
      reason: language === "ja"
        ? "ログインやバックエンド機能がある場合、審査担当者が全機能を確認できる情報が必要です。"
        : "Apps with login or backend features need review notes so reviewers can access full functionality.",
      recommendedFix: language === "ja"
        ? "デモアカウント、主要フロー、AI処理の説明をReview Notesにまとめます。"
        : "Prepare demo credentials, core flows, and AI-processing notes for review.",
    },
    {
      platform: "google_play",
      category: "metadata",
      severity: "low",
      title: language === "ja" ? "ストア掲載情報の明確さ" : "Clear store listing metadata",
      reason: language === "ja"
        ? "説明文、スクリーンショット、プロモーション表現は機能を誤解させない必要があります。"
        : "Descriptions, screenshots, and promotional copy should clearly match the app's real functionality.",
      recommendedFix: language === "ja"
        ? "できること、できないこと、AI機能の範囲を短く明記します。"
        : "State what the app does, what it does not do, and where AI is used.",
    },
  ];
  return {
    overallScore: usesPhotos ? 74 : 82,
    appStoreScore: usesPhotos ? 72 : 80,
    googlePlayScore: usesPhotos ? 78 : 84,
    riskLevel: usesPhotos ? "medium" : "low",
    riskItems,
    requiredAssets: language === "ja"
      ? ["プライバシーポリシーURL", "レビュー用メモ", "デモアカウントまたはデモモード", "データ削除方針"]
      : ["Privacy policy URL", "Review notes", "Demo account or demo mode", "Data deletion policy"],
    reviewNotesDraft: {
      appStore: language === "ja"
        ? "このアプリは初期MVPです。レビューでは写真アップロード、コンパニオン表示、削除フローを確認してください。AI処理の範囲はアプリ内説明に記載します。"
        : "This is an early MVP. Please review photo upload, companion display, and deletion flow. AI processing scope is described in app copy.",
      googlePlay: language === "ja"
        ? "ユーザー画像はコンパニオン生成のために使われます。データ利用、保存、削除方法をプライバシーポリシーに記載します。"
        : "User images are used to create the companion. Data use, retention, and deletion are documented in the privacy policy.",
    },
    checklist: language === "ja"
      ? ["プライバシーポリシーURLを用意する", "AI処理と画像保存の説明を書く", "レビュー用アカウントかデモモードを用意する"]
      : ["Add a privacy policy URL", "Explain AI/photo processing", "Prepare demo access or demo mode"],
    disclaimer: language === "ja"
      ? "これは審査準備度の診断であり、App StoreまたはGoogle Playの承認を保証するものではありません。"
      : "This readiness score is not a guarantee of App Store or Google Play approval.",
  };
}

function mockShareBoostOutput(idea: Record<string, any>, language: AgentLanguage): ShareBoostOutput {
  const title = idea.title || "this app idea";
  const shareUrl = idea.id
    ? `https://app-gardenium.com/ideas/${idea.id}`
    : "https://app-gardenium.com";
  if (language === "ja") {
    return {
      intent: "tester_call",
      shortPost: `${title} の初期版を作っています。MVPの方向性にフィードバックをもらえたら嬉しいです。`,
      friendlyPost: `${title} を試作中です。小さく使ってもらいながら、どこが便利でどこが迷うかを知りたいです。`,
      testerCallPost: `${title} の初期テスターを探しています。触ってみて、最初に期待したこと・迷った点・次にほしい機能を教えてください。`,
      hashtags: ["#個人開発", "#アプリ開発", "#AppGardenium"],
      shareUrl,
    };
  }
  return {
    intent: "tester_call",
    shortPost: `Building ${title}. I would love feedback on the MVP direction.`,
    friendlyPost: `I am prototyping ${title} and looking for a few people to react to the first small version.`,
    testerCallPost: `Looking for early testers for ${title}. Try the first MVP and tell me what felt useful, confusing, and worth building next.`,
    hashtags: ["#indieapp", "#buildinpublic", "#AppGardenium"],
    shareUrl,
  };
}

async function loadOwnedIdea(ideaId: string, userId: string) {
  const ideaRef = adminDb.collection("ideas").doc(ideaId);
  const ideaDoc = await ideaRef.get();
  if (!ideaDoc.exists) {
    throw new Error("Idea not found.");
  }
  const idea = ideaDoc.data() || {};
  if (idea.authorId !== userId) {
    throw new Error("Only the idea owner can use Growth Agent for this idea.");
  }
  return { ideaRef, idea };
}

export async function listAgentSuggestions(params: {
  ideaId: string;
  userId: string;
}): Promise<AgentSuggestion[]> {
  await loadOwnedIdea(params.ideaId, params.userId);
  const snap = await adminDb
    .collection("agentSuggestions")
    .where("ideaId", "==", params.ideaId)
    .where("userId", "==", params.userId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AgentSuggestion);
}

export async function runGrowthReview(params: {
  ideaId: string;
  userId: string;
  language: AgentLanguage;
}): Promise<{ runId: string; suggestions: AgentSuggestion[] }> {
  const { ideaRef, idea } = await loadOwnedIdea(params.ideaId, params.userId);
  const runRef = adminDb.collection("agentRuns").doc();
  const now = Date.now();
  const model = resolveGrowthAgentModel("growth_review");

  await runRef.set({
    ideaId: params.ideaId,
    userId: params.userId,
    agentType: "growth_review",
    language: params.language,
    status: "running",
    inputSnapshot: { idea },
    outputSuggestionIds: [],
    model,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const output = process.env.AGENT_MOCK_MODE === "true"
      ? mockGrowthReviewOutput(idea, params.language)
      : await generateStructuredJson<GrowthReviewOutput>({
          systemInstruction: growthSystemInstruction(params.language),
          prompt: buildGrowthReviewPrompt(idea, params.language),
          schema: growthReviewResponseSchema,
          model,
        });

    const suggestions = convertGrowthReviewOutputToSuggestions({
      ideaId: params.ideaId,
      userId: params.userId,
      runId: runRef.id,
      language: params.language,
      output,
      timestamp: now,
    });
    const extraSuggestions = [
      convertStoreReviewReadinessOutputToSuggestion({
        ideaId: params.ideaId,
        userId: params.userId,
        runId: runRef.id,
        language: params.language,
        output: mockStoreReviewReadinessOutput({ ...idea, id: params.ideaId }, params.language),
        timestamp: now,
      }),
      convertShareBoostOutputToSuggestion({
        ideaId: params.ideaId,
        userId: params.userId,
        runId: runRef.id,
        language: params.language,
        output: mockShareBoostOutput({ ...idea, id: params.ideaId }, params.language),
        timestamp: now,
      }),
    ];
    const allSuggestions = [...suggestions, ...extraSuggestions];

    const batch = adminDb.batch();
    for (const suggestion of allSuggestions) {
      batch.set(adminDb.collection("agentSuggestions").doc(suggestion.id), suggestion);
    }
    batch.update(runRef, {
      status: "succeeded",
      outputSuggestionIds: allSuggestions.map((suggestion) => suggestion.id),
      updatedAt: Date.now(),
    });
    batch.update(ideaRef, {
      latestAgentRunId: runRef.id,
      latestGrowthSummary: output.nextActions.summary,
      agentUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return { runId: runRef.id, suggestions: allSuggestions };
  } catch (error: any) {
    await runRef.update({
      status: "failed",
      errorMessage: error?.message || String(error),
      updatedAt: Date.now(),
    });
    throw error;
  }
}
