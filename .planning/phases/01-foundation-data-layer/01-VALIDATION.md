---
phase: 1
slug: foundation-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01..05 | integration | `npx vitest run src/__tests__/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SLIP-01, SLIP-02 | unit | `npx vitest run src/__tests__/schema.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SEED-01..05 | integration | `npx vitest run src/__tests__/seed.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | UX-01..03 | manual | visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — install test framework
- [ ] `vitest.config.ts` — test configuration
- [ ] `src/__tests__/auth.test.ts` — stubs for AUTH-01..05
- [ ] `src/__tests__/schema.test.ts` — stubs for SLIP-01, SLIP-02
- [ ] `src/__tests__/seed.test.ts` — stubs for SEED-01..05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nautical color palette renders correctly | UX-01 | Visual design check | Login page shows navy/teal/seafoam colors |
| shadcn/ui components styled professionally | UX-02 | Visual quality check | Components have consistent spacing/typography |
| Responsive on tablet | UX-03 | Device-specific | Resize to 768px width, verify sidebar collapses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
