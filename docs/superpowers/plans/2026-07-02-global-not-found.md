# 共通 404 ページ配線 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 未マッチ URL(例 `/foobar`)で既存のスタイル済み 404(`(site)/not-found.tsx`)が表示されるよう、`(site)` に catch-all route を追加する。

**Architecture:** multiple root layouts 構成((site)/(payload))のため root `not-found.tsx` は置けない。代わりに `(site)` 直下の catch-all `[...not-found]/page.tsx` が全未マッチ URL を受けて `notFound()` を throw し、既存の `(site)/not-found.tsx` boundary に委譲する。静的セグメント(`/admin`, `/api`, `robots.txt` 等)は dynamic より優先されるため既存ルートに影響しない。

**Tech Stack:** Next.js 15.3.9 App Router / vitest (node env: `*.test.ts`) / tsgo typecheck / oxlint+oxfmt

## Global Constraints

- 関数は arrow function のみ(`const fn = () => {}`)
- テストは実装に colocate する
- `*.test.ts` は node 環境で走る(DOM 不要のテストは `.ts`)
- 実装完了後は必ず `pnpm lint && pnpm typecheck` を通すこと
- `(site)/not-found.tsx`・ErrorScreen・(payload) には触れない
- Next 15.3.9 の `notFound()` は message=digest=`NEXT_HTTP_ERROR_FALLBACK;404` の Error を throw する

---

### Task 1: catch-all route(TDD)

**Files:**

- Create: `src/app/(site)/[...not-found]/page.tsx`
- Test: `src/app/(site)/[...not-found]/page.test.ts`

**Interfaces:**

- Consumes: `notFound` from `next/navigation`
- Produces: default export の Server Component(呼ぶと必ず notFound エラーを throw)。他タスクからの依存なし。

- [ ] **Step 1: Write the failing test**

```ts
// src/app/(site)/[...not-found]/page.test.ts
import { describe, expect, it } from 'vitest';

import CatchAllNotFound from './page';

describe('CatchAllNotFound', () => {
  it('throws the Next.js notFound error (digest NEXT_HTTP_ERROR_FALLBACK;404)', () => {
    expect(() => CatchAllNotFound()).toThrowError('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/(site)/[...not-found]/page.test.ts"`
Expected: FAIL — `Failed to resolve import "./page"`(ファイル未作成)

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/(site)/[...not-found]/page.tsx
import { notFound } from 'next/navigation';

const CatchAllNotFound = () => {
  notFound();
};

export default CatchAllNotFound;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/(site)/[...not-found]/page.test.ts"`
Expected: PASS (1 passed)

- [ ] **Step 5: Lint & typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: どちらも exit 0

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/[...not-found]/page.tsx" "src/app/(site)/[...not-found]/page.test.ts"
git commit -m "feat: route unmatched URLs to the shared 404 page via catch-all"
```

---

### Task 2: 実挙動の検証(dev server)

**Files:** 変更なし(検証のみ)

**Interfaces:**

- Consumes: Task 1 の catch-all route
- Produces: なし(検証結果の報告のみ)

- [ ] **Step 1: dev server をバックグラウンド起動**

Run: `pnpm dev`(background, worktree 内)
Expected: `Ready` ログ。※ port 3000 が使用中なら 3001 に自動フォールバックするので、以降の curl は実際の port を使う。

- [ ] **Step 2: 未マッチ URL が styled 404 になることを確認**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/this-page-does-not-exist`
Expected: `404`

Run: `curl -s http://localhost:3000/this-page-does-not-exist | grep -c "not found"`
Expected: 1 以上(ErrorScreen の `// 404 — not found` kicker が HTML に含まれる)。Next デフォルト 404 の `This page could not be found` が **含まれない** ことも確認:
`curl -s http://localhost:3000/this-page-does-not-exist | grep -c "This page could not be found"` → 0

- [ ] **Step 3: 深いパス・既存ルートの無影響を確認**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/works/a/b/c   # 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/              # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/works         # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/robots.txt    # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin         # 200 か 3xx(payload が処理していれば OK)
```

- [ ] **Step 4: dev server を停止**

起動した background シェルを kill する(TaskStop / kill)。ユーザーの main repo の dev server ではないことを確認してから止めること。

- [ ] **Step 5: 全テストスイートを実行**

Run: `pnpm test`
Expected: 既存 870+ 件 + 新規 1 件すべて PASS
