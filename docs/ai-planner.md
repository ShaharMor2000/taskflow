# AI Planner — specification

Integrated from the product-manager, ux-designer and ai-engineer subagents. Where they disagreed, the decision below is final.

## Scope (MVP)

- New page **AI Planner** (`#/planner`, sidebar after "My Tasks", Lucide `Sparkles`, shortcut `G` then `I`, command-palette entry "Go to AI Planner").
- The user enters a goal (3–500 chars), an optional deadline (today … today+365) and an optional project, then generates a plan.
- The plan is a list of editable **proposals**. Nothing is written to the task store until the user clicks **Add N tasks**.
- **Demo mode is the only active provider.** It is deterministic, offline and always clearly labeled as not AI-generated.
- An HTTP provider exists in code but is **disabled** unless a non-secret endpoint path is configured at build time (`VITE_PLANNER_ENDPOINT`). No backend and no paid provider are activated (needs owner approval).
- No data-model change: `DATA_VERSION` stays 2.

Out of scope: a backend/serverless function, real AI calls, streaming, chat refinement, per-row regeneration, recurring suggestions, plan history persistence.

## Decisions (conflicts resolved)

| Topic | Decision |
|---|---|
| Estimated duration storage | In the saved task's **description** (not notes, not a new field). Fixed line format `Estimated time: 1h 30m` so a future migration can parse it. Followed by a provenance line `Planned with AI Planner (demo) from goal: "<goal ≤ 200 chars>"`. |
| Marking saved tasks | Tag `ai-plan` on every saved task. |
| After saving | The plan is cleared and a success panel replaces it ("N tasks added" · **View tasks** · **Plan something else**). Success toast offers **Undo** (deletes exactly the created tasks). Unselected proposals are discarded. |
| Duplicate protection | Synchronous `savingRef` guard + disabled button; the plan is cleared in the same handler, so it cannot be saved twice. Generate is disabled while generating; every request has an id and stale/aborted results are ignored. |
| Batch save | New `createTasks(inputs, activityMessage)` data action: assigns increasing `order` values and logs one activity entry. Calling `createTask` N times in one event gives every task the same `order` (stateRef is only refreshed on render). |
| Limits | Goal 3–500; ≤ 10 suggestions; title 1–200; description ≤ 1000; ≤ 8 subtasks from a provider (users may add up to 20 while editing), each 1–200; estimate 15–480 min in 15-min steps, default 60. |
| Dates | Effective deadline = explicit deadline ?? phrase parsed from the goal ?? today+7. Provider dates outside [today, deadline] are clamped and flagged "Date adjusted"; invalid/missing dates are spread evenly. User-edited dates are not clamped; a date after the deadline shows a non-blocking "After your deadline" warning. A deadline before today is rejected in the form. |
| Demo loading state | The page adds a short artificial delay (≈600 ms, abortable) for the demo provider so the loading state is real; the generator itself has no timers or randomness. |
| Save bar | `sticky bottom-4` inside the page (natural tab order), styled like the bulk action bar. |
| Regenerate / New plan | If a plan is shown, confirm "Discard this plan?" first. |

## Architecture (`src/lib/ai/`, pure TypeScript, no React)

| File | Contents |
|---|---|
| `types.ts` | `PlanRequest`, `PlanSuggestion`, `Plan`, `PlanWarning`, `PlanError`, `PlanResult`, `PlanProvider` |
| `limits.ts` | `PLAN_LIMITS`, `ESTIMATE_OPTIONS` |
| `errors.ts` | `planError(kind, extra?)` with fixed user-facing messages (never echo server/model text) |
| `deadline.ts` | `parseDeadlinePhrase(text, today)`, `resolveDeadline(request)` |
| `classify.ts` | `classifyGoal(goal)`, `extractTopic(goal)` |
| `templates.ts` | step templates per goal kind (project, study, writing, event, generic) |
| `demo.ts` | `generateDemoPlan(request)` (raw output), `demoProvider` |
| `validate.ts` | `validateRequest`, `validatePlan(raw, ctx)` — used for **every** provider |
| `http.ts` | `createHttpProvider({ endpoint, timeoutMs, fetchImpl? })` |
| `config.ts` | `resolvePlannerConfig(env)`, `getActiveProvider(config)` |
| `toTaskInput.ts` | `suggestionToTaskInput(s, ctx)`, `formatEstimate(min)` |
| `index.ts` | facade re-exports |

`PlanProvider.generate(request, signal): Promise<PlanResult>` never throws. Error kinds: `invalid_request`, `not_configured`, `network`, `timeout`, `aborted` (silent), `rate_limited`, `http`, `too_large`, `malformed`, `empty`.

## Backend contract (for a future, owner-approved endpoint)

`POST /api/plan` (same origin), JSON body ≤ 4 KB:

```json
{ "version": 1, "goal": "…", "deadline": "2026-10-15", "today": "2026-10-11", "projectName": "Website" }
```

`200` response, body ≤ 64 KB:

```json
{ "version": 1, "providerLabel": "AI planner",
  "suggestions": [{ "title": "…", "description": "…", "priority": "high", "estimateMinutes": 90, "dueDate": "2026-10-13", "subtasks": ["…"] }] }
```

Errors: `400` bad request, `429` (+ `Retry-After`), `502` upstream, `503` unavailable. The client maps status codes to fixed messages.

Server responsibilities: hold the provider key in its own environment (never `VITE_*`, never in the repo); reject oversized input; rate-limit per IP and cap daily spend; 15 s upstream timeout; put the goal only in the user turn as data with a fixed system prompt and use the provider's JSON/structured-output mode; validate output with the same rules before replying. The browser never calls a vendor domain. Owner decisions pending: whether to use a paid provider, which one, hosting, spend cap, and a privacy notice.
