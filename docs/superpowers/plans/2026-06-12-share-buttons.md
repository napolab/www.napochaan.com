# Share Buttons (ShareBar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** works / news / blog の各詳細ページ末尾に、X(Twitter)共有とリンクコピーの共有バーを追加する。

**Architecture:** 既存の `Button`(`variant="outline"` = 角丸なし border ボックス、≥44px タップ領域、focus ring、href→react-aria Link / onPress→react-aria Button)を再利用し、薄いクライアント島 `ShareBar` がレイアウト・tweet URL 組み立て・copy 状態だけを持つ。URL はサーバ側で `absoluteUrl(path)` により正準絶対 URL を組み、prop で渡す。

**Tech Stack:** Next.js App Router (RSC), React 19, react-aria-components, Panda CSS, vitest(browser + node projects), tsgo, oxlint/oxfmt。

---

## File Structure

| ファイル                                                       | 役割                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/utils/site-url/index.ts` (新規)                           | `absoluteUrl(path)` — `BASE_URL ?? localhost` + path の純粋関数 |
| `src/utils/site-url/index.test.ts` (新規)                      | 上記の node 単体テスト                                          |
| `src/components/share-bar/build-tweet-url.ts` (新規)           | `buildTweetUrl(title, url)` — X intent URL の純粋関数           |
| `src/components/share-bar/build-tweet-url.test.ts` (新規)      | 上記の node 単体テスト                                          |
| `src/components/share-bar/index.tsx` (新規)                    | `ShareBar`(`'use client'`)本体                                  |
| `src/components/share-bar/styles.css.ts` (新規)                | レイアウト用 Panda スタイル                                     |
| `src/components/share-bar/share-bar.test.tsx` (新規)           | copy 挙動の browser テスト                                      |
| `src/app/(site)/works/[id]/page.tsx` (変更)                    | `<AdjacentNav>` 手前に `ShareBar` 挿入                          |
| `src/app/(site)/blog/[id]/page.tsx` (変更)                     | `<BlogNav>` 手前に `ShareBar` 挿入                              |
| `src/app/(site)/news/_components/news-detail/index.tsx` (変更) | `<NewsNav>` 手前に `ShareBar` 挿入                              |
| `src/app/(site)/colophon/content.ts` (変更)                    | `ShareBar` を components.items に登録                           |
| `src/app/(site)/colophon/_demos/index.tsx` (変更)              | `ShareBar` デモを demos マップに追加                            |

---

## Task 1: `absoluteUrl` ユーティリティ

**Files:**

- Create: `src/utils/site-url/index.ts`
- Test: `src/utils/site-url/index.test.ts`

- [ ] **Step 1: Write the failing test**

`src/utils/site-url/index.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { absoluteUrl } from './index';

describe('absoluteUrl', () => {
  const original = process.env.BASE_URL;

  beforeEach(() => {
    process.env.BASE_URL = 'https://www.napochaan.com';
  });

  afterEach(() => {
    process.env.BASE_URL = original;
  });

  it('prefixes the path with BASE_URL', () => {
    expect(absoluteUrl('/works/abc')).toBe('https://www.napochaan.com/works/abc');
  });

  it('falls back to localhost when BASE_URL is unset', () => {
    delete process.env.BASE_URL;
    expect(absoluteUrl('/news/1')).toBe('http://localhost:3000/news/1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/site-url/index.test.ts`
Expected: FAIL — `absoluteUrl` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

`src/utils/site-url/index.ts`:

```typescript
// Build a canonical absolute URL from a root-relative path. Reads BASE_URL at
// call time (per-request on the server) so it reflects the deployed host, with
// the same localhost fallback used by robots / llms.txt.
export const absoluteUrl = (path: string): string => {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  return `${base}${path}`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/site-url/index.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/site-url/index.ts src/utils/site-url/index.test.ts
git commit -m "feat(share): add absoluteUrl util"
```

---

## Task 2: `buildTweetUrl` 純粋関数

**Files:**

- Create: `src/components/share-bar/build-tweet-url.ts`
- Test: `src/components/share-bar/build-tweet-url.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/share-bar/build-tweet-url.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { buildTweetUrl } from './build-tweet-url';

describe('buildTweetUrl', () => {
  it('builds an X intent URL with encoded title and url', () => {
    const result = buildTweetUrl('作品 & タイトル', 'https://www.napochaan.com/works/1');
    expect(result).toBe('https://twitter.com/intent/tweet?text=%E4%BD%9C%E5%93%81%20%26%20%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB&url=https%3A%2F%2Fwww.napochaan.com%2Fworks%2F1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/share-bar/build-tweet-url.test.ts`
Expected: FAIL — module not found / `buildTweetUrl` undefined.

- [ ] **Step 3: Write minimal implementation**

`src/components/share-bar/build-tweet-url.ts`:

```typescript
// Build the X (Twitter) web intent URL. Stateless GET — prefills the compose
// window with the article title as text and the canonical URL.
export const buildTweetUrl = (title: string, url: string): string => {
  const text = encodeURIComponent(title);
  const target = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${target}`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/share-bar/build-tweet-url.test.ts`
Expected: PASS (1 test).

> Note: `encodeURIComponent(' ')` → `%20`, `'&'` → `%26`. If the assertion string mismatches, copy the actual received value into the expectation — the function is correct as long as it uses `encodeURIComponent` on both parts; do not change the implementation to satisfy a hand-typed string.

- [ ] **Step 5: Commit**

```bash
git add src/components/share-bar/build-tweet-url.ts src/components/share-bar/build-tweet-url.test.ts
git commit -m "feat(share): add buildTweetUrl helper"
```

---

## Task 3: ShareBar コンポーネント + styles + browser テスト

**Files:**

- Create: `src/components/share-bar/index.tsx`
- Create: `src/components/share-bar/styles.css.ts`
- Test: `src/components/share-bar/share-bar.test.tsx`

- [ ] **Step 1: Write the failing browser test**

`src/components/share-bar/share-bar.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { ShareBar } from './index';

describe('ShareBar', () => {
  it('exposes an X share link with the tweet intent href', async () => {
    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    const link = page.getByRole('link', { name: /x/i });
    await expect.element(link).toHaveAttribute('href', /twitter\.com\/intent\/tweet/);
    await expect.element(link).toHaveAttribute('target', '_blank');
  });

  it('copies the url and swaps the label to COPIED on press', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<ShareBar url="https://www.napochaan.com/works/1" title="タイトル" />);
    const copy = page.getByRole('button', { name: /copy/i });
    await copy.click();

    expect(writeText).toHaveBeenCalledWith('https://www.napochaan.com/works/1');
    await expect.element(page.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/share-bar/share-bar.test.tsx`
Expected: FAIL — `ShareBar` module not found.

- [ ] **Step 3: Write the styles**

`src/components/share-bar/styles.css.ts`:

```typescript
import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  marginBlock: '8',
});

export const label = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontVariationSettings: '"wght" 600',
  letterSpacing: 'wide',
  color: 'fg.muted',
  textTransform: 'uppercase',
});

export const actions = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
});
```

- [ ] **Step 4: Write the component**

`src/components/share-bar/index.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@components/button';

import { buildTweetUrl } from './build-tweet-url';
import * as styles from './styles.css';

type Props = {
  url: string;
  title: string;
};

// Public detail-page share bar. X (Twitter) is a stateless web-intent link; Copy
// writes the canonical URL to the clipboard and flips its label to a transient
// confirmation. Instagram is intentionally omitted — it has no URL share intent.
export const ShareBar = ({ url, title }: Props) => {
  const [copied, setCopied] = useState(false);

  // Reset the confirmation after a short window. Keyed on `copied` so each
  // successful copy restarts the timer; cleanup prevents a post-unmount setState.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }, [url]);

  return (
    <div className={styles.root} role="group" aria-label="この記事を共有">
      <span className={styles.label} aria-hidden="true">
        ── share
      </span>
      <div className={styles.actions}>
        <Button variant="outline" href={buildTweetUrl(title, url)} target="_blank" rel="noopener noreferrer">
          X ↗
        </Button>
        <Button variant="outline" onPress={handleCopy}>
          {copied ? 'COPIED ✓' : 'COPY'}
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/components/share-bar/share-bar.test.tsx`
Expected: PASS (2 tests).

> If `navigator.clipboard` is undefined in the browser test context, the `vi.spyOn` line throws. In that case, before the spy, define it: `Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });` then `vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);`. Keep the assertions unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/share-bar/index.tsx src/components/share-bar/styles.css.ts src/components/share-bar/share-bar.test.tsx
git commit -m "feat(share): add ShareBar component"
```

---

## Task 4: works 詳細ページへ配線

**Files:**

- Modify: `src/app/(site)/works/[id]/page.tsx`

- [ ] **Step 1: Add the import**

`src/app/(site)/works/[id]/page.tsx` の import 群(`@components/page-header` の近く)に追加:

```typescript
import { ShareBar } from '@components/share-bar';
import { absoluteUrl } from '@utils/site-url';
```

- [ ] **Step 2: Render ShareBar before AdjacentNav**

`WorkDetailPage` の return 内、`<AdjacentNav prev={prev} next={next} />` の直前に挿入:

```tsx
      <ShareBar url={absoluteUrl(`/works/${id}`)} title={work.title} />
      <AdjacentNav prev={prev} next={next} />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS（型エラーなし）。

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/works/\[id\]/page.tsx
git commit -m "feat(share): add ShareBar to works detail"
```

---

## Task 5: blog 詳細ページへ配線

**Files:**

- Modify: `src/app/(site)/blog/[id]/page.tsx`

- [ ] **Step 1: Add the import**

`src/app/(site)/blog/[id]/page.tsx` の import 群に追加:

```typescript
import { ShareBar } from '@components/share-bar';
import { absoluteUrl } from '@utils/site-url';
```

- [ ] **Step 2: Render ShareBar before BlogNav**

`BlogDetailPage` の return 内、`<BlogNav prev={prev} next={next} />` の直前に挿入:

```tsx
      <ShareBar url={absoluteUrl(`/blog/${id}`)} title={post.title} />
      <BlogNav prev={prev} next={next} />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/blog/\[id\]/page.tsx
git commit -m "feat(share): add ShareBar to blog detail"
```

---

## Task 6: news 詳細へ配線

**Files:**

- Modify: `src/app/(site)/news/_components/news-detail/index.tsx`

- [ ] **Step 1: Add the imports**

`src/app/(site)/news/_components/news-detail/index.tsx` の import 群に追加:

```typescript
import { ShareBar } from '@components/share-bar';
import { absoluteUrl } from '@utils/site-url';
```

- [ ] **Step 2: Render ShareBar before NewsNav**

`NewsDetail` の return 内、`<NewsNav prev={prev} next={next} />` の直前に挿入:

```tsx
      <ShareBar url={absoluteUrl(`/news/${item.id}`)} title={item.title} />
      <NewsNav prev={prev} next={next} />
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/news/_components/news-detail/index.tsx
git commit -m "feat(share): add ShareBar to news detail"
```

---

## Task 7: colophon 登録

**Files:**

- Modify: `src/app/(site)/colophon/content.ts`
- Modify: `src/app/(site)/colophon/_demos/index.tsx`

- [ ] **Step 1: Register the catalog entry**

`src/app/(site)/colophon/content.ts` の `components.items` 配列、`FeedLink` のエントリ(`{ name: 'FeedLink', ... }`)の直後に追加:

```typescript
      { name: 'ShareBar', why: '記事末尾の共有バー。X(Twitter)の web intent と、リンクをクリップボードへコピーする2アクション。Instagram は URL 共有導線が無いので置いてない。' },
```

- [ ] **Step 2: Add the demo import**

`src/app/(site)/colophon/_demos/index.tsx` の `@components/*` import 群に追加:

```typescript
import { ShareBar } from '@components/share-bar';
```

- [ ] **Step 3: Add the demo entry**

同ファイルの `demos` マップ(`export const demos: Record<ComponentName, ReactNode> = { ... }`)に、`FeedLink` エントリの直後に追加。href は実 URL を入れ、`NoAction` で遷移を無効化する(rules 準拠):

```tsx
  ShareBar: (
    <NoAction>
      <ShareBar url="https://www.napochaan.com/works/1" title="サンプル作品タイトル" />
    </NoAction>
  ),
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS。`ComponentName` は content から導出されるため、content と demos の両方に `ShareBar` が揃って初めて通る。

- [ ] **Step 5: Commit**

```bash
git add src/app/\(site\)/colophon/content.ts src/app/\(site\)/colophon/_demos/index.tsx
git commit -m "feat(share): register ShareBar in colophon"
```

---

## Task 8: 仕上げ(lint / typecheck / 全テスト)

**Files:** なし(検証のみ)

- [ ] **Step 1: Panda codegen(トークン未追加だが念のため)**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS。oxfmt/oxlint/tsgo すべてエラーなし。

> 既存の `Button` を再利用し新規トークンは追加していないため、追加の `panda codegen` は不要。`@styled/css` の `css()` 呼び出しは既存トークンのみを使用する。

- [ ] **Step 2: 関連テストを実行**

Run: `pnpm vitest run src/utils/site-url src/components/share-bar`
Expected: PASS(absoluteUrl 2 + buildTweetUrl 1 + ShareBar 2 = 5 tests)。

- [ ] **Step 3: ブラウザで目視確認(任意)**

`pnpm dev` は実行しない(ユーザーが起動済みの場合あり)。確認は `/works/<id>`, `/blog/<id>`, `/news/<id>`, `/colophon` で共有バーが本文末尾・prev/next の手前に出ること、COPY 押下で `COPIED ✓` に変わること。

- [ ] **Step 4: difit でレビュー依頼**

実装完了後、`difit` を起動してレビュー依頼する(CLAUDE.md: 実装が終わったら difit を起動)。

---

## Self-Review Notes

- **Spec coverage:** 共有先(X+Copy)= Task 2/3、配置(末尾)= Task 4/5/6、ビジュアル(outline box 再利用)= Task 3、URL 解決(absoluteUrl)= Task 1、テスト(純関数 node + copy browser)= Task 1/2/3、colophon = Task 7。Instagram 除外 = 仕様通り未実装。全カバー。
- **Placeholder scan:** プレースホルダなし。各ステップに実コードあり。
- **Type consistency:** `absoluteUrl(path: string): string`、`buildTweetUrl(title, url)`、`ShareBar({ url, title })` を全タスクで一貫使用。`ShareBar` の prop 名(`url`/`title`)は配線3ページと colophon で一致。
- **DRY:** border box は既存 `Button variant="outline"` を再利用、新規スタイルはレイアウトのみ。`absoluteUrl` は将来の robots/llms.txt 一本化の足がかり(置換は本計画スコープ外)。
