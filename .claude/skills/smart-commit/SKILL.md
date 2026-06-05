---
name: smart-commit
description: >
  This skill should be used when the user asks to "commit", "smart commit",
  "split commit", "論理的にコミット", "diff を見てコミット", "変更をコミット",
  or wants to logically analyze staged/unstaged changes and create well-structured
  Conventional Commits. Dispatches a Sonnet subagent to review diffs, group related
  changes, and produce split commits.
---

# Smart Commit

Analyze git diffs with a Sonnet subagent, logically group related changes, and create
well-structured Conventional Commits split by concern.

## When to Use

- The user asks to commit changes (staged or unstaged)
- The user wants logical, split commits from a mixed set of changes
- The user invokes `/commit` or asks for a "smart commit"

## Workflow

### 1. Gather Current State

Run these commands in parallel to collect context:

```bash
git status
git diff              # unstaged changes
git diff --cached     # staged changes
git log --oneline -10 # recent commit style reference
```

If nothing is staged and there are unstaged changes, use the `AskUserQuestion` tool to ask
the user which files to include before proceeding. Do not auto-stage everything.

### 2. Dispatch Sonnet Subagent for Diff Analysis

Launch an Agent (model: sonnet) to analyze the diff. The subagent prompt must include:

- The full diff output (both staged and unstaged if relevant)
- The list of changed files
- Instructions to return a JSON array of commit groups

**Subagent instructions template:**

```
Analyze this git diff and group the changes into logical commits.

Rules:
- Each group must be a coherent, self-contained unit of work
- Use Conventional Commits format: type(scope): description
- Types: feat, fix, refactor, chore, docs, style, test, perf, ci, build
- Scope is optional but recommended (e.g., feat(auth): add login)
- Description must be lowercase, imperative mood, no period at end
- Keep descriptions under 72 characters
- If all changes belong to one logical unit, return a single group
- Order groups so that foundational changes come first

Return ONLY a JSON array (no markdown fences) with this structure:
[
  {
    "type": "feat",
    "scope": "optional-scope",
    "message": "add user authentication flow",
    "files": ["src/auth.ts", "src/middleware.ts"],
    "reason": "These files together implement the auth feature"
  }
]

Files changed:
{FILE_LIST}

Diff:
{DIFF_CONTENT}
```

### 3. Parse and Confirm

After receiving the subagent's response:

1. Parse the JSON commit groups
2. Present the proposed commits to the user in a clear format:

```
Proposed commits:
  1. feat(auth): add login endpoint
     Files: src/auth.ts, src/middleware.ts
  2. chore(deps): update typescript to v5.8
     Files: package.json, pnpm-lock.yaml
```

3. Use the `AskUserQuestion` tool to ask the user to confirm, modify, or reject the plan

### 4. Execute Commits

For each approved commit group, in order:

```bash
git add <files>
git commit -m "<type>(scope): message"
```

Append the Co-Authored-By trailer to the final commit message:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Use HEREDOC format for commit messages to ensure proper formatting.

### 5. Verify

Run `git log --oneline -N` (where N = number of new commits) to confirm all commits
were created successfully. Show the result to the user.

## Important Constraints

- **Always use `AskUserQuestion`** — when confirmation or input is needed, always use
  the `AskUserQuestion` tool instead of plain text questions
- **Never force-push or amend** existing commits unless explicitly asked
- **Never stage all files blindly** — always confirm file selection with the user
- **Respect .gitignore** — do not commit ignored files
- **Skip empty commits** — if a group has no actual changes, skip it
- **Sensitive files** — warn if .env, credentials, or secrets are in the diff
- **Pre-commit hooks** — if a hook fails, diagnose and fix, then create a NEW commit
- **Model** — always use `model: "sonnet"` for the analysis subagent to keep cost low
  while maintaining quality

## Edge Cases

- **Single logical change**: If Sonnet determines all changes belong together, create one commit
- **Conflicting changes**: If files have both staged and unstaged changes, prefer staged changes
  and warn the user about unstaged portions
- **Large diffs**: If the diff exceeds ~50KB, split by file and send multiple subagent calls
- **No changes**: If git status shows nothing to commit, inform the user and stop
