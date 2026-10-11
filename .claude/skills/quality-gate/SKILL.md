---
name: quality-gate
description: Run TaskFlow's full quality gate - TypeScript check, Vitest suite, production build, regression and security review - and report a clear pass/fail result. Use before committing, before pushing, or whenever asked to verify or validate the project.
---

# Quality gate

Run every step and report actual results. A step that was not run is reported as **not run**, never as passed.

## 1. TypeScript
```bash
npx tsc --noEmit
```
Pass = no output, exit code 0.

## 2. Automated tests
```bash
npm test
```
Record the number of test files and tests passed/failed. Any failure fails the gate.

## 3. Production build
```bash
npm run build
```
Pass = `✓ built`. Note the size of the main `index-*.js` chunk; flag a large unexplained increase. The charts chunk (~546 kB) is expected and only loaded lazily.

## 4. Check for regressions
- `git diff main...HEAD --stat` to see what changed.
- If `src/types` or `src/lib/storage.ts` changed: confirm a migration and a test in `src/lib/storage.test.ts`; old data must still load.
- If UI changed and the app is running: open the affected pages, check the console for errors, and check phone width for horizontal overflow.

## 5. Review security-sensitive changes
Search the diff for:
- Secrets or keys: `git diff main...HEAD | grep -inE "api[_-]?key|secret|token|sk-[a-z0-9]"` (anything bundled by Vite, including `VITE_*`, is public).
- `dangerouslySetInnerHTML`, `eval`, `new Function`, unvalidated external data (imports, AI responses, URL hash).
- New dependencies in `package.json` (justify each).

## 6. Report
| Check | Result | Details |
|---|---|---|
| TypeScript | pass/fail | … |
| Tests | pass/fail | N files, N tests |
| Build | pass/fail | main chunk size |
| Regressions | pass/fail/not run | … |
| Security | pass/fail | … |

Overall: **PASS** only if every executed check passed and nothing required was skipped.
