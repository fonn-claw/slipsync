---
phase: 2
slug: interactive-marina-map
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MAP-01, MAP-04 | unit | `npx vitest run src/__tests__/marina-layout.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | MAP-02, MAP-03, MAP-05, SLIP-03, UX-04 | integration + build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/marina-layout.test.ts` — stubs for layout computation (dock count, slip count, coordinate generation)
- [ ] `src/__tests__/slip-actions.test.ts` — stubs for status change Server Action

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG renders all 4 docks visually | MAP-01 | Visual layout | Navigate to marina map, verify 4 labeled docks visible |
| Slips color-coded by status | MAP-02 | Visual design | Verify green/blue/yellow/red colors match status |
| Detail panel shows vessel info | MAP-03 | Interactive UI | Click occupied slip, verify vessel details shown |
| Map responsive on tablet | MAP-05 | Device-specific | Resize to 768px, verify map scales properly |
| Map is visually stunning | UX-04 | Subjective quality | Screenshot for LinkedIn readiness |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
