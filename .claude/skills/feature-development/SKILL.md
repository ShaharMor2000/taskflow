---
name: feature-development
description: End-to-end workflow for building a new TaskFlow feature or a significant enhancement - from requirements and acceptance criteria through design, incremental implementation, tests, verification and diff review. Use when asked to add, build or extend functionality (not for small bug fixes; use bug-fix for those).
---

# Feature development

Follow these steps in order. Do not skip verification. Keep the user informed at each milestone.

## 1. Understand requirements
- Restate the goal and the user problem in one or two sentences.
- For anything non-trivial, delegate to the **product-manager** subagent for an MVP scope, acceptance criteria and edge cases. Ask the user only about decisions that genuinely change the outcome.

## 2. Inspect existing code
- Read `CLAUDE.md`, then the relevant files: `src/types/index.ts`, `src/lib/*`, `src/store/*`, the affected pages/components.
- Find what already exists and can be reused. Never rebuild working features.

## 3. Define acceptance criteria
- Numbered, testable Given/When/Then statements, including edge cases (empty, long text, invalid input, dates, mobile, keyboard, dark mode, existing saved data).

## 4. Design the solution
- UI work: get a layout and interaction spec from the **ux-designer** subagent.
- AI work: get a contract and security design from the **ai-engineer** subagent.
- Decide where logic lives: pure logic in `src/lib/` (testable), state in the stores, UI in components.
- If the data model changes, plan the migration in `src/lib/storage.ts` first.
- Independent analysis subagents can run in parallel; implementation must not have two writers on the same files.

## 5. Implement incrementally
- Small, working steps. Reuse `src/components/ui/` primitives and `src/index.css` classes.
- Accessible (names, focus, keyboard), responsive (375 px → desktop), light and dark.
- For larger work, delegate implementation to the **frontend-engineer** subagent with a precise spec.

## 6. Add tests
- Unit tests for every new pure function in `src/lib/` (`*.test.ts`), deterministic (explicit dates, no network, no randomness).
- Migration tests for any data-model change. The **qa-engineer** subagent can add regression tests.

## 7. Verify functionality
- Run the **quality-gate** skill (`npx tsc --noEmit`, `npm test`, `npm run build`).
- Exercise the feature in the running app (browser pane) including error/empty states, keyboard use and phone width.

## 8. Review the diff
- Run the **code-reviewer** subagent on the diff; fix blockers and majors.
- Commit with the **git-workflow** skill.

Report only what you actually ran and observed.
