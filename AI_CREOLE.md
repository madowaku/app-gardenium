# AI_CREOLE.md

## Purpose

Compact shared work language for App Gardenium.
Used for human-to-AI and AI-to-AI handoff.

Canonical source: https://github.com/madowaku/ai-creole-dictionary

## Core Tags

ROLE = target agent or responsibility
MODE = reusable working style
TASK = work to perform
GOAL = desired end state
STATE = current known state
CONTEXT = background
INPUT = supplied material
TARGET = files, scenes, objects, docs, or areas to touch
DO = required actions
KEEP = things to preserve
NO = forbidden actions
OUT = expected output format
CHECK = verification items
RISK = likely failure points
NEXT = next action

## Modes

### MODE: web_safe

- no secret exposure
- minimal diff
- preserve existing auth/data flow
- report changed files and checks

### MODE: codex_patch

- inspect existing files first
- make minimal diff
- avoid broad refactor
- report changed files
- include checks

## Terms

Growth Agent = idea diagnosis, MVP planning, tester strategy, and suggestion workflow
idea = user-submitted app idea
salon = community discussion area
membership = billing and access feature area

## Prompt Examples

```text
ROLE: Codex
MODE: web_safe

TASK:
GOAL:
STATE:
TARGET:
DO:
KEEP:
NO:
OUT:
CHECK:
RISK:
NEXT:
```
