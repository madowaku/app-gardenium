# Store Readiness and Share Boost Demo Slice

## Objective

Add a smallest demo-ready slice that extends Growth Agent with Store Review Readiness and Share Boost/Pollination Share.

## Goal Kind

`specific`

## Current Tranche

Implement mock-mode friendly Store Review Readiness and Share Boost suggestions in the existing Growth Agent flow, with typed outputs, backend persistence, UI rendering, tests, and demo documentation updates.

## Non-Negotiable Constraints

- Do not claim App Store or Google Play approval is guaranteed.
- Use official Apple/Google policy sources only for factual policy statements.
- Keep the Growth Agent demo stable with `AGENT_MOCK_MODE=true`.
- Do not refactor unrelated pages or dirty files.
- Preserve human-in-the-loop suggestion apply/dismiss behavior.

## Stop Rule

Stop when the tranche audit passes, all safe local work is blocked, or continuing would require owner input, credentials, destructive operations, or strategy the board cannot decide.

## Canonical Board

Machine truth lives at:

`docs/goals/store-readiness-share-boost/state.yaml`

## Run Command

```text
/goal Follow docs/goals/store-readiness-share-boost/goal.md through the first safe verified implementation slice. Do not stop after planning unless blocked.
```
