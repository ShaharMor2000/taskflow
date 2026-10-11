# TaskFlow

Local-first task and project management web app. React 18 + TypeScript (strict) + Vite 5 + Tailwind CSS 3, Framer Motion, Recharts (lazy-loaded), Lucide icons, Vitest. No backend: all data lives in the browser's LocalStorage.

## Commands

```bash
npm run dev            # dev server (http://localhost:5173)
npx tsc --noEmit       # type check
npm test               # Vitest (src/**/*.test.ts)
npm run build          # type check + production build
```

## Architecture

- `src/types/index.ts` — data model (`Task`, `Project`, `AppData`, …).
- `src/lib/` — pure business logic, no React: dates, recurrence, tasks (filters/sort/search), stats, storage (validation + migration), sample data. Tests live next to it as `*.test.ts`.
- `src/store/DataContext.tsx`, `src/store/UIContext.tsx` — each split into a **state** context and a **stable actions** context. Prefer `useDataActions()` / `useUIActions()` / `useClock()` / `useDataState()` / `useUIState()` in frequently rendered components; `useData()` / `useUI()` combine them. Use `getState()` / `getUIState()` inside event handlers.
- `src/components/ui/` — design-system primitives (Modal, Drawer, Toast, ConfirmDialog, Menu, Controls, Checkbox, Badges, Progress, Skeleton, EmptyState, StatCard, ChartKit). `src/index.css` defines `.card`, `.btn-*`, `.input`, `.label`, `.kbd`.
- `src/pages/` — one lazily loaded component per route (hash routing in `UIContext`).
- `src/hooks/` — keyboard shortcuts, board drag and drop, list navigation, layers (modal focus/Escape), task actions with undo.

## Conventions

- Reuse existing primitives and classes; no new runtime dependency without a clear reason.
- Every control: accessible name, keyboard support, visible focus, `dark:` variant, works at 375 px.
- Memoized list items (`TaskRow`, board cards) need stable props; derive data with `useMemo`.
- Validate all untrusted input (imports, AI output, URL hash) before use.
- Comments explain *why*, not *what*. Match the surrounding style.

## Data persistence and migrations

- Storage key `taskflow:data:v1` (never rename). Shape version is `DATA_VERSION` in `src/lib/storage.ts`.
- Every load goes through `sanitizeData`, which validates, repairs and fills defaults. Older data is backed up to `taskflow:backup:before-v2` before its first migration.
- Changing the data model: add the field with a safe default in `sanitizeData`, bump `DATA_VERSION` if the shape changes, and add a test to `src/lib/storage.test.ts`. Never drop or rename stored fields without a migration.
- UI preferences (filters, sort, sidebar) live separately under `taskflow:ui-prefs`.

## Skills (`.claude/skills/`)

| Skill | Use for |
|---|---|
| `feature-development` | New features and significant enhancements, end to end |
| `ui-audit` | Reviewing usability, responsiveness, accessibility, consistency |
| `bug-fix` | Reproduce → root cause → regression test → minimal fix |
| `quality-gate` | Type check, tests, build, regression and security review |
| `git-workflow` | Commits, pushing the feature branch, verifying the remote |

## Subagents (`.claude/agents/`) and when to delegate

| Agent | Delegate when | Access |
|---|---|---|
| `product-manager` | Scoping a feature: MVP, acceptance criteria, edge cases | read-only |
| `ux-designer` | Designing or reviewing flows, layout, accessibility | read-only |
| `ai-engineer` | Anything involving AI providers, generated output, keys | read-only |
| `frontend-engineer` | Implementing an approved spec | full |
| `qa-engineer` | Writing tests, regression hunting, verifying migrations | tests only |
| `code-reviewer` | Reviewing the final diff before commit/push | read-only |

Run independent analysis agents in parallel. Never let two agents edit the same files at the same time. The main agent integrates results and remains responsible for the final verification.

## Git workflow

- Work on feature branches (`feature/taskflow-vN`); never commit directly to `main` and never merge into `main` without the owner's explicit approval.
- Author: `ShaharMor2000 <shaharmor12341@gmail.com>` (repo-local config). Logical commits with descriptive messages.
- **No** `Co-Authored-By`, Claude or Anthropic attribution in commits or PRs.
- Push with the GitHub CLI credential helper if needed (see `.claude/skills/git-workflow/SKILL.md`).

## Security rules

- Never put API keys or secrets in frontend code or `VITE_*` variables — everything Vite bundles is public. Secrets belong on a server.
- The browser must never call a paid AI provider directly; it calls our own endpoint, which holds the key.
- Do not activate a paid provider without the owner's approval.
- Treat AI/model output and imported files as untrusted: validate, clamp, cap sizes, never render as HTML.
- AI-generated tasks are proposals; never save them without explicit user approval.
