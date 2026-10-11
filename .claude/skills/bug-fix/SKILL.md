---
name: bug-fix
description: Disciplined workflow for fixing a TaskFlow bug - reproduce it, find the root cause, add a failing regression test, apply the smallest correct fix, run the relevant tests and document the resolution. Use when something is broken, behaves unexpectedly or a test fails.
---

# Bug fix

## 1. Reproduce the bug
- Write down exact steps, expected vs actual behavior, and the environment (page, viewport, theme, data).
- Reproduce it: in the running app (browser pane) or with a minimal script/test. If you cannot reproduce it, say so and gather more information before changing code.

## 2. Identify the root cause
- Trace the code path end to end (`src/lib` → `src/store` → component). Fix causes, not symptoms.
- Check whether the same pattern exists elsewhere.

## 3. Add a regression test
- When the bug lives in pure logic (`src/lib/`), add a test to the matching `*.test.ts` that fails before the fix.
- Use explicit dates and fixed data so the test is deterministic.
- For UI-only bugs without a component test setup, document a precise manual reproduction and verify it in the browser after the fix.

## 4. Apply a minimal fix
- Change as little as possible; no drive-by refactors.
- Preserve saved data: if the bug corrupted stored data, repair it in `sanitizeData` (`src/lib/storage.ts`) with a test.

## 5. Run relevant tests
- `npx vitest run <file>` for the affected area, then the full **quality-gate** (`npx tsc --noEmit`, `npm test`, `npm run build`).
- Re-run the original reproduction steps and confirm the bug is gone.

## 6. Document the resolution
- Commit message: what was broken, why, and how it was fixed (see **git-workflow**).
- Report: root cause, fix, test added, verification performed.
