# App Gardenium Growth Agent Vertical Slice

## Objective

Implement the smallest demo-ready Growth Agent slice described in `docs/google_ai_agents_challenge_growth_agent_implementation.md`.

## Goal Kind

`specific`

## Current Tranche

Add typed agent suggestions, a mockable Gemini-backed growth review API, human-in-the-loop apply/dismiss flow, and an Idea detail panel that can generate and apply Growth Agent suggestions.

## Non-Negotiable Constraints

- Keep changes minimal and compatible with the existing React/Vite/Express/Firebase app.
- Do not refactor unrelated pages.
- Do not hard-code secrets.
- AI suggestions must be stored as drafts and applied only by user action.
- Prefer demo-ready behavior over broad abstraction.

## Stop Rule

Stop when the tranche audit passes, all safe local work is blocked, or continuing would require owner input, credentials, destructive operations, or strategy the board cannot decide.

Do not stop after planning, discovery, or Judge selection if a safe Worker task can be activated.

## Canonical Board

Machine truth lives at:

`docs/goals/growth-agent-vertical-slice/state.yaml`

If this charter and `state.yaml` disagree, `state.yaml` wins for task status, active task, receipts, verification freshness, and completion truth.

## Run Command

```text
/goal Follow docs/goals/growth-agent-vertical-slice/goal.md through the first safe verified implementation slice. Do not stop after planning unless blocked.
```
