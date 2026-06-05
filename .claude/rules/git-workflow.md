# Git Workflow

## Always Pull Main Before Branching

When starting a new feature or fix, **always pull the latest `main`** before creating a branch or worktree.

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main

# Then branch from up-to-date main
git switch -c feat/my-feature
# or
git worktree add .worktrees/my-feature -b feat/my-feature main
```

### Why

- Main moves fast. Branching from a stale local `main` produces conflicts the moment the PR hits GitHub.
- Worktrees inherit the reference commit at creation time — branching from stale `main` cannot be "refreshed" without an explicit rebase/merge.

### When This Rule Applies

| Situation                                    | Required                                                 |
| -------------------------------------------- | -------------------------------------------------------- |
| `git switch -c <new-branch>`                 | `git pull origin main` first                             |
| `git worktree add .worktrees/<name> -b <br>` | `git fetch origin main` first; branch from `origin/main` |
| Starting work on an existing feature branch  | `git fetch && git rebase origin/main`                    |

### If Conflicts Appear Mid-PR

```bash
git fetch origin main
git merge origin/main       # or: git rebase origin/main
# resolve conflicts, then push
```

Merge is safer when the branch is already pushed (preserves PR review history). Rebase is fine before the first push.
