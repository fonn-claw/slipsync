# AGENTS.md — Build Instructions

## Context
This is a FonnIT daily build project. Read BRIEF.md for what to build.

## CRITICAL: Single-Session Build
Complete the ENTIRE app in this single session. Do NOT stop between phases.
Do NOT suggest `/clear` or context resets. Auto-advance through all phases.
Make ALL domain decisions yourself — reasonable defaults, don't block on questions.

## Methodology
Use GSD (get-shit-done) for the full build lifecycle:
1. Initialize: /gsd:new-project --auto @BRIEF.md (use all recommended defaults)
2. For EACH phase: discuss → ui-spec (if frontend) → plan → execute → verify
3. Auto-advance through ALL phases without human intervention
4. After all phases: /gsd:ship

## UI Quality
This app will be showcased on LinkedIn. Use shadcn/ui, professional spacing,
consistent colors, polished typography. Run /gsd:ui-phase for every phase
with frontend work.

## Standards
- Full test coverage where practical
- Demo data seeded and realistic
- Build must pass before handoff
- Responsive design (mobile-first where applicable)

## Deploy
When finished, push to GitHub:
- git remote add origin https://github.com/fonn-claw/slipsync.git
- git push -u origin main

## On Completion
When completely finished, run:
openclaw system event --text "BUILD COMPLETE: SlipSync — Marina & Boat Slip Management" --mode now
