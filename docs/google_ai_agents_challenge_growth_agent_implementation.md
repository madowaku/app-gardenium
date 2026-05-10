# Codex実装タスクdoc: App Gardenium Growth Agent

## 0. ゴール

Google for Startups AI Agents Challenge応募用に、App Gardeniumへ **Growth Agent** を追加する。

Growth Agentは、App Gardenium上のアプリ案を読み取り、以下を構造化された提案として生成・保存し、ユーザーが採用できるようにする。

- Idea Diagnosis: アイデア診断
- MVP Plan: MVP計画
- Tester Strategy: テスター募集戦略
- Public Page Polish: 公開ページ文言
- Progress Coach: 活動報告から次の一手

このタスクの完了状態は、デモ動画で次のBefore/Afterを見せられること。

Before:

> ユーザーが雑なアプリ案を投稿している。

After:

> Growth Agentが、診断・MVP計画・テスター募集文・フィードバック質問・次の3アクションを生成し、ユーザーが採用ボタンでApp Gardenium内のプロジェクト情報へ反映できる。

---

## 1. 実装方針

### 1.1 最優先の考え方

今回の目的はコンテスト応募用の完成度を上げること。大規模な抽象化より、デモで伝わる「エージェントがプロダクト成長を進めている感」を優先する。

やること:

- 既存の `ideas` / `testerCalls` / `activityReports` に後方互換で追加する
- AI出力はJSON Schemaベースで構造化する
- AI提案は即時反映せず、必ず `agentSuggestions` に保存する
- ユーザーが「採用する」を押したときだけ既存データへ反映する
- 日本語・英語の両方を扱える設計にする

やらないこと:

- 完全自律で勝手に公開する
- 複雑なマルチエージェントオーケストレーション
- 課金実装
- 外部SNSへの自動投稿
- テスター自動マッチングの本実装

---

## 2. 想定スタック

既存構成に合わせる。差分実装でよい。

```txt
Frontend:
  React / Vite / TypeScript

Backend:
  Express or existing API routes
  Cloud Run compatible

Database:
  Firebase Firestore

AI:
  Gemini API or Vertex AI Gemini
  Structured output / JSON schema based responses
```

環境変数例:

```env
GEMINI_API_KEY=...
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_LOCATION=global
GROWTH_AGENT_MODEL=gemini-2.5-flash
```

Secretはソースコードへ直書きしない。Cloud Runで使う場合はSecret Manager経由を優先する。

---

## 3. Firestore設計

### 3.1 新規collection: `agentRuns`

AI実行の履歴。デバッグ、デモ、応募説明に使う。

```ts
type AgentRun = {
  id: string;
  ideaId: string;
  userId: string;
  agentType: "growth_review" | "public_page_polish" | "progress_coach";
  language: "ja" | "en";
  status: "running" | "succeeded" | "failed";
  inputSnapshot: {
    idea?: Partial<Idea>;
    testerCall?: Partial<TesterCall>;
    activityReport?: Partial<ActivityReport>;
  };
  outputSuggestionIds: string[];
  errorMessage?: string;
  model?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
};
```

### 3.2 新規collection: `agentSuggestions`

AIが生成した提案。ユーザーが採用・却下できる。

```ts
type AgentSuggestion = {
  id: string;
  ideaId: string;
  userId: string;
  runId: string;
  type:
    | "idea_diagnosis"
    | "mvp_plan"
    | "tester_strategy"
    | "public_pitch"
    | "progress_next_action";
  language: "ja" | "en";
  status: "draft" | "accepted" | "dismissed";
  title: string;
  summary: string;
  content: Record<string, unknown>;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  acceptedAt?: FirebaseTimestamp;
  dismissedAt?: FirebaseTimestamp;
};
```

### 3.3 既存collectionへの追加フィールド

`ideas` に以下を任意追加する。

```ts
type IdeaAgentFields = {
  latestAgentRunId?: string;
  latestGrowthSummary?: string;
  nextActions?: string[];
  mvpScope?: string[];
  targetUsers?: string[];
  riskNotes?: string[];
  agentUpdatedAt?: FirebaseTimestamp;
};
```

`testerCalls` に以下を任意追加する。

```ts
type TesterCallAgentFields = {
  suggestedTesterPersona?: string;
  suggestedFeedbackQuestions?: string[];
  agentUpdatedAt?: FirebaseTimestamp;
};
```

---

## 4. API設計

### 4.1 `POST /api/agents/growth-review`

アプリ案を診断し、MVP計画・テスター戦略・次アクションを生成する。

Request:

```ts
type GrowthReviewRequest = {
  ideaId: string;
  language?: "ja" | "en";
};
```

Response:

```ts
type GrowthReviewResponse = {
  runId: string;
  suggestions: AgentSuggestion[];
};
```

処理:

1. 認証ユーザーを取得する
2. `ideaId` の所有者または編集可能ユーザーか確認する
3. `ideas/{ideaId}` を取得する
4. `agentRuns` に `running` を作成する
5. Geminiへ構造化プロンプトを投げる
6. 結果を `agentSuggestions` に分割保存する
7. `agentRuns.status = succeeded` に更新する
8. `ideas.latestAgentRunId` と `ideas.latestGrowthSummary` を更新する

エラー時:

- `agentRuns.status = failed`
- `errorMessage` を保存
- HTTP 500または適切なエラーを返す

---

### 4.2 `POST /api/agents/public-page-polish`

公開ページ向けの文言を生成する。

Request:

```ts
type PublicPagePolishRequest = {
  ideaId: string;
  language?: "ja" | "en";
};
```

生成内容:

- improvedTitle
- shortPitch
- longDescription
- seoDescription
- ogpTitle
- ogpDescription
- xPost
- testerCallCopy

---

### 4.3 `POST /api/agents/progress-coach`

活動報告を読み、進捗整理と次のアクションを生成する。

Request:

```ts
type ProgressCoachRequest = {
  ideaId: string;
  activityReportId: string;
  language?: "ja" | "en";
};
```

生成内容:

- progressSummary
- detectedBlockers
- suggestedNextActions
- encouragement
- risksToWatch

---

### 4.4 `POST /api/agents/apply-suggestion`

AI提案を既存データへ反映する。

Request:

```ts
type ApplySuggestionRequest = {
  suggestionId: string;
};
```

処理:

1. `agentSuggestions/{suggestionId}` を取得
2. 権限確認
3. `status !== accepted` を確認
4. `type` ごとに反映先を決める
5. トランザクションで対象doc更新 + suggestion accepted更新

反映ルール:

```ts
switch (suggestion.type) {
  case "idea_diagnosis":
    // ideas.targetUsers, riskNotes, latestGrowthSummaryへ反映
    break;
  case "mvp_plan":
    // ideas.mvpScope, nextActionsへ反映
    break;
  case "tester_strategy":
    // testerCallsを作成または更新
    break;
  case "public_pitch":
    // ideas.title, summary, description, seoDescription等へ反映
    break;
  case "progress_next_action":
    // ideas.nextActions, latestGrowthSummaryへ反映
    break;
}
```

---

## 5. Geminiプロンプト設計

### 5.1 共通system instruction

```txt
You are App Gardenium Growth Agent.
Your job is to help solo app builders turn rough ideas into tested, launchable products.

You must be practical, specific, and kind.
Do not invent unavailable user data.
Do not promise guaranteed business success.
Focus on the next concrete action.
Return only valid JSON that matches the provided schema.
```

日本語用追加:

```txt
回答は自然な日本語で書く。
個人開発者に向けて、やさしく実行可能な表現にする。
専門用語を使う場合は短く補足する。
```

英語用追加:

```txt
Write in clear, friendly English for solo builders.
Avoid hype. Be concrete and actionable.
```

---

### 5.2 Growth Review JSON Schema

```ts
type GrowthReviewOutput = {
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
};
```

---

### 5.3 Growth Review prompt template

```txt
Analyze this App Gardenium idea and generate a practical growth review.

Language: {{language}}

Idea:
- Title: {{idea.title}}
- Short description: {{idea.summary}}
- Long description: {{idea.description}}
- Stage: {{idea.stage}}
- Tags: {{idea.tags}}

Generate:
1. Idea diagnosis
2. MVP plan
3. Tester strategy
4. Next 3 actions

Constraints:
- Keep it realistic for a solo builder.
- Prefer small experiments over large plans.
- Tester questions must be answerable by real users after trying a prototype.
- Output must match the JSON schema exactly.
```

---

## 6. Frontend UI

### 6.1 Idea detail pageに追加

`IdeaDetailPage` または相当ページに、以下のセクションを追加する。

```txt
Growth Agent Panel

[AI Growth Reviewを作成]
[公開ページ文言を整える]

最新のAI提案:
- Idea Diagnosis card
- MVP Plan card
- Tester Strategy card
- Next Actions card
```

各カード:

- タイトル
- summary
- 主要項目の箇条書き
- `採用する` ボタン
- `却下する` ボタン
- `コピー` ボタン

### 6.2 Activity report detailに追加

活動報告の下に以下を追加する。

```txt
Progress Coach
[この活動報告から次の一手を考える]
```

出力カード:

- progress summary
- blocker detection
- next actions
- encouragement

---

## 7. UIコピー

日本語:

```txt
AI Growth Reviewを作成
このアプリ案を診断して、MVP計画・テスター募集・次の3アクションを作ります。

採用する
この提案をプロジェクトに反映します。

却下する
この提案を使わずに閉じます。
```

英語:

```txt
Create AI Growth Review
Diagnose this app idea and generate an MVP plan, tester strategy, and next 3 actions.

Apply
Apply this suggestion to the project.

Dismiss
Dismiss this suggestion.
```

---

## 8. 実装ファイル案

既存構成に合わせて調整してよい。

```txt
server/
  agents/
    growthAgent.ts
    schemas.ts
    prompts.ts
  routes/
    agentRoutes.ts
  services/
    geminiClient.ts
    agentSuggestionService.ts

src/
  components/
    agents/
      GrowthAgentPanel.tsx
      AgentSuggestionCard.tsx
      ProgressCoachPanel.tsx
  hooks/
    useAgentSuggestions.ts
    useRunGrowthAgent.ts
  types/
    agents.ts
```

---

## 9. 実装ステップ

### Step 1: 型定義を追加

- `AgentRun`
- `AgentSuggestion`
- `GrowthReviewOutput`
- `PublicPagePolishOutput`
- `ProgressCoachOutput`

完了条件:

- TypeScriptで型エラーが出ない
- `agentSuggestions.content` は型安全に扱える補助関数を用意する

---

### Step 2: Gemini clientを追加

`server/services/geminiClient.ts`

必要機能:

```ts
async function generateStructuredJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  schema: unknown;
  model?: string;
}): Promise<T>
```

要件:

- JSON SchemaまたはresponseSchemaを使う
- 失敗時に読みやすいエラーを投げる
- API key未設定時は明確に失敗する
- local dev用にmock modeを用意してもよい

Mock mode案:

```env
AGENT_MOCK_MODE=true
```

---

### Step 3: Growth Agent serviceを追加

`server/agents/growthAgent.ts`

必要関数:

```ts
export async function runGrowthReview(params: {
  ideaId: string;
  userId: string;
  language: "ja" | "en";
}): Promise<{ runId: string; suggestions: AgentSuggestion[] }>;
```

内部処理:

- idea取得
- agentRun作成
- prompt生成
- Gemini実行
- outputをsuggestionsへ変換
- Firestore保存
- run更新

---

### Step 4: API routeを追加

`server/routes/agentRoutes.ts`

Routes:

```ts
router.post("/agents/growth-review", requireAuth, growthReviewHandler);
router.post("/agents/public-page-polish", requireAuth, publicPagePolishHandler);
router.post("/agents/progress-coach", requireAuth, progressCoachHandler);
router.post("/agents/apply-suggestion", requireAuth, applySuggestionHandler);
router.post("/agents/dismiss-suggestion", requireAuth, dismissSuggestionHandler);
```

Validation:

- `ideaId` required
- `language` default `ja`
- user permission check required

---

### Step 5: Firestore apply transactionを追加

`server/services/agentSuggestionService.ts`

必要関数:

```ts
export async function applySuggestion(params: {
  suggestionId: string;
  userId: string;
}): Promise<void>;

export async function dismissSuggestion(params: {
  suggestionId: string;
  userId: string;
}): Promise<void>;
```

要件:

- トランザクションで二重採用を防ぐ
- 他人のsuggestionは操作できない
- 反映できないtypeはエラーにする
- `acceptedAt` / `dismissedAt` を保存する

---

### Step 6: GrowthAgentPanelを追加

`src/components/agents/GrowthAgentPanel.tsx`

Props:

```ts
type GrowthAgentPanelProps = {
  ideaId: string;
  ownerUserId: string;
  currentUserId?: string;
  language?: "ja" | "en";
};
```

表示条件:

- ownerまたは編集権限があるユーザーにだけ生成ボタンを表示
- 閲覧者には採用済みの要約だけ見せてもよい

状態:

- idle
- running
- succeeded
- failed

---

### Step 7: AgentSuggestionCardを追加

`src/components/agents/AgentSuggestionCard.tsx`

Props:

```ts
type AgentSuggestionCardProps = {
  suggestion: AgentSuggestion;
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
};
```

要件:

- typeごとに見やすくrenderする
- raw JSONは通常表示しない
- デモ用に「コピー」ボタンを付ける
- accepted/dismissedの状態表示を付ける

---

### Step 8: Public Page Polishを追加

時間がなければStep 8は簡易でよい。

優先生成:

- shortPitch
- seoDescription
- xPost
- testerCallCopy

採用時反映:

- `ideas.summary`
- `ideas.seoDescription`
- `testerCalls.copy` または類似フィールド

---

### Step 9: Progress Coachを追加

活動報告ページに追加する。

最小実装:

- activityReport本文を読む
- progressSummary / blockers / nextActions を生成
- `progress_next_action` suggestionとして保存
- 採用時に `ideas.nextActions` へ反映

---

## 10. セキュリティ・権限

最低限守ること:

- APIは認証必須
- `ideaId` の所有者チェック必須
- `agentSuggestions` は本人だけ作成・更新可能
- AI生成結果をそのまま危険なHTMLとしてrenderしない
- Secretはコードに書かない

Firestore Rules例は既存ルールに合わせて調整する。

```txt
match /agentSuggestions/{suggestionId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && resource.data.userId == request.auth.uid;
  allow delete: if false;
}
```

Backend Admin SDKを使う場合でも、アプリ側で権限チェックを必ず行う。

---

## 11. テスト

### 11.1 Unit tests

- prompt builderが必要情報を含む
- output converterがAgentSuggestionへ変換できる
- applySuggestionがtypeごとに正しいdocを更新する
- accepted済みsuggestionを再採用できない

### 11.2 Manual tests

デモ用シナリオ:

```txt
Title:
  Cat Desktop Buddy

Description:
  I want to build a desktop pet app that turns my cat photos into cute animated companions.

Expected:
  - target users include cat lovers / desktop pet fans
  - MVP includes photo upload / desktop companion display / basic reactions
  - tester call is generated
  - feedback questions are practical
  - next 3 actions are small and realistic
```

---

## 12. デモ完成条件

以下ができたら応募デモに使える。

- 雑なアプリ案を1件作成できる
- Idea detailで `AI Growth Reviewを作成` を押せる
- 10〜30秒程度で提案カードが表示される
- MVP Planを採用すると `ideas.mvpScope` / `ideas.nextActions` に反映される
- Tester Strategyを採用するとテスター募集文と質問が反映される
- Public Page PolishでSEO文とX投稿文が生成される
- Activity ReportからProgress Coachを実行できる
- `agentRuns` に実行ログが残る
- `agentSuggestions` に提案とステータスが残る

---

## 13. README追記案

```md
## App Gardenium Growth Agent

Growth Agent helps solo builders turn rough app ideas into tested, launchable products.

It analyzes each idea, creates an MVP plan, suggests a tester strategy, polishes the public project page, and follows up from progress reports.

The agent is human-in-the-loop: suggestions are saved as drafts, and users decide what to apply.
```

---

## 14. Codexへの最初の指示

```txt
Please implement the App Gardenium Growth Agent described in docs/google-ai-agents-challenge-growth-agent.md.

Start with the smallest demo-ready vertical slice:

1. Add AgentRun and AgentSuggestion types.
2. Add Firestore persistence for agentRuns and agentSuggestions.
3. Implement POST /api/agents/growth-review.
4. Implement a Gemini structured-output client with a mock mode fallback.
5. Add GrowthAgentPanel to the idea detail page.
6. Add AgentSuggestionCard with Apply / Dismiss / Copy actions.
7. Implement applySuggestion for mvp_plan and tester_strategy first.

Keep changes minimal and compatible with the existing App Gardenium codebase.
Do not refactor unrelated pages.
Use clear TypeScript types and add basic tests for output conversion and applySuggestion.
```

---

## 15. 優先順位

最短で勝てる順:

1. `growth-review` API
2. `agentRuns` / `agentSuggestions` 保存
3. Idea detailの提案カード表示
4. Apply flow
5. Public Page Polish
6. Progress Coach
7. 見た目 polish
8. README / demo script

---

## 16. 注意点

- AIの出力は必ず構造化する
- 生成結果は必ず人間が採用する
- 1回のAI実行で複数suggestionを作る
- デモでは「思いつきが成長計画になる」体験を最優先にする
- 実装で迷ったら、完璧な汎用化よりデモの一貫性を優先する

