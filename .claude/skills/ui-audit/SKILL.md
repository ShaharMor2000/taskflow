---
name: ui-audit
description: Audit TaskFlow screens for usability, responsiveness, accessibility and visual consistency, and produce a prioritized list of improvements. Use when asked to review, polish or assess the UI/UX of a page, component or flow.
---

# UI audit

Produce findings that an engineer can act on directly. Prefer a few high-impact fixes over many cosmetic ones.

## 1. Review the UI
- Identify the screens in scope (`src/pages/*`, `src/components/**`).
- If the app is running, open each screen in the browser pane (desktop, 768 px, 375 px; light and dark). Otherwise review the components' markup and classes.
- Optionally delegate a first pass to the **ux-designer** subagent.

## 2. Identify usability issues
- Is the primary action obvious? Are there dead ends, ambiguous labels, missing feedback, missing undo for destructive actions, or confirmations where none are needed?
- Are empty, loading and error states present and helpful?

## 3. Verify responsiveness
- No horizontal page scroll at 375 px and 768 px. Quick check in the browser console:
  `document.documentElement.scrollWidth > document.documentElement.clientWidth`
- Touch targets at least 40 px; hover-only controls have a touch equivalent.

## 4. Check accessibility
- Every interactive element has an accessible name (text, `aria-label` or `<label>`).
- Visible focus, full keyboard operation, logical focus order, Escape closes overlays.
- Correct roles; no interactive elements nested inside other interactive elements.
- Contrast in both themes; information never conveyed by color alone; live regions for async feedback.

## 5. Assess visual consistency
- Uses the design system: `.card`, `.btn-*`, `.input`, `src/components/ui/*`, Lucide icons, `rounded-xl/2xl`, the priority palette in `src/lib/tasks.ts`.
- Consistent spacing, typography, toast wording and dark-mode variants.

## 6. Recommend prioritized improvements
Report a table: **severity** (high/medium/low), **screen/file:line**, **issue**, **recommended fix**, **effort** (S/M/L). End with the top three changes to make first.
