# Google AI Agents Challenge Demo Script

## 1. Demo Setup

Use this demo to show that App Gardenium is not just a place to post app ideas. It now has a Growth Agent that turns a rough idea into a practical launch plan while keeping the builder in control.

Local demo mode:

```bash
AGENT_MOCK_MODE=true npm run dev
```

Default local URL:

```text
http://localhost:3000/ja
```

Recommended recording state:

- Sign in as the idea owner.
- Open an Idea detail page for the sample idea below.
- Make sure the Growth Agent panel is visible in the Overview tab.
- Use `AGENT_MOCK_MODE=true` for a reliable recording if live Gemini access is not needed.
- Keep Firestore open in another tab for optional evidence shots of `agentRuns` and `agentSuggestions`.

## 2. Exact Sample Idea

Title:

```text
Cat Desktop Buddy
```

One-line summary:

```text
I want to build a desktop pet app that turns my cat photos into cute animated companions.
```

Problem details:

```text
People love personalizing their workspace, but most desktop pet apps feel generic. I want something more personal and comforting that uses the user's own cat photos.
```

Target users:

```text
Cat lovers, remote workers, people who like cozy desktop tools, and fans of desktop pet apps.
```

Minimum features:

```text
Upload a cat photo, create a simple animated desktop companion, show idle reactions, and collect feedback from early testers.
```

Tags:

```text
desktop, pets, cats, personalization, indie app
```

## 3. Expected Agent Output

The exact wording can vary in live Gemini mode, but the demo should show these ideas:

- Idea Diagnosis: cat lovers and desktop pet fans are the strongest early users.
- MVP Plan: start with photo upload, a simple desktop companion display, and basic idle animation.
- Tester Strategy: recruit cat owners or remote workers who keep a computer open for long sessions.
- Feedback Questions: ask whether the companion feels personal, where it becomes distracting, and what reaction should come next.
- Next Actions: prototype one flow, recruit three testers, and collect one-day feedback.
- Store Review Readiness: prepare a privacy policy URL, review notes, demo access, and AI/photo handling explanation.
- Share Boost: generate short, friendly, and tester-call social posts.

## 4. 60-90 Second Narration

**Opening, 0-10 seconds**

App Gardenium helps solo builders grow tiny app ideas into testable products. Here is a rough idea: "Cat Desktop Buddy", a desktop pet app made from a user's own cat photos.

**Before, 10-25 seconds**

Right now the idea is charming, but it is still vague. The builder has a concept, a target audience, and a few possible features, but not a clear MVP, tester plan, or next step.

**Agent Run, 25-45 seconds**

I click "Create AI Growth Review". The Growth Agent reads the existing idea, runs a structured Gemini prompt, and saves the result as draft suggestions instead of changing the project automatically.

**After, 45-70 seconds**

Now the builder gets practical cards: Idea Diagnosis, MVP Plan, Tester Strategy, Next Actions, Store Review Readiness, and Share Boost. The suggestions are specific: upload a cat photo, display a simple companion, recruit cat owners, prepare privacy/review notes, and share a tester call post.

**Human in the Loop, 70-90 seconds**

The important part is control. The AI does not publish or rewrite the project by itself. I choose "Apply" on the MVP Plan, and only then App Gardenium updates the project fields. Every agent run and suggestion is stored in Firestore for traceability.

## 5. 2-3 Minute Narration

**Opening, 0-20 seconds**

App Gardenium is a community for solo builders to share early app ideas and grow them with feedback. For the Google AI Agents Challenge, I added a Growth Agent that helps builders move from "interesting idea" to "testable product plan."

**Before State, 20-45 seconds**

This is the starting point: "Cat Desktop Buddy". It is a rough but relatable idea. The builder wants to turn cat photos into cute animated desktop companions. The problem is that the next step is unclear. Should they build animation first? Recruit testers? Polish the public pitch? The idea needs product judgment, not just a chat response.

**Run the Agent, 45-75 seconds**

From the Idea detail page, the owner opens the Growth Agent panel and clicks "Create AI Growth Review". Behind the scenes, the app creates an `agentRuns` record, snapshots the current idea, sends a structured prompt to Gemini, and converts the JSON response into multiple `agentSuggestions`.

**Structured Suggestions, 75-120 seconds**

The output is split into usable cards. Idea Diagnosis clarifies the target user and risks. MVP Plan narrows the first build to a small testable scope. Tester Strategy creates a recruitment angle and practical feedback questions. Store Review Readiness flags launch-preparation risks like privacy policy, review notes, AI disclosure, and metadata clarity. Share Boost turns the idea into social copy the builder can use to recruit testers or ask for feedback.

**Human Approval, 120-155 seconds**

This is intentionally human-in-the-loop. Suggestions stay in draft status until the builder acts. If the builder applies the MVP Plan, App Gardenium updates fields like `mvpScope`, `nextActions`, and `latestGrowthSummary`. If they apply the Tester Strategy, the project can move toward a tester call with persona and feedback questions.

**Traceability, 155-175 seconds**

The agent workflow is also traceable. Firestore stores the run in `agentRuns` and the draft or accepted suggestions in `agentSuggestions`. This makes it possible to debug, audit, and explain what the agent did.

**Closing, 175-190 seconds**

The result is a practical growth assistant for solo builders: it does not replace the maker, but it helps them decide the next small experiment, prepare for store review, and reach real users.

## 6. Screens To Capture

Capture these in order for a clear before/after story:

1. Idea detail page before running the agent.
2. Growth Agent panel with the "Create AI Growth Review" button.
3. Loading or running state after clicking the button.
4. Suggestion cards: Idea Diagnosis, MVP Plan, Tester Strategy, Next Actions, Store Review Readiness, Share Boost.
5. Apply button on the MVP Plan card.
6. Project fields after applying: `mvpScope`, `nextActions`, or `latestGrowthSummary`.
7. Store Review Readiness card showing score, risk level, required assets, and disclaimer.
8. Share Boost card showing short, friendly, and tester-call posts.
9. Optional Firestore evidence: `agentRuns` document with `status: succeeded`.
10. Optional Firestore evidence: `agentSuggestions` documents with `draft` and `accepted` statuses.

## 7. Submission Pitch Snippets

### Project Description

App Gardenium is a community app where solo builders post early app ideas, gather feedback, and grow them toward testable products. The new Growth Agent analyzes each idea and generates a structured growth review: idea diagnosis, MVP plan, tester strategy, store-review readiness, share copy, public pitch direction, and next actions.

### Problem

Solo builders often have promising ideas but get stuck between inspiration and validation. They do not need a generic brainstorm. They need a concrete next experiment, a small MVP scope, and a way to recruit useful early testers.

### Solution

The Growth Agent reads the existing idea in App Gardenium and turns it into draft suggestions the builder can review. It recommends a narrower MVP, identifies early users, drafts tester recruitment copy, proposes feedback questions, flags likely store-review preparation risks, generates social sharing copy, and gives the next three actions.

### Technical Implementation

The agent is implemented as an authenticated Express/Firebase workflow. The backend creates `agentRuns`, calls Gemini with a structured JSON schema, converts the result into typed `agentSuggestions`, and stores each suggestion with `draft`, `accepted`, or `dismissed` status. The React Idea detail page renders the suggestions as actionable cards. Applying a suggestion uses a Firestore transaction to update the project only after explicit user approval.

The Growth Agent can run with Flash-Lite for fast, low-latency structured suggestions, while keeping the model configurable through environment variables. Copy-heavy, share-copy, or final polish tasks can be routed to a stronger Flash model without changing the agent workflow.

### Agent Workflow

1. User opens an idea they own.
2. User clicks "Create AI Growth Review".
3. Backend snapshots the idea and creates an `agentRuns` record.
4. Gemini returns structured JSON.
5. Backend saves multiple `agentSuggestions` as drafts.
6. User reviews cards in the UI.
7. User applies or dismisses each suggestion.
8. Accepted suggestions update the existing project fields.
9. Store readiness suggestions stay framed as preparation guidance, not approval guarantees.

### Business Case

App Gardenium can become the growth layer for indie builders and small teams. The agent makes the product more useful after the first post by helping builders take the next step: validate demand, recruit testers, and polish public positioning. This creates a stronger loop for retention and community activity.

### Innovation

The feature is not a standalone chatbot. It is an embedded agentic workflow inside an existing product surface. It keeps a run history, stores structured suggestions, and uses human approval before changing project data. This makes the AI useful, auditable, and safe for real builders.

### Demo Notes

Use mock mode for stable recordings:

```bash
AGENT_MOCK_MODE=true npm run dev
```

Live Gemini mode can be used by setting `GEMINI_API_KEY` and leaving `AGENT_MOCK_MODE` unset or false.

Recommended live model routing:

```env
GROWTH_AGENT_MODEL=gemini-2.5-flash-lite
GROWTH_AGENT_STRONG_MODEL=gemini-3-flash-preview
GROWTH_AGENT_COPY_MODEL=gemini-3-flash-preview
```

Use the exact official model IDs shown in Google AI Studio or Vertex AI. As of the checked official Gemini API model docs, `gemini-3-flash-preview` is the Gemini 3 Flash preview ID, while Flash-Lite is available as `gemini-2.5-flash-lite`.

## 8. README Snippet

```md
## App Gardenium Growth Agent

Growth Agent helps solo builders turn rough app ideas into tested, launchable products.

It analyzes each idea, creates an MVP plan, suggests a tester strategy, drafts feedback questions, and recommends the next concrete actions.

The agent is human-in-the-loop: suggestions are saved as drafts in `agentSuggestions`, and users decide what to apply. Each run is recorded in `agentRuns` for traceability.

For local demo mode:

\`\`\`bash
AGENT_MOCK_MODE=true npm run dev
\`\`\`

Recommended live model routing:

\`\`\`env
GROWTH_AGENT_MODEL=gemini-2.5-flash-lite
GROWTH_AGENT_STRONG_MODEL=gemini-3-flash-preview
GROWTH_AGENT_COPY_MODEL=gemini-3-flash-preview
\`\`\`
```

## 9. Known Working Tree Notes

Known unrelated dirty files observed during the Growth Agent implementation:

- `firestore.rules`
- `src/components/SalonPage.tsx`

These were pre-existing changes and were not modified as part of the Growth Agent vertical slice.

Known untracked assets observed during the same work:

- `marketing/`
- `docs/google_ai_agents_challenge_growth_agent_implementation.md`

Treat those as separate from the Growth Agent implementation diff unless intentionally staging the broader challenge materials.
