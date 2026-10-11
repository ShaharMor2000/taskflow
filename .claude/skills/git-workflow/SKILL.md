---
name: git-workflow
description: TaskFlow's Git workflow - check status and branch, review changes, validate, create logical commits authored by ShaharMor2000 with no AI attribution, push the feature branch and verify the remote commit. Never merges into main without explicit approval. Use when committing, pushing or preparing a branch.
---

# Git workflow

## 1. Check Git status
```bash
git status -sb
```
Make sure nothing unexpected is staged or untracked (no `dist/`, `node_modules/`, `.env*`).

## 2. Verify the current branch
- Work only on a feature branch (e.g. `feature/taskflow-v4`). If on `main`, stop and create/switch to a feature branch.
- Confirm the author identity: `git config user.name` must be `ShaharMor2000`, `git config user.email` must be `shaharmor12341@gmail.com`.

## 3. Review changed files
```bash
git diff --stat
git diff
```
Read the diff. Remove debug code, stray files and accidental changes.

## 4. Run validations
Run the **quality-gate** skill. Do not commit failing type checks or tests.

## 5. Create logical commits
- One concern per commit (e.g. tooling/agents, data layer, UI feature, tests, docs). Stage by path: `git add <paths>`.
- Message: short imperative subject (≤ 72 chars), blank line, body explaining what and why.
- **No** `Co-Authored-By`, "Generated with Claude Code", Claude or Anthropic attribution. ShaharMor2000 is the sole author.
- Check afterwards: `git log -1 --format='%an <%ae>%n%B'`.

## 6. Push the feature branch
The GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe`. If plain `git push` cannot authenticate, use its credential helper for that command only:
```bash
git -c credential.helper= -c "credential.helper=!'/c/Program Files/GitHub CLI/gh.exe' auth git-credential" push -u origin <branch>
```

## 7. Verify the remote commit
```bash
"/c/Program Files/GitHub CLI/gh.exe" api repos/ShaharMor2000/taskflow/branches/<branch> --jq '{sha: .commit.sha[0:7], author: .commit.author.login}'
```
The SHA must match `git rev-parse --short HEAD` and the author must be `ShaharMor2000`.

## 8. Never merge into main without approval
Do not merge, rebase onto, or push to `main` unless the owner explicitly approves in this conversation. Offer a pull request instead.
