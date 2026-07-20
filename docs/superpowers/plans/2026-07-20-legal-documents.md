# 法務文書ページ (`/legal`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ソフトウェア販売用の利用規約・免責事項を、安定した公開 URL (`/legal/{slug}`) で配信できるようにする。

**Architecture:** Payload に `legal-documents` collection を新設し、既存 collection と同じ骨格(`slugField()` + published-gate access + `createPublishedTagAndPathRevalidateHooks`)に揃える。公開側は `/legal/[slug]` の ISR ページ 1 本。MCP は既存 blog tools を動かさず、共有が必要な本文パイプラインだけを `tools/shared/` に切り出して `tools/legal/` から再利用する。

**Tech Stack:** Next.js 15 App Router / React 19 / Payload CMS / Panda CSS / neverthrow / zod / vitest (browser + node) / Cloudflare D1

**Spec:** `docs/superpowers/specs/2026-07-20-legal-documents-design.md`

## Global Constraints

- 関数は arrow function のみ(`func-style`)。class メソッドは method shorthand。
- `let` / IIFE / 非 null assertion (`!`) / `forEach` / `any` は禁止。`const` と `for...of` を使う。
- 文字列変換はテンプレートリテラル、数値変換は `parseInt(x, 10)` / `parseFloat`。`String()` / `Number()` / `Boolean()` / `!!` は禁止。
- barrel(再エクスポートのみの `index.ts`)禁止。consumer は実体モジュールを直接 import する。
- 早期 return を優先。ネストは 2 段まで。判別可能な union は網羅 `switch`。
- 頭字語は識別子内で大文字を保つ(`URL` / `ID` / `LLM`)。ただし camelCase の先頭語は全小文字。ファイル名は kebab-case。
- Panda CSS は `strictTokens: true`。トークン外の生値は `'[3px]'` のように角括弧でエスケープする。
- `*.test.tsx` = browser project (chromium)、`*.test.ts` = node project。`window` / `localStorage` / `matchMedia` を触るテストは JSX が無くても `.tsx` にする。
- リンクは `react-aria-components` の `Link`(= `@components/link`)を使う。
- 実装完了時に `pnpm lint && pnpm typecheck` を必ず通す。
- 勝手に commit しない、は本プランには適用しない(各タスク末尾で commit する)。ただし **push と PR 作成はしない**。
- MCP の write path は strict。不正入力は変換せず、回復ヒント付きで reject する(`.claude/rules/mcp-write-strict.md`)。

---

## File Structure

**新規作成**

| パス                                                                             | 責務                          |
| -------------------------------------------------------------------------------- | ----------------------------- |
| `src/collections/legal-documents.ts`                                             | collection 定義               |
| `src/collections/legal-documents.test.ts`                                        | access 制御の検証             |
| `src/lib/payload/legal-documents/index.ts`                                       | 公開側ローダー                |
| `src/lib/payload/legal-documents/legal-documents.test.ts`                        | published フィルタの検証      |
| `src/utils/format-japanese-date/index.ts`                                        | `2026-08-01` → `2026年8月1日` |
| `src/utils/format-japanese-date/format-japanese-date.test.ts`                    | 同上                          |
| `src/app/(site)/legal/layout.tsx`                                                | `<main>` ランドマーク         |
| `src/app/(site)/legal/styles.css.ts`                                             | 同上のスタイル                |
| `src/app/(site)/legal/[slug]/page.tsx`                                           | 詳細ページ (ISR)              |
| `src/app/(site)/legal/[slug]/styles.css.ts`                                      | 同上のスタイル                |
| `src/app/(site)/legal/[slug]/_components/legal-document/index.tsx`               | 表示コンポーネント            |
| `src/app/(site)/legal/[slug]/_components/legal-document/styles.css.ts`           | 同上のスタイル                |
| `src/app/(site)/legal/[slug]/_components/legal-document/legal-document.test.tsx` | 描画テスト                    |
| `src/lib/mcp/tools/shared/tool-result/index.ts`                                  | `ok` / `fail` / `toToolError` |
| `src/lib/mcp/tools/legal/index.ts`                                               | legal MCP tools               |
| `src/lib/mcp/tools/legal/legal.test.ts`                                          | 同上のテスト                  |
| `src/seed/data/legal-documents.json`                                             | seed データ                   |
| `migrations/*_legal_documents.ts`                                                | 自動生成                      |

**変更**

| パス                            | 変更内容                                        |
| ------------------------------- | ----------------------------------------------- |
| `src/payload.config.ts`         | collection 登録                                 |
| `src/utils/cache-tags/index.ts` | `legalDocuments` 追加                           |
| `src/lib/mcp/markdown/index.ts` | `MarkdownCodec` を body 型で generic 化         |
| `src/lib/mcp/tools/index.ts`    | `ok`/`fail`/`toToolError` を shared から import |
| `src/app/api/mcp/route.ts`      | `registerLegalTools` 登録                       |
| `src/seed/export.ts`            | legal の export 追加                            |
| `src/seed/import.ts`            | legal の import 追加                            |
| `src/seed/import.test.ts`       | legal の body media テスト追加                  |

---

### Task 1: `legal-documents` collection

**Files:**

- Create: `src/collections/legal-documents.ts`
- Create: `src/collections/legal-documents.test.ts`
- Modify: `src/payload.config.ts`(import 追加 + `collections` 配列)
- Modify: `src/utils/cache-tags/index.ts`

**Interfaces:**

- Consumes: `slugField` (`./fields/slug`), `createPublishedTagAndPathRevalidateHooks` (`./hooks/revalidate`), `CACHE_TAGS` (`@utils/cache-tags`)
- Produces: `export const LegalDocuments` (`satisfies CollectionConfig`, slug `'legal-documents'`)。生成型 `LegalDocument` が `@payload-types` に生える。フィールドは `slug` / `title` / `effectiveAt` / `body` / `_status`。

- [ ] **Step 1: cache tag を追加する**

`src/utils/cache-tags/index.ts` の `CACHE_TAGS` に 1 行足す(既存の値は変更しない):

```ts
export const CACHE_TAGS = {
  news: 'news',
  works: 'works',
  blog: 'blog',
  gallery: 'gallery',
  logs: 'logs',
  profile: 'profile',
  legalDocuments: 'legal-documents',
} as const;
```

- [ ] **Step 2: 失敗するテストを書く**

`src/collections/legal-documents.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { LegalDocuments } from './legal-documents';

import type { Access } from 'payload';

// access.read は Payload から (args) で呼ばれる。ここでは user の有無だけが効くので
// 最小の args を組んで結果の形を検証する。
const callRead = (user: unknown): unknown => {
  const read = LegalDocuments.access?.read as Access;
  return read({ req: { user } } as unknown as Parameters<Access>[0]);
};

describe('LegalDocuments', () => {
  it('公開側(未ログイン)には published のみを見せる', () => {
    expect(callRead(null)).toEqual({ _status: { equals: 'published' } });
  });

  it('ログイン中は全件見せる', () => {
    expect(callRead({ id: 1 })).toBe(true);
  });

  it('draft を有効にしている', () => {
    expect(LegalDocuments.versions).toEqual({ drafts: true });
  });

  it('slug / title / effectiveAt / body を持つ', () => {
    const names = LegalDocuments.fields.map((field) => ('name' in field ? field.name : undefined));
    expect(names).toEqual(['slug', 'title', 'effectiveAt', 'body']);
  });
});
```

- [ ] **Step 3: テストが落ちることを確認する**

Run: `pnpm vitest run src/collections/legal-documents.test.ts`
Expected: FAIL — `Failed to resolve import "./legal-documents"`

- [ ] **Step 4: collection を実装する**

`src/collections/legal-documents.ts`:

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// ソフトウェア販売に伴う利用規約・免責事項。外部の販売ページから直リンクされる前提で、
// 安定した公開 URL `/legal/{slug}` を持つ。CACHE_TAGS.legalDocuments を落とすとローダーの
// キャッシュが、revalidatePath が path 固定の ISR HTML が飛ぶ。
// 一覧ページは持たないので静的 path の配列は空。
const revalidateLegalDocuments = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.legalDocuments], [], (slug) => `/legal/${slug}`);

export const LegalDocuments = {
  slug: 'legal-documents',
  labels: { singular: '法務文書', plural: '法務文書' },
  admin: {
    group: 'コンテンツ',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'effectiveAt', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  // autosave は付けない。法務文書は書きながら見た目を確認するものではなく、下書きで改訂を
  // 用意して施行日に publish する運用のため、素の drafts で足りる。
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateLegalDocuments.afterChange],
    afterDelete: [revalidateLegalDocuments.afterDelete],
  },
  fields: [
    slugField(),
    {
      name: 'title',
      label: 'タイトル',
      type: 'text',
      required: true,
    },
    {
      // publish 日とは別物。「11/10 に文面を直したが施行は 12/1」が普通に起きるので
      // createdAt/updatedAt を流用せず独立したフィールドとして持つ。
      name: 'effectiveAt',
      label: '施行日',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
        description: 'この文書が効力を持つ日。公開ページの末尾に「YYYY年M月D日 施行」として表示される。',
      },
    },
    {
      name: 'body',
      label: '本文',
      type: 'richText',
      required: true,
    },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `pnpm vitest run src/collections/legal-documents.test.ts`
Expected: PASS(4 tests)

- [ ] **Step 6: payload.config.ts に登録する**

import を既存のアルファベット順に合わせて追加(`src/payload.config.ts` の import ブロック、`Gallery` の次):

```ts
import { LegalDocuments } from './collections/legal-documents';
```

`collections` 配列(現在 156 行目)を書き換える:

```ts
  collections: [Users, Media, News, Works, Blog, Gallery, Logs, LegalDocuments],
```

**seoPlugin(179 行目)と livePreview(142 行目)の `collections` 配列は変更しない。** legal は noindex かつ per-doc の OG 調整が不要で、Live Preview も持たないため意図的に外している。

- [ ] **Step 7: migration を生成して適用する**

Run:

```bash
pnpm payload:migrate:create legal_documents
pnpm payload:migrate
```

Expected: `migrations/` に新ファイルが生成され、migrate が成功する。
失敗して `PAYLOAD_SECRET is required at runtime` が出た場合は `.dev.vars` に `PAYLOAD_SECRET` が無い。`.dev.vars` に追加してから再実行する(`PAYLOAD_SECRET=… pnpm payload …` の前置きはしない)。

- [ ] **Step 8: importmap と型を再生成する**

Run:

```bash
pnpm payload:generate-importmap
pnpm payload generate:types
```

Expected: `src/app/(payload)/admin/importMap.js` と `src/payload-types.ts` が更新され、`LegalDocument` 型が生える。

- [ ] **Step 9: lint と typecheck**

Run: `pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。

- [ ] **Step 10: commit**

```bash
git add src/collections/legal-documents.ts src/collections/legal-documents.test.ts src/utils/cache-tags/index.ts src/payload.config.ts src/payload-types.ts "src/app/(payload)/admin/importMap.js" migrations/
git commit -m "feat(legal): legal-documents collection を追加"
```

---

### Task 2: 公開側ローダー

**Files:**

- Create: `src/lib/payload/legal-documents/index.ts`
- Create: `src/lib/payload/legal-documents/legal-documents.test.ts`

**Interfaces:**

- Consumes: Task 1 の `legal-documents` collection と `CACHE_TAGS.legalDocuments`、`getPayloadClient` (`@lib/payload/client`)
- Produces: `export const findLegalDocumentBySlug = (slug: string): Promise<LegalDocument | undefined>`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/payload/legal-documents/legal-documents.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { findLegalDocumentBySlug } from '.';

const find = vi.fn();

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: async () => ({ find }),
}));

// unstable_ca­che は素通しで実装を呼ぶモックにする(next/cache の実体はテスト環境に無い)。
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe('findLegalDocumentBySlug', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('published のみを引く where 条件で問い合わせる', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, slug: 'terms' }] });

    await findLegalDocumentBySlug('terms');

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        where: { and: [{ slug: { equals: 'terms' } }, { _status: { equals: 'published' } }] },
        limit: 1,
      }),
    );
  });

  it('該当が無ければ undefined を返す', async () => {
    find.mockResolvedValue({ docs: [] });

    await expect(findLegalDocumentBySlug('missing')).resolves.toBeUndefined();
  });

  it('該当があればその doc を返す', async () => {
    find.mockResolvedValue({ docs: [{ id: 1, slug: 'terms', title: '利用規約' }] });

    await expect(findLegalDocumentBySlug('terms')).resolves.toEqual({ id: 1, slug: 'terms', title: '利用規約' });
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `pnpm vitest run src/lib/payload/legal-documents/legal-documents.test.ts`
Expected: FAIL — `Failed to resolve import "."`

- [ ] **Step 3: ローダーを実装する**

`src/lib/payload/legal-documents/index.ts`:

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '@lib/payload/client';

import type { LegalDocument } from '@payload-types';

// `next build` は Payload に不活性な D1 スタブを渡すため、build 時のクエリは throw する。
// build phase では undefined を返し、実データは ISR + collection の afterChange hook で埋まる。
const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API は overrideAccess が既定で true なので、公開側クエリは
// `_status: published` を明示的に絞る必要がある。
const publishedWhere = { _status: { equals: 'published' } } as const;

const fetchLegalDocumentBySlug = unstable_cache(
  async (slug: string): Promise<LegalDocument | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'legal-documents',
      where: { and: [{ slug: { equals: slug } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return doc;
  },
  ['legal-document-by-slug'],
  { tags: [CACHE_TAGS.legalDocuments] },
);

export const findLegalDocumentBySlug = async (slug: string): Promise<LegalDocument | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchLegalDocumentBySlug(slug);
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm vitest run src/lib/payload/legal-documents/legal-documents.test.ts`
Expected: PASS(3 tests)

- [ ] **Step 5: lint と typecheck**

Run: `pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。

- [ ] **Step 6: commit**

```bash
git add src/lib/payload/legal-documents/
git commit -m "feat(legal): 公開側ローダー findLegalDocumentBySlug を追加"
```

---

### Task 3: 日本語日付フォーマッタ

**Files:**

- Create: `src/utils/format-japanese-date/index.ts`
- Create: `src/utils/format-japanese-date/format-japanese-date.test.ts`

**Interfaces:**

- Consumes: `dayjs` (`@utils/dayjs`、`utc` + `timezone` plugin 適用済み)
- Produces: `export const formatJapaneseDate = (iso: string): string` — `'2026-08-01'` → `'2026年8月1日'`(月日はゼロ埋めしない)

リポジトリに日本語日付フォーマッタは存在しないため新設する。`src/components/sys-bar/format-clock/index.ts` が同種の小さなフォーマッタの先例。

- [ ] **Step 1: 失敗するテストを書く**

`src/utils/format-japanese-date/format-japanese-date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { formatJapaneseDate } from '.';

describe('formatJapaneseDate', () => {
  it('ISO 日付を日本語表記にする', () => {
    expect(formatJapaneseDate('2026-08-01')).toBe('2026年8月1日');
  });

  it('月日をゼロ埋めしない', () => {
    expect(formatJapaneseDate('2026-11-10')).toBe('2026年11月10日');
  });

  it('タイムスタンプ付きでも Asia/Tokyo の暦日で解釈する', () => {
    // UTC 2026-07-31T15:00:00Z = JST 2026-08-01T00:00:00+09:00
    expect(formatJapaneseDate('2026-07-31T15:00:00.000Z')).toBe('2026年8月1日');
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `pnpm vitest run src/utils/format-japanese-date/format-japanese-date.test.ts`
Expected: FAIL — `Failed to resolve import "."`

- [ ] **Step 3: 実装する**

`src/utils/format-japanese-date/index.ts`:

```ts
import { dayjs } from '@utils/dayjs';

// Payload の date フィールドは ISO タイムスタンプで返るため、必ず Asia/Tokyo に寄せてから
// 暦日を取る。`M` / `D` はゼロ埋めしないトークン(8月1日であって 08月01日ではない)。
export const formatJapaneseDate = (iso: string): string => dayjs(iso).tz('Asia/Tokyo').format('YYYY年M月D日');
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm vitest run src/utils/format-japanese-date/format-japanese-date.test.ts`
Expected: PASS(3 tests)

- [ ] **Step 5: commit**

```bash
git add src/utils/format-japanese-date/
git commit -m "feat(utils): 日本語日付フォーマッタを追加"
```

---

### Task 4: 詳細ページ

**Files:**

- Create: `src/app/(site)/legal/layout.tsx`
- Create: `src/app/(site)/legal/styles.css.ts`
- Create: `src/app/(site)/legal/[slug]/page.tsx`
- Create: `src/app/(site)/legal/[slug]/_components/legal-document/index.tsx`
- Create: `src/app/(site)/legal/[slug]/_components/legal-document/styles.css.ts`
- Create: `src/app/(site)/legal/[slug]/_components/legal-document/legal-document.test.tsx`

**Interfaces:**

- Consumes: Task 2 の `findLegalDocumentBySlug`、Task 3 の `formatJapaneseDate`、`PageHeader` (`@components/page-header`)、`RichText` (`@components/rich-text`)
- Produces: `/legal/{slug}` ルート。`export const LegalDocumentView = ({ title, effectiveAt, body }: Props)` — テストから直接 render できる純粋な表示コンポーネント。

`(site)/layout.tsx` は `<main>` を提供しないため、セグメント側で `<main>` を持つ必要がある(`src/app/(site)/news/layout.tsx` と同じ形)。`[slug]/page.tsx` 自身の layout は不要。

- [ ] **Step 1: 失敗するテストを書く**

`src/app/(site)/legal/[slug]/_components/legal-document/legal-document.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LegalDocumentView } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text: '第1条 適用範囲', version: 1 }],
      },
    ],
  },
} as unknown as SerializedEditorState;

describe('LegalDocumentView', () => {
  it('タイトルを h1 として描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByRole('heading', { level: 1, name: 'ソフトウェア利用規約' })).toBeInTheDocument();
  });

  it('本文を描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByText('第1条 適用範囲')).toBeInTheDocument();
  });

  it('施行日を time 要素として描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByText('2026年8月1日 施行')).toHaveAttribute('datetime', '2026-08-01');
  });

  it('パンくずを 2 階層で描画する(中間の legal クラムを置かない)', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeInTheDocument();
    // ScrambleText が同じラベルを 2 度描画する(幅確保のゴースト + オーバーレイ)ため first() で絞る。
    await expect.element(page.getByText('home').first()).toBeInTheDocument();
    await expect.element(page.getByText('legal')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `pnpm vitest run "src/app/(site)/legal/[slug]/_components/legal-document/legal-document.test.tsx"`
Expected: FAIL — `Failed to resolve import "./index"`

- [ ] **Step 3: 表示コンポーネントを実装する**

`src/app/(site)/legal/[slug]/_components/legal-document/styles.css.ts`:

```ts
import { css } from '@styled/css';

export const body = css({
  flexGrow: 1,
});

export const footer = css({
  marginTop: '8',
});

export const effectiveAt = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'text.muted',
});
```

`src/app/(site)/legal/[slug]/_components/legal-document/index.tsx`:

```tsx
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { formatJapaneseDate } from '@utils/format-japanese-date';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Props = {
  title: string;
  effectiveAt: string;
  body: SerializedEditorState;
};

// `/legal` の一覧ページは持たないため、パンくずは 2 階層。中間に legal クラムを置くと
// 存在しないページへのリンクになる(Breadcrumbs は最後以外を必ず Link で描画する)。
// 配列は inline JSX prop にしない(react-perf/jsx-no-new-array-as-prop)。
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { label: title }];

export const LegalDocumentView = ({ title, effectiveAt, body }: Props) => {
  const crumbs = buildCrumbs(title);
  // Payload の date フィールドは ISO タイムスタンプで返る。datetime 属性は暦日だけを載せる。
  const isoDay = effectiveAt.slice(0, 10);

  return (
    <>
      <PageHeader title={title} breadcrumbs={crumbs} titleTracking="tight" />
      <article className={s.body}>
        <RichText data={body} />
        <footer className={s.footer}>
          <time className={s.effectiveAt} dateTime={isoDay}>
            {`${formatJapaneseDate(effectiveAt)} 施行`}
          </time>
        </footer>
      </article>
    </>
  );
};
```

`s.effectiveAt` で使う `fontFamily: 'mono'` / `fontSize: 'sm'` / `color: 'text.muted'` は既存トークン名を前提にしている。`pnpm typecheck` が strictTokens で落ちた場合は `src/app/(site)/news/styles.css.ts` と `panda.config.ts` の `tokens` / `semanticTokens` を見て実在するトークン名に合わせること。生値を使う場合は `'[13px]'` のように角括弧でエスケープする。

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm vitest run "src/app/(site)/legal/[slug]/_components/legal-document/legal-document.test.tsx"`
Expected: PASS(4 tests)

- [ ] **Step 5: layout を実装する**

`src/app/(site)/legal/styles.css.ts`:

```ts
import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});
```

`src/app/(site)/legal/layout.tsx`:

```tsx
import * as s from './styles.css';

import type { ReactNode } from 'react';

// `(site)/layout.tsx` は `<main>` を持たないため、セグメント側で唯一の main ランドマークを
// 所有する。ページ見出しは `[slug]/page.tsx` 側の LegalDocumentView が持つ。
const LegalLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    {children}
  </main>
);

export default LegalLayout;
```

- [ ] **Step 6: ページを実装する**

`src/app/(site)/legal/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';

import { LegalDocumentView } from './_components/legal-document';

import { findLegalDocumentBySlug } from '@lib/payload/legal-documents';

import type { Metadata } from 'next';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// ISR。詳細ページはオンデマンドで描画してキャッシュし、collection の afterChange hook が
// `/legal/{slug}` を revalidate する。Live Preview は持たないので draftMode に触らない。
export const revalidate = 3600;

// build phase は Payload を読めないため slug は空で始め、公開済み slug をオンデマンド ISR で配る。
export const generateStaticParams = (): { slug: string }[] => [];
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

type Props = {
  params: Params;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const doc = await findLegalDocumentBySlug(slug);
  if (doc === undefined) notFound();

  return {
    title: doc.title,
    description: `napochaan のソフトウェアに関する${doc.title}`,
    // 検索流入を設計する文書ではなく、外部の販売ページから直リンクされる。本文中の内部リンクは
    // 辿らせたいので follow は残す。sitemap.ts / llms.txt にも意図的に載せていない。
    robots: { index: false, follow: true },
  };
};

const LegalDocumentPage = async ({ params }: Props) => {
  const { slug } = await params;
  const doc = await findLegalDocumentBySlug(slug);
  if (doc === undefined) notFound();

  return <LegalDocumentView title={doc.title} effectiveAt={doc.effectiveAt} body={doc.body as unknown as SerializedEditorState} />;
};

export default LegalDocumentPage;
```

- [ ] **Step 7: lint と typecheck**

Run: `pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。`doc.effectiveAt` が `string | null` 型で落ちる場合は、`effectiveAt` が `required: true` でも生成型が nullable になっているということなので、`doc.effectiveAt ?? ''` ではなく `if (doc.effectiveAt === null) notFound();` のガードを `LegalDocumentPage` に足す(空文字を描画しない)。

- [ ] **Step 8: commit**

```bash
git add "src/app/(site)/legal/"
git commit -m "feat(legal): /legal/[slug] 詳細ページを追加"
```

---

### Task 5: seed export / import 配線

**Files:**

- Modify: `src/seed/export.ts`
- Modify: `src/seed/import.ts`
- Modify: `src/seed/import.test.ts`
- Create: `src/seed/data/legal-documents.json`

**Interfaces:**

- Consumes: Task 1 の `LegalDocument` 型、既存の `collectBodyMedia` / `applyBodySentinels`(export 側)、`resolveBodyMedia` / `upsertBySlug`(import 側)
- Produces: `export const importLegalDocuments = (instance: Payload): Promise<void>`(テストから直接呼ぶため export する)

richText を全部入りにしたため legal 本文に upload ノードが入りうる。`sentinelize-body-media` / `resolve-body-media` は共有ヘルパだが **collection ごとの個別配線が必要**で、これを忘れる事故が blog → works と 2 回再発している。忘れると export した JSON の upload が壊れ、import が Payload の `ValidationError` で落ちる。

- [ ] **Step 1: 失敗するテストを書く**

`src/seed/import.test.ts` の `importWorks` の describe ブロックの直後に追加する。ファイル冒頭の import 行に `importLegalDocuments` を足すこと:

```ts
describe('importLegalDocuments — body image media resolution', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('body の upload sentinel を media id に解決してから upsert する', async () => {
    const body = richTextFromBlocks([
      { type: 'p', text: 'intro' },
      { type: 'img', file: 'tos-diagram.png', alt: 'diagram' },
    ]);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify([{ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', body }]));
    direntsOnce([asDirent('tos-diagram.png')]);

    const { payload, writes } = makeMediaFakePayload();
    await importLegalDocuments(payload);

    expect(writes.some((call) => call.collection === 'media')).toBe(true);
    const write = writes.find((call) => call.collection === 'legal-documents');
    expect(uploadValuesOf(write?.data)).toEqual([101]);
  });

  it('asset が見つからない upload ノードは落とす', async () => {
    const body = richTextFromBlocks([
      { type: 'p', text: 'intro' },
      { type: 'img', file: 'missing.png', alt: 'gone' },
    ]);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify([{ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', body }]));
    direntsOnce([]);

    const { payload, writes } = makeMediaFakePayload();
    await importLegalDocuments(payload);

    const write = writes.find((call) => call.collection === 'legal-documents');
    expect(uploadValuesOf(write?.data)).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `pnpm vitest run src/seed/import.test.ts`
Expected: FAIL — `importLegalDocuments` が export されていない。

- [ ] **Step 3: import 側を実装する**

`src/seed/import.ts` を 3 箇所変更する。

(a) 生成型を import に足す(既存の型 import 行):

```ts
import type { Blog, LegalDocument, Log, News, Work } from '@payload-types';
```

(b) `UpsertCollection` に slug を足す(これを忘れると `upsertBySlug` がリテラルを受け付けない):

```ts
type UpsertCollection = 'news' | 'works' | 'blog' | 'legal-documents';
```

(c) `importBlog` の直後に追加する:

```ts
type LegalDocumentRecord = Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>;

// body の upload sentinel → media id 解決を fake Payload で end-to-end に検証できるよう export する
// (importBlog / importWorks と同じ理由)。thumbnail は持たないので body の解決だけ。
export const importLegalDocuments = async (instance: Payload): Promise<void> => {
  const records = await readData<LegalDocumentRecord>('legal-documents');
  for (const record of records) {
    const body = await resolveBodyMedia(instance, record.body);
    const data = { ...record, body };
    await upsertBySlug(instance, 'legal-documents', record.slug, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} legal-documents`);
};
```

(d) `importContent` に呼び出しを足す(`importBlog` の直後):

```ts
export const importContent = async (instance: Payload): Promise<void> => {
  await importNews(instance);
  await importWorks(instance);
  await importBlog(instance);
  await importLegalDocuments(instance);
  await importLogs(instance);
  await importGallery(instance);
  await importProfile(instance);
};
```

- [ ] **Step 4: 空の seed データを作る**

`src/seed/data/legal-documents.json`:

```json
[]
```

これが無いと `readData` がファイル読み込みで落ちる。実文書は admin か MCP から入稿し、`pnpm seed:export` で書き戻す。

- [ ] **Step 5: テストが通ることを確認する**

Run: `pnpm vitest run src/seed/import.test.ts`
Expected: PASS。既存の `seed import — production safety invariant` も緑のまま(legal のデータファイルが `[]` なので users を作らない)。

- [ ] **Step 6: export 側を実装する**

`src/seed/export.ts` を 4 箇所変更する。

(a) 生成型を import に足す:

```ts
import type { Blog, Gallery, LegalDocument, Media, Work } from '@payload-types';
```

(b) assets ディレクトリ定数を既存の `blogAssetsDir` の隣に足す:

```ts
const legalAssetsDir = path.resolve(assetsDir, 'legal');
```

(c) `toBlogRecord` の直後にレコードマッパーと exporter を足す:

```ts
// thumbnail を持たないので body の sentinel 化と system key の除去だけ。effectiveAt は
// 暦日フィールドなので ISO タイムスタンプではなく YYYY-MM-DD に落とす。
const toLegalDocumentRecord = (doc: LegalDocument): Record<string, unknown> => sentinelizeBodyField(formatDayField(stripSystemKeys(doc), 'effectiveAt'));

const exportLegalDocuments = async (instance: Payload): Promise<void> => {
  const { docs } = await instance.find({ collection: 'legal-documents', depth: 1, limit: 0, sort: 'slug', overrideAccess: true });
  for (const doc of docs) {
    // 本文の media バイナリを先に保存してから toLegalDocumentRecord で sentinel 化する
    // (sentinel 化後は filename が取れない)。
    if (!isEditorState(doc.body)) continue;
    for (const media of collectBodyMedia(asEditorState(doc.body))) {
      await saveMediaFile(media, legalAssetsDir, r2Bucket, instance.logger);
    }
  }
  await writeJson(instance, 'legal-documents', docs.map(toLegalDocumentRecord));
};
```

(d) `script` の中で mkdir と呼び出しを足す(`exportBlog` の直後):

```ts
  await mkdir(legalAssetsDir, { recursive: true });
  ...
  await exportBlog(payload);
  await exportLegalDocuments(payload);
```

- [ ] **Step 7: lint と typecheck**

Run: `pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。

**`pnpm seed:import` は実行しないこと。** logs / gallery は delete-all → recreate で未 export の編集を巻き込む。反映が必要になったら本人に手順を案内する。

- [ ] **Step 8: commit**

```bash
git add src/seed/
git commit -m "feat(legal): seed export/import に legal-documents を配線"
```

---

### Task 6: MCP 共有ユニットの抽出

**Files:**

- Create: `src/lib/mcp/tools/shared/tool-result/index.ts`
- Modify: `src/lib/mcp/tools/index.ts`
- Modify: `src/lib/mcp/markdown/index.ts`

**Interfaces:**

- Consumes: `McpToolError` / `PayloadOperationError` / `formatPayloadValidationError` (`@lib/mcp/errors`)
- Produces:
  - `export type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean }`
  - `export const ok = (value: unknown): ToolResult`
  - `export const fail = (message: string): ToolResult`
  - `export const toToolError = (error: McpToolError): ToolResult`
  - `MarkdownCodec<TBody>` — body 型で generic 化した codec 型

これは純粋な抽出リファクタ。**既存 blog の振る舞いを 1 ミリも変えない。** 検証は既存 `tools.test.ts`(inline snapshot 3 箇所を含む)が無変更で緑のままであること。

- [ ] **Step 1: 抽出前のテストが緑であることを確認する(ベースライン)**

Run: `pnpm vitest run src/lib/mcp/tools/tools.test.ts`
Expected: PASS。この結果が抽出後の比較対象になる。**落ちている場合はここで止めて報告する**(抽出のせいではない失敗を後で混同しないため)。

- [ ] **Step 2: shared/tool-result を作る**

`src/lib/mcp/tools/shared/tool-result/index.ts` — `src/lib/mcp/tools/index.ts` の該当箇所(`ToolResult` 型 / `ok` / `fail` / `toToolError`)から**文言を 1 文字も変えずに**移す:

```ts
import { ValidationError } from 'payload';

import { formatPayloadValidationError, PayloadOperationError } from '../../../errors';

import type { McpToolError } from '../../../errors';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

export const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
// .match の edge で唯一 ToolResult に折り畳む(chaining-neverthrow-results)。discriminate は
// instanceof(modeling-errors-as-classes) — PayloadOperationError だけ cause の中身で
// 分岐が要るので個別分岐、それ以外は自身の message がそのままユーザー向け文言。
export const toToolError = (error: McpToolError): ToolResult => {
  if (error instanceof PayloadOperationError) {
    if (error.cause instanceof ValidationError) return fail(formatPayloadValidationError(error.cause));
    console.error('[mcp] tool error', error.message, error.cause);
    return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
  }

  return fail(error.message);
};
```

- [ ] **Step 3: tools/index.ts を差し替える**

`src/lib/mcp/tools/index.ts` から `ToolResult` 型定義 / `ok` / `fail` / `toToolError` の実体を削除し、import に置き換える:

```ts
import { fail, ok, toToolError } from './shared/tool-result';

import type { ToolResult } from './shared/tool-result';
```

`ToolResult` は現在 `tools/index.ts` から export されている(`route.ts` 以外の consumer がいる可能性がある)。barrel を作らないため、**re-export はしない**。`ToolResult` を外から使っている箇所があれば `./shared/tool-result` を直接 import するように書き換える。

Run: `grep -rn "ToolResult" src/ --include=*.ts` で consumer を洗い出してから進める。

- [ ] **Step 4: blog のテストが無変更で緑であることを確認する**

Run: `pnpm vitest run src/lib/mcp/tools/tools.test.ts`
Expected: PASS — Step 1 と同じ件数、inline snapshot も無変更。**snapshot が更新を要求したら文言を変えてしまっている。** `-u` で更新せず、差分を戻すこと。

- [ ] **Step 5: MarkdownCodec を generic 化する**

`src/lib/mcp/markdown/index.ts` の `MarkdownCodec` は現在 `Blog['body']` にハードコードされている。body 型を型引数にする:

```ts
export type MarkdownCodec<TBody> = {
  toLexical: (markdown: string) => TBody;
  toMarkdown: (data: TBody) => string;
};
```

`createMarkdownCodec` は呼び出し側が body 型を決められるよう generic にする:

```ts
export const createMarkdownCodec = <TBody>(editorConfig: SanitizedServerEditorConfig): MarkdownCodec<TBody> => ({
  toLexical: (markdown) => transformBlockLinkEmbeds(convertMarkdownToLexical({ editorConfig, markdown })) as TBody,
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data: data as never }),
});
```

`tools/index.ts` の `BlogToolDeps.codec` を `MarkdownCodec<Blog['body']>` に、`route.ts` の呼び出しを `createMarkdownCodec<Blog['body']>(editorConfig)` に合わせる。

- [ ] **Step 6: 全テストと typecheck**

Run: `pnpm vitest run && pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。

- [ ] **Step 7: commit**

```bash
git add src/lib/mcp/
git commit -m "refactor(mcp): ToolResult ヘルパを shared に抽出し MarkdownCodec を generic 化"
```

---

### Task 7: legal MCP tools

**Files:**

- Create: `src/lib/mcp/tools/legal/index.ts`
- Create: `src/lib/mcp/tools/legal/legal.test.ts`
- Modify: `src/app/api/mcp/route.ts`

**Interfaces:**

- Consumes: Task 6 の `ok` / `fail` / `toToolError` / `ToolResult` / `MarkdownCodec<TBody>`、Task 1 の `LegalDocument` 型
- Produces:
  - `export type LegalToolDeps = { payload: Payload; user: User; codec: MarkdownCodec<LegalDocument['body']> }`
  - `export const createLegalToolHandlers = (deps: LegalToolDeps)` — `{ listLegalDocuments, getLegalDocument, createLegalDocument, updateLegalDocument }`
  - `export const registerLegalTools = (server: McpServer, deps: LegalToolDeps): void`

`publish_legal_document` は**作らない**。法務文書の公開は「施行」という重い行為で、admin で本文を目視してから publish する。`list_media` / `upload_media` / `create_upload_url` は同一 `McpServer` に登録済みなので legal からもそのまま使える(複製しない)。

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/mcp/tools/legal/legal.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { createLegalToolHandlers } from '.';

import type { LegalToolDeps } from '.';
import type { User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const paragraphBody = () => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } });

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((_markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# 第1条'),
  };
  const deps = { payload, user, codec } as unknown as LegalToolDeps;

  return { payload, codec, deps };
};

describe('createLegalDocument', () => {
  it('draft として作成する', async () => {
    const { payload, deps } = createDeps();
    payload.create.mockResolvedValue({ id: 3, slug: 'terms' });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ _status: 'draft', slug: 'terms', effectiveAt: '2026-08-01' }),
      }),
    );
  });

  it('effectiveAt が YYYY-MM-DD でなければ回復ヒント付きで reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '来月1日', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('YYYY-MM-DD');
    expect(result.content[0]?.text).toContain('来月1日');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('存在しない日付を reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-02-30', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('getLegalDocument', () => {
  it('本文を Markdown で返し、effectiveAt は独立フィールドで返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', _status: 'published', body: paragraphBody() }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'terms' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string; effectiveAt: string };
    expect(parsed.bodyMarkdown).toBe('# 第1条');
    expect(parsed.effectiveAt).toBe('2026-08-01');
    // 施行日を本文に混ぜない(read → write の往復で本文に焼き付くのを防ぐ)
    expect(parsed.bodyMarkdown).not.toContain('2026-08-01');
  });

  it('id も slug も無ければ回復ヒントを返す', async () => {
    const { deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({});

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('slug');
  });

  it('見つからなければ回復ヒントを返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'missing' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('list_legal_documents');
  });
});

describe('updateLegalDocument', () => {
  it('本文だけの部分更新ができる', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', body: paragraphBody() });
    payload.update.mockResolvedValue({ id: 3, slug: 'terms' });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 3, bodyMarkdown: '# 改訂' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        id: 3,
        draft: true,
        overrideAccess: false,
      }),
    );
  });

  it('更新対象が無ければ reject する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 999, bodyMarkdown: '# 改訂' });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('listLegalDocuments', () => {
  it('slug / title / effectiveAt / status を返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', _status: 'published' }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.listLegalDocuments();

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as { slug: string; effectiveAt: string; status: string }[];
    expect(parsed[0]).toEqual({ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', status: 'published' });
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `pnpm vitest run src/lib/mcp/tools/legal/legal.test.ts`
Expected: FAIL — `Failed to resolve import "."`

- [ ] **Step 3: legal tools を実装する**

`src/lib/mcp/tools/legal/index.ts`:

```ts
import { errAsync, fromPromise, okAsync } from 'neverthrow';
import { z } from 'zod';

import { InvalidInputError, PayloadOperationError, PostNotFoundError } from '../../errors';
import { ok, toToolError } from '../shared/tool-result';

import type { McpToolError } from '../../errors';
import type { MarkdownCodec } from '../../markdown';
import type { ToolResult } from '../shared/tool-result';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LegalDocument, User } from '@payload-types';
import type { ResultAsync } from 'neverthrow';
import type { Payload } from 'payload';

export type LegalToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<LegalDocument['body']>;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BODY_MARKDOWN_HELP = '法務文書の本文を Markdown で書く。見出し・箇条書き・リンクが使える。画像を入れる場合は upload_media で登録し、返された ![media:<id>](alt) 参照をそのまま貼ること(生 URL は不可)。';

// write path は strict。変換せず reject し、LLM が 1 回のリトライで自己修正できるヒントを返す
// (.claude/rules/mcp-write-strict.md)。
//
// 検証は 2 段:
//   1. 形式 — YYYY-MM-DD かどうか
//   2. 実在 — 2026-02-30 のような「形式は合うが存在しない日付」を弾く。JST 正午で Date を
//      組み、Asia/Tokyo で暦日に戻して入力と一致するか見る。Date は存在しない日を翌月に
//      繰り上げる(2/30 → 3/2)ので、往復が一致しなければ実在しない日付と判定できる。
//      正午を使うのは、深夜だと DST や丸めで日付がズレる余地を残さないため。
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });

const parseEffectiveAt = (value: string): ResultAsync<string, McpToolError> => {
  if (!DAY_PATTERN.test(value)) {
    return errAsync(new InvalidInputError(`effectiveAt は YYYY-MM-DD 形式で指定してください。受け取った値: "${value}"`));
  }

  const noon = new Date(`${value}T12:00:00+09:00`);
  if (Number.isNaN(noon.getTime()) || dayFormatter.format(noon) !== value) {
    return errAsync(new InvalidInputError(`effectiveAt が存在しない日付です。受け取った値: "${value}"`));
  }

  return okAsync(value);
};

const toSummary = (doc: LegalDocument) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  effectiveAt: doc.effectiveAt,
  status: doc._status ?? 'draft',
});

type DocumentQuery = { kind: 'id'; id: number } | { kind: 'slug'; slug: string };

const parseDocumentQuery = (input: { id?: number; slug?: string }): ResultAsync<DocumentQuery, McpToolError> => {
  if (input.id !== undefined) return okAsync({ kind: 'id', id: input.id });
  if (input.slug !== undefined) return okAsync({ kind: 'slug', slug: input.slug });

  return errAsync(new InvalidInputError('id か slug のどちらかを指定してください。'));
};

export const createLegalToolHandlers = (deps: LegalToolDeps) => {
  const { payload, user, codec } = deps;

  const toLexicalSafe = (markdown: string): ResultAsync<LegalDocument['body'], McpToolError> =>
    fromPromise(Promise.resolve().then(() => codec.toLexical(markdown)), (cause) => new PayloadOperationError('Markdown → Lexical 変換に失敗しました', { cause }));

  const toMarkdownSafe = (data: LegalDocument['body']): ResultAsync<string, McpToolError> =>
    fromPromise(Promise.resolve().then(() => codec.toMarkdown(data)), (cause) => new PayloadOperationError('Lexical → Markdown 変換に失敗しました', { cause }));

  const findDocument = (query: DocumentQuery): ResultAsync<LegalDocument | null, McpToolError> => {
    switch (query.kind) {
      case 'id':
        return fromPromise(
          payload.findByID({ collection: 'legal-documents', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('法務文書の取得に失敗しました', { cause }),
        );
      case 'slug':
        return fromPromise(
          payload.find({ collection: 'legal-documents', draft: true, where: { slug: { equals: query.slug } }, limit: 1, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('法務文書の取得に失敗しました', { cause }),
        ).map(({ docs }) => docs[0] ?? null);
      default: {
        const _exhaustive: never = query;
        throw new Error(`unhandled legal document query: ${JSON.stringify(_exhaustive)}`);
      }
    }
  };

  const requireDocument = (doc: LegalDocument | null): ResultAsync<LegalDocument, McpToolError> =>
    doc === null ? errAsync(new PostNotFoundError('法務文書が見つかりません。list_legal_documents で id / slug を確認してください。')) : okAsync(doc);

  return {
    listLegalDocuments: (): Promise<ToolResult> =>
      fromPromise(
        payload.find({ collection: 'legal-documents', draft: true, limit: 0, sort: 'slug', overrideAccess: false, user, depth: 0 }),
        (cause) => new PayloadOperationError('法務文書一覧の取得に失敗しました', { cause }),
      )
        .map(({ docs }) => docs.map(toSummary))
        .match(ok, toToolError),

    getLegalDocument: (input: { id?: number; slug?: string }): Promise<ToolResult> =>
      parseDocumentQuery(input)
        .andThen(findDocument)
        .andThen(requireDocument)
        // effectiveAt は本文に混ぜず独立フィールドで返す。frontmatter に埋めると
        // read → write の往復で本文の一部として書き戻される。
        .andThen((doc) => toMarkdownSafe(doc.body).map((bodyMarkdown) => ({ ...toSummary(doc), bodyMarkdown })))
        .match(ok, toToolError),

    createLegalDocument: (input: { title: string; slug: string; effectiveAt: string; bodyMarkdown: string }): Promise<ToolResult> =>
      parseEffectiveAt(input.effectiveAt)
        .andThen(() => toLexicalSafe(input.bodyMarkdown))
        .andThen((body) =>
          fromPromise(
            payload.create({
              collection: 'legal-documents',
              draft: true,
              data: {
                title: input.title,
                slug: input.slug,
                effectiveAt: input.effectiveAt,
                body,
                _status: 'draft',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('法務文書の作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          note: 'draft として作成済み。法務文書の公開は admin UI で本文を確認してから行う(MCP からは公開できない)。',
        }))
        .match(ok, toToolError),

    updateLegalDocument: (input: { id?: number; slug?: string; title?: string; effectiveAt?: string; bodyMarkdown?: string }): Promise<ToolResult> =>
      parseDocumentQuery(input)
        .andThen(findDocument)
        .andThen(requireDocument)
        .andThen((doc) => (input.effectiveAt === undefined ? okAsync(doc) : parseEffectiveAt(input.effectiveAt).map(() => doc)))
        .andThen((doc) => (input.bodyMarkdown === undefined ? okAsync({ doc, body: undefined }) : toLexicalSafe(input.bodyMarkdown).map((body) => ({ doc, body }))))
        .andThen(({ doc, body }) =>
          fromPromise(
            payload.update({
              collection: 'legal-documents',
              id: doc.id,
              draft: true,
              data: {
                ...(input.title === undefined ? {} : { title: input.title }),
                ...(input.effectiveAt === undefined ? {} : { effectiveAt: input.effectiveAt }),
                ...(body === undefined ? {} : { body }),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('法務文書の更新に失敗しました', { cause }),
          ),
        )
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          status: 'draft',
          note: 'draft を更新した。公開は admin UI で行う。',
        }))
        .match(ok, toToolError),
  };
};

export const registerLegalTools = (server: McpServer, deps: LegalToolDeps): void => {
  const handlers = createLegalToolHandlers(deps);

  server.registerTool(
    'list_legal_documents',
    {
      title: '法務文書一覧',
      description: '利用規約・免責事項などの法務文書を一覧する。id / slug / 施行日 / 公開状態を返す。',
      annotations: { readOnlyHint: true },
    },
    handlers.listLegalDocuments,
  );

  server.registerTool(
    'get_legal_document',
    {
      title: '法務文書取得',
      description: '法務文書 1 件を取得し、本文を Markdown で返す。施行日は bodyMarkdown ではなく effectiveAt フィールドに入る。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getLegalDocument,
  );

  server.registerTool(
    'create_legal_document',
    {
      title: '法務文書作成(draft)',
      description: '法務文書を必ず draft として作成する。公開(施行)は admin UI で行うため、MCP からは公開できない。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        effectiveAt: z.string().describe('施行日。YYYY-MM-DD'),
        bodyMarkdown: z.string().min(1).describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createLegalDocument,
  );

  server.registerTool(
    'update_legal_document',
    {
      title: '法務文書更新(draft)',
      description: '法務文書の draft を更新する。指定したフィールドだけが変わる。公開は admin UI で行う。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        effectiveAt: z.string().optional().describe('施行日。YYYY-MM-DD'),
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updateLegalDocument,
  );
};
```

`Intl.DateTimeFormat` は生成コストがあるのでモジュールスコープで 1 度だけ作る(ハンドラ内で毎回 `new` しない)。

- [ ] **Step 4: テストが通ることを確認する**

Run: `pnpm vitest run src/lib/mcp/tools/legal/legal.test.ts`
Expected: PASS(9 tests)

- [ ] **Step 5: MCP route に登録する**

`src/app/api/mcp/route.ts` の `registerBlogTools` 呼び出しの直後に足す:

```ts
import { registerLegalTools } from '@lib/mcp/tools/legal';
...
registerBlogTools(server, { payload, user, codec: createMarkdownCodec<Blog['body']>(editorConfig), signingSecret: env.PAYLOAD_SECRET });
registerLegalTools(server, { payload, user, codec: createMarkdownCodec<LegalDocument['body']>(editorConfig) });
```

`editorConfig` は `editorConfigFactory.fromFeatures({ config: payload.config, features: blogEditorFeatures })` の既存のものを共有する。legal も同じ全部入り richText を使うため、2 つ目の editorConfig は作らない。

- [ ] **Step 6: 全テストと typecheck**

Run: `pnpm vitest run && pnpm fmt && pnpm lint && pnpm typecheck`
Expected: すべて成功。blog の `tools.test.ts` も緑のまま。

- [ ] **Step 7: commit**

```bash
git add src/lib/mcp/tools/legal/ "src/app/api/mcp/route.ts"
git commit -m "feat(mcp): legal-documents の入稿 tool を追加"
```

---

## 完了後の手動確認

自動テストで担保できない部分。実装完了後に本人へ依頼する。

1. `pnpm dev` を起動し、admin (`/admin`) で「法務文書」collection が見えること、`slug` / `title` / `施行日` / `本文` が編集できること。
2. `terms` を 1 件作って publish し、`/legal/terms` が 200 で描画され、末尾に「YYYY年M月D日 施行」が出ること。
3. draft のまま publish していない文書の URL が 404 になること(公開漏れの検証)。
4. ページのソースに `<meta name="robots" content="noindex, follow">` が入っていること。
5. `/sitemap.xml` と `/llms.txt` に `/legal/` が **含まれない** こと。
6. MCP から `list_legal_documents` / `get_legal_document` / `update_legal_document` が動くこと。

> `pnpm dev` は本人しか起動できない(workerd を落とすと CF binding が壊れるため)。実装者は `pnpm build && npx next start -p 3001` での確認に留めること。

## 後続作業(本 PR 外)

1. PR #5 `feat/software-release-download` のマージ
2. `software` 詳細ページから `/legal/terms` へのリンク + ソフト固有条項の追記表示
3. 販売プラットフォーム側の商品ページに `/legal/terms` / `/legal/disclaimer` のリンクを設置
