# MCP 本文の生 media URL 自動解決 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `create_post` / `update_post` の bodyMarkdown 中にある `/api/media/file/<filename>` 形式の生 URL 画像参照を、保存前に media コレクションを filename で引いて `![media:<id>]()` プレースホルダへ自動変換する(post 4 の block 解消 + 恒久対処)。

**Architecture:** 純粋関数(参照の抽出・書き換え)を `src/lib/mcp/markdown/media-file-refs/` に新設し、`src/lib/mcp/tools/index.ts` の write パイプライン先頭(`validateBodyMarkdown` の前)に neverthrow の `ResultAsync` ステップとして挿入する。外部 URL(`https://example.com/...`)は触らず、既存の `findRawImageRefs` による拒否に委ねる。filename が media に見つからない場合は LLM が自己修正できる `BodyValidationError` を返す。

**Tech Stack:** TypeScript (tsgo typecheck), neverthrow, Payload CMS local API, vitest (node env), oxlint/oxfmt。

## Global Constraints

- `pnpm lint && pnpm typecheck` を実装完了ごとに必ず実行(`npx tsc` 禁止、`pnpm typecheck` を使う)
- **勝手に commit しないこと** — 各タスク末尾の commit ステップは、最後に difit でユーザー review を得てから実行する(それまでは stage まで)
- top-level 関数はすべて arrow function(`const fn = () => {}`)
- `let` / IIFE / non-null assertion / `forEach` / `any` 禁止(functional-programming.md)
- 型強制: `Boolean()/String()/Number()` 禁止。文字列化はテンプレートリテラル、数値化は `parseInt(x, 10)`
- 識別子の頭字語は全大文字を維持: `MediaFileRef` の `ID` は `findMediaIDByFilename` / `idByFilename`(camelCase 先頭は全小文字)。ファイル名は kebab-case のまま
- neverthrow: chain は combinator で構成し `.match` は edge(ハンドラ末尾)1 回のみ。`_unsafeUnwrap` / mid-flow `isErr()` 禁止(テストは可)
- テストは実装と同ディレクトリに colocate: `media-file-refs/media-file-refs.test.ts`(DOM 不要なので `.ts` = node env)
- barrel file 禁止 — `media-file-refs/index.ts` は実装本体を置く(re-export のみの index は作らない)

---

### Task 1: 純粋関数モジュール `media-file-refs`(抽出 + 書き換え)

**Files:**

- Create: `src/lib/mcp/markdown/media-file-refs/index.ts`
- Test: `src/lib/mcp/markdown/media-file-refs/media-file-refs.test.ts`

**Interfaces:**

- Consumes: なし(純粋関数のみ、依存ゼロ。`fromThrowable` を neverthrow から使う)
- Produces:
  - `type MediaFileRef = { ref: string; filename: string }`
  - `findMediaFileRefs(markdown: string): MediaFileRef[]` — `![...](<url>)` のうち pathname が `/api/media/file/` で始まるものだけを列挙。filename は URL デコード済み
  - `rewriteMediaFileRefs(markdown: string, idByFilename: ReadonlyMap<string, number>): string` — map にある filename の参照を `![media:<id>]()` に置換。map にないもの・media URL でないものは原文のまま

**設計メモ(実装者向け):**

- 対象は相対 URL(`/api/media/file/x.jpeg`)と絶対 URL(`https://<任意ホスト>/api/media/file/x.jpeg`)の両方。ホストは問わず **pathname prefix** で判定する(本番/staging/localhost すべて同じ path 規約のため)
- `![media:5]()` は括弧が空なので正規表現(`[^)]+` = 非空)にマッチせず、誤変換の心配なし。image-row フェンス内セル `![media:5](caption)` も caption が media path でないため素通り
- 書き換えは markdown 文字列全体に対して行う(フェンスを strip しない)。フェンス内に紛れた生 media URL も救済されるのは意図した挙動
- Markdown title 付き `![alt](/api/media/file/x.jpeg "title")` に対応するため、括弧内の先頭トークン(空白まで)だけを URL として扱う
- alt テキストは捨てる(`![media:<id>]()` に alt は載らない — 表示 alt は media ドキュメント側の alt フィールドが使われる)
- Payload のサイズバリアント filename(`IMG-300x200.jpeg` 等)の逆引きフォールバックはやらない(YAGNI — lookup 失敗時のエラーメッセージで upload_media へ誘導する)

- [ ] **Step 1: failing test を書く**

`src/lib/mcp/markdown/media-file-refs/media-file-refs.test.ts`:

````typescript
import { describe, expect, it } from 'vitest';

import { findMediaFileRefs, rewriteMediaFileRefs } from '.';

describe('findMediaFileRefs', () => {
  it('finds a relative /api/media/file/ image ref', () => {
    const refs = findMediaFileRefs('before\n\n![](/api/media/file/IMG_0185.jpeg)\n\nafter');
    expect(refs).toEqual([{ ref: '![](/api/media/file/IMG_0185.jpeg)', filename: 'IMG_0185.jpeg' }]);
  });

  it('finds an absolute URL ref on any host', () => {
    const refs = findMediaFileRefs('![cover](https://napochaan.com/api/media/file/cover.png)');
    expect(refs).toEqual([{ ref: '![cover](https://napochaan.com/api/media/file/cover.png)', filename: 'cover.png' }]);
  });

  it('decodes URL-encoded filenames', () => {
    const refs = findMediaFileRefs('![](/api/media/file/IMG%200185.jpeg)');
    expect(refs).toEqual([{ ref: '![](/api/media/file/IMG%200185.jpeg)', filename: 'IMG 0185.jpeg' }]);
  });

  it('drops a markdown title before parsing the URL', () => {
    const refs = findMediaFileRefs('![x](/api/media/file/a.jpeg "title")');
    expect(refs).toEqual([{ ref: '![x](/api/media/file/a.jpeg "title")', filename: 'a.jpeg' }]);
  });

  it('ignores external image URLs', () => {
    expect(findMediaFileRefs('![x](https://example.com/x.png)')).toEqual([]);
  });

  it('ignores media placeholders and image-row cell captions', () => {
    const fence = ['```image-row', '![media:5](left)', '![media:6]()', '```'].join('\n');
    expect(findMediaFileRefs(fence)).toEqual([]);
  });

  it('ignores nested paths under /api/media/file/', () => {
    expect(findMediaFileRefs('![](/api/media/file/sub/dir.jpeg)')).toEqual([]);
  });

  it('ignores malformed percent-encoding instead of throwing', () => {
    expect(findMediaFileRefs('![](/api/media/file/bad%E0%A4%A.jpeg)')).toEqual([]);
  });
});

describe('rewriteMediaFileRefs', () => {
  it('rewrites a mapped ref to a media placeholder', () => {
    const idByFilename = new Map([['IMG_0185.jpeg', 42]]);
    const result = rewriteMediaFileRefs('a\n\n![alt](/api/media/file/IMG_0185.jpeg)\n\nb', idByFilename);
    expect(result).toBe('a\n\n![media:42]()\n\nb');
  });

  it('rewrites absolute URL refs too', () => {
    const idByFilename = new Map([['cover.png', 7]]);
    expect(rewriteMediaFileRefs('![c](https://stg.napochaan.com/api/media/file/cover.png)', idByFilename)).toBe('![media:7]()');
  });

  it('keeps unmapped and non-media refs intact', () => {
    const idByFilename = new Map([['known.png', 1]]);
    const markdown = '![](/api/media/file/unknown.png) ![x](https://example.com/x.png) ![media:3]()';
    expect(rewriteMediaFileRefs(markdown, idByFilename)).toBe(markdown);
  });
});
````

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm vitest run src/lib/mcp/markdown/media-file-refs --reporter=basic`
Expected: FAIL(モジュール未作成 → import エラー)

- [ ] **Step 3: 最小実装を書く**

`src/lib/mcp/markdown/media-file-refs/index.ts`:

```typescript
import { fromThrowable } from 'neverthrow';

// 本文 Markdown 中のサイト内 media 直リンク(/api/media/file/<filename>)を検出・置換する
// 純粋関数群。MCP write パイプラインが保存前に ![media:<id>]() へ自動解決するために使う。
// 外部 URL やプレースホルダ・image-row セル構文はここでは一切触らない。

export type MediaFileRef = { ref: string; filename: string };

// ![alt](非空) の画像参照。![media:<id>]() は括弧が空なのでマッチしない。
const IMAGE_REF = /!\[[^\]]*\]\(([^)]+)\)/g;

const MEDIA_FILE_PATH_PREFIX = '/api/media/file/';

const decodeFilename = fromThrowable(
  (encoded: string) => decodeURIComponent(encoded),
  () => undefined,
);

// 相対・絶対どちらの URL 形式も base 付き URL パースで pathname に正規化する。
// query/hash やホスト差(本番/staging/localhost)を吸収し、path 規約だけで判定する。
const pathnameOf = (target: string): string | undefined => {
  if (!URL.canParse(target, 'http://relative.invalid')) return undefined;
  return new URL(target, 'http://relative.invalid').pathname;
};

// 括弧内テキストから media filename を取り出す。media 直リンクでなければ undefined。
const filenameOf = (rawTarget: string): string | undefined => {
  const [target] = rawTarget.trim().split(/\s+/); // markdown title("...")を落とす
  if (target === undefined || target === '') return undefined;
  const pathname = pathnameOf(target);
  if (pathname === undefined) return undefined;
  if (!pathname.startsWith(MEDIA_FILE_PATH_PREFIX)) return undefined;
  const encoded = pathname.slice(MEDIA_FILE_PATH_PREFIX.length);
  if (encoded === '' || encoded.includes('/')) return undefined;
  return decodeFilename(encoded).unwrapOr(undefined);
};

export const findMediaFileRefs = (markdown: string): MediaFileRef[] =>
  [...markdown.matchAll(IMAGE_REF)].flatMap((match) => {
    const filename = filenameOf(match[1] ?? '');
    return filename === undefined ? [] : [{ ref: match[0], filename }];
  });

export const rewriteMediaFileRefs = (markdown: string, idByFilename: ReadonlyMap<string, number>): string =>
  markdown.replace(IMAGE_REF, (ref, target: string) => {
    const filename = filenameOf(target);
    if (filename === undefined) return ref;
    const id = idByFilename.get(filename);
    return id === undefined ? ref : `![media:${id}]()`;
  });
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/markdown/media-file-refs --reporter=basic`
Expected: PASS(11 tests)

- [ ] **Step 5: lint / typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: エラーなし

- [ ] **Step 6: stage(commit はユーザー review 後)**

```bash
git add src/lib/mcp/markdown/media-file-refs
```

Commit message(review 承認後): `feat(mcp): add media-file-refs pure module for in-site media URL detection`

---

### Task 2: write パイプラインへの組み込み(create_post / update_post)

**Files:**

- Modify: `src/lib/mcp/tools/index.ts`
- Test: `src/lib/mcp/tools/tools.test.ts`(describe 追加)

**Interfaces:**

- Consumes: Task 1 の `findMediaFileRefs(markdown: string): MediaFileRef[]` と `rewriteMediaFileRefs(markdown: string, idByFilename: ReadonlyMap<string, number>): string`(import 元: `'../markdown/media-file-refs'`)
- Produces(module 内部、export しない):
  - `type FindMediaIDByFilename = (filename: string) => ResultAsync<number | undefined, PayloadOperationError>`
  - `resolveMediaFileRefs(bodyMarkdown: string, findMediaIDByFilename: FindMediaIDByFilename): ResultAsync<string, McpToolError>` — 解決済み markdown を返す
  - `resolveNextBody` の第 5 引数に `findMediaIDByFilename` を追加

**設計メモ(実装者向け):**

- 挿入位置は **`validateBodyMarkdown` の前**。解決後の markdown に対して既存検証(生 URL 拒否 / フェンス検証 / media 実在チェック)がそのまま走る。外部 URL は解決対象外なので従来どおり `findRawImageRefs` のエラーになる
- filename lookup が空振りしたら `BodyValidationError`(LLM 向け回復指示付き)で短絡。逐次 lookup は `verifyAllMediaExist` と同じ「先頭 + 残り」再帰パターン(`let` 禁止対応)
- `payload.find` は `overrideAccess: false, user, depth: 0, limit: 1` を揃える(既存 `findPost` / `verifyMediaExists` と同じアクセス制御方針)

- [ ] **Step 1: failing test を書く**

`src/lib/mcp/tools/tools.test.ts` の `describe('createPost with image-row')` の後に追加:

```typescript
describe('createPost with in-site media URLs', () => {
  it('auto-resolves /api/media/file/ refs to media placeholders before saving', async () => {
    const { payload, codec, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 42 }] }); // filename lookup hit
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 10, slug: 'hello' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 'hello',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: 'intro\n\n![before](/api/media/file/IMG_0185.jpeg)\n\noutro',
    });

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', where: { filename: { equals: 'IMG_0185.jpeg' } }, overrideAccess: false, user }));
    expect(codec.toLexical).toHaveBeenCalledWith('intro\n\n![media:42]()\n\noutro');
  });

  it('auto-resolves absolute in-site media URLs too', async () => {
    const { payload, codec, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 7 }] });
    payload.findByID.mockResolvedValue({ id: 5 });
    payload.create.mockResolvedValue({ id: 11, slug: 'abs' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 'abs',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![c](https://napochaan.com/api/media/file/cover.png)',
    });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith('![media:7]()');
  });

  it('rejects with a recovery hint when the referenced media file does not exist', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] }); // filename lookup miss

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![](/api/media/file/missing.png)',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('missing.png');
    expect(result.content[0]?.text).toContain('upload_media');
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('updatePost with in-site media URLs', () => {
  it('auto-resolves refs in bodyMarkdown before updating', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 4, body: paragraphBody() }); // post fetch
    payload.find.mockResolvedValue({ docs: [{ id: 9 }] }); // filename lookup hit
    payload.update.mockResolvedValue({ id: 4, slug: 's' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 4, bodyMarkdown: '![old](/api/media/file/IMG_0185.jpeg)' });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith('![media:9]()');
    expect(payload.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm vitest run src/lib/mcp/tools --reporter=basic`
Expected: 新規 4 テストが FAIL(`codec.toLexical` が生 URL のまま呼ばれない = validateBodyMarkdown が先に拒否する)。既存テストは PASS のまま

- [ ] **Step 3: 実装**

`src/lib/mcp/tools/index.ts` に以下を追加・変更する。

(a) import 追加(既存の `../markdown` import の直後):

```typescript
import { findMediaFileRefs, rewriteMediaFileRefs } from '../markdown/media-file-refs';
```

(b) `validateBodyMarkdown` の直前に module-level ヘルパを追加:

```typescript
type FindMediaIDByFilename = (filename: string) => ResultAsync<number | undefined, PayloadOperationError>;

// filename → media id の対応表を逐次 lookup で構築する(`let` 禁止のため acc を引き回す再帰)。
// 1 件でも見つからなければ LLM 向け回復指示付きで短絡する。
const lookupMediaIDs = (findMediaIDByFilename: FindMediaIDByFilename, filenames: string[], acc: ReadonlyMap<string, number>): ResultAsync<ReadonlyMap<string, number>, McpToolError> => {
  const [first, ...rest] = filenames;
  if (first === undefined) return okAsync(acc);
  return findMediaIDByFilename(first).andThen((id) => {
    if (id === undefined) {
      return errAsync(new BodyValidationError(`本文の画像 URL が指す media ファイル「${first}」が見つかりません。upload_media で画像を登録し、返された ![media:<id>]() を使ってください。`));
    }
    return lookupMediaIDs(findMediaIDByFilename, rest, new Map([...acc, [first, id]]));
  });
};

// 本文中のサイト内 media 直リンク(/api/media/file/<filename>)を ![media:<id>]() に自動解決する。
// admin UI 経由等で紛れ込んだ直リンク本文を MCP から編集可能にするための救済で、
// 外部 URL は触らず validateBodyMarkdown 側の生 URL エラーに委ねる。
const resolveMediaFileRefs = (bodyMarkdown: string, findMediaIDByFilename: FindMediaIDByFilename): ResultAsync<string, McpToolError> => {
  const filenames = [...new Set(findMediaFileRefs(bodyMarkdown).map((ref) => ref.filename))];
  if (filenames.length === 0) return okAsync(bodyMarkdown);
  return lookupMediaIDs(findMediaIDByFilename, filenames, new Map()).map((idByFilename) => rewriteMediaFileRefs(bodyMarkdown, idByFilename));
};
```

(c) `resolveNextBody` に `findMediaIDByFilename` パラメータを追加し、解決ステップを検証の前段に挿入:

```typescript
// update_post の bodyMarkdown 差し替え可否を判定する。
const resolveNextBody = (
  bodyMarkdown: string | undefined,
  current: Blog,
  toLexicalSafe: ToLexicalSafe,
  verifyMediaExists: VerifyMediaExists,
  findMediaIDByFilename: FindMediaIDByFilename,
): ResultAsync<NextBody, McpToolError> => {
  if (bodyMarkdown === undefined) return okAsync({ kind: 'skip' });
  if (hasUnsupportedBlocks(current.body)) {
    return errAsync(
      new UnsupportedBlockError(
        'この記事の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
      ),
    );
  }
  return resolveMediaFileRefs(bodyMarkdown, findMediaIDByFilename)
    .andThen((resolved) => validateBodyMarkdown(resolved, verifyMediaExists).map(() => resolved))
    .andThen((resolved) => toLexicalSafe(resolved))
    .map((body): NextBody => ({ kind: 'body', body }));
};
```

(d) `createBlogToolHandlers` 内、`verifyMediaExists` の直後に lookup 実装を追加:

```typescript
const findMediaIDByFilename: FindMediaIDByFilename = (filename) =>
  fromPromise(
    payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, overrideAccess: false, user, depth: 0 }),
    (cause) => new PayloadOperationError('media 取得に失敗しました', { cause }),
  ).map(({ docs }) => docs[0]?.id);
```

(e) `createPost` ハンドラの chain 先頭に解決ステップを挿入(解決済み markdown を chain で引き回す):

```typescript
    createPost: (input: { title: string; slug: string; excerpt: string; thumbnailMediaID: number; bodyMarkdown: string; publishedAt?: string }): Promise<ToolResult> =>
      resolveMediaFileRefs(input.bodyMarkdown, findMediaIDByFilename)
        .andThen((bodyMarkdown) => validateBodyMarkdown(bodyMarkdown, verifyMediaExists).map(() => bodyMarkdown))
        .andThen((bodyMarkdown) =>
          verifyMediaExistsOrFail(verifyMediaExists, input.thumbnailMediaID, `thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`).map(
            () => bodyMarkdown,
          ),
        )
        .andThen((bodyMarkdown) => toLexicalSafe(bodyMarkdown))
        .andThen((body) =>
          // 以降は既存の payload.create(...) 呼び出しをそのまま維持
```

`payload.create` 以降(`.map((created) => ...)` と `.match(ok, toToolError)`)は既存コードを変更しない。

(f) `updatePost` ハンドラの `resolveNextBody` 呼び出しに引数を追加:

```typescript
        .andThen((current) => resolveNextBody(input.bodyMarkdown, current, toLexicalSafe, verifyMediaExists, findMediaIDByFilename))
```

(g) `BODY_MARKDOWN_HELP` に自動変換の説明を 1 行追加(生 URL 不可の行の直後):

```typescript
const BODY_MARKDOWN_HELP = [
  '本文 Markdown。見出し・リスト・強調・リンク等の標準 Markdown が使える。',
  '画像は必ず upload_media で作成した media を使う。単一画像は ![media:<id>]()(空括弧)。',
  '生 URL 画像(![alt](https://...))は不可 — 先に upload_media で登録して id を得ること。',
  '例外: このサイトの media URL(/api/media/file/<filename>)を参照する画像は、保存時に自動で ![media:<id>]() へ変換される。',
  '',
  blockSyntaxHelp(),
].join('\n');
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/tools --reporter=basic`
Expected: PASS(既存 + 新規 4)

- [ ] **Step 5: MCP 関連スイート全体で回帰確認**

Run: `pnpm vitest run src/lib/mcp src/blocks/image-row --reporter=basic`
Expected: 全 PASS

- [ ] **Step 6: lint / typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: エラーなし

- [ ] **Step 7: stage(commit はユーザー review 後)**

```bash
git add src/lib/mcp/tools
```

Commit message(review 承認後): `feat(mcp): auto-resolve in-site media URLs to media placeholders on write`

---

### Task 3: difit review + commit

**Files:** なし(review ゲート)

- [ ] **Step 1: 全体テスト確認**

Run: `pnpm vitest run src/lib/mcp --reporter=basic && pnpm lint && pnpm typecheck`
Expected: 全 PASS / エラーなし

- [ ] **Step 2: difit を起動してユーザーに review 依頼**

```bash
npx difit
```

ユーザーの review 承認を待つ。指摘があれば修正して再依頼。

- [ ] **Step 3: 承認後に commit(Task 1 / Task 2 のメッセージで 2 commit に分割)**

```bash
git add src/lib/mcp/markdown/media-file-refs
git commit -m "feat(mcp): add media-file-refs pure module for in-site media URL detection"
git add src/lib/mcp/tools
git commit -m "feat(mcp): auto-resolve in-site media URLs to media placeholders on write"
```

---

## Out of Scope(明示的にやらない)

- 外部 URL 画像の自動アップロード(選択肢 2 相当)— 生 URL エラーのまま
- Payload サイズバリアント filename(`x-300x200.jpeg`)の逆引きフォールバック
- get_post(read 側)の挙動変更 — 既存の depth: 0 読みで `![media:<id>]()` が出る挙動を維持
- post 4 のデータ修正そのもの(この機能が入れば update_post が通るようになる)

---

## 方針変更(2026-07-17 ユーザー決定)

Task 2 の「write 時サイレント自動変換」は実装・レビュー後にユーザー判断で **廃止**し、Task 2R で以下に置き換えた(Task 1 の純粋モジュールはそのまま流用):

- **read 正規化**: `get_post` が本文 Markdown 中のサイト内 media 直リンクを `![media:<id>]()` に正規化して返す(best-effort — 対応 media が無い ref は原文のまま、get_post は失敗しない)
- **write 厳格 + id 通知**: `create_post` / `update_post` は生 URL を従来どおり拒否し、エラーメッセージに ref ごとの回復指示を同梱する(サイト内 URL で解決可 → `media id=<id>` と置き換え先を提示 / 解決不可 → upload_media 誘導 / 外部 URL → upload_media 誘導)

狙い: LLM が markdown を組む時点で常に media 参照形を使うよう誘導し、保存内容と送信内容が黙って食い違うサイレント変換を避ける。

---

## 追加要望(2026-07-17 ユーザー決定・PR #21 に追加)

1. **alt 必須化**: 単一画像プレースホルダを `![media:<id>](alt)` に拡張。get_post は media doc の alt を埋めて返し、write は空 alt を拒否。書かれた alt が doc alt と異なる場合は **media doc の alt を更新**(全記事に波及、本人了承済み)。同一記事内で同じ media に異なる alt はエラー。Lexical 変換前に `![media:<id>]()` へ戻す(Payload の import regex は空括弧のみ)。
2. **list_media tool**: filename/alt の部分一致検索付き一覧。id / filename / alt / url / width / height / placeholder(alt 入り)を返す。

設計要点:

- 汎用プリミティブ `splitCodeFences` / `mapTextSegments`(``` フェンスの外だけ変換)を新設。image-row フェンス(caption 用括弧)とコードフェンス内例示を alt 処理・URL 正規化から保護する
- placeholder の media 実在チェックを write に追加(従来は単一画像プレースホルダの id は未検証だった)
- media doc alt 同期は検証成功後・記事保存前に実行
- upload_media の返す placeholder も alt 入りに変更

### Task 5: 純粋モジュール `code-fences` + `media-placeholders`

- `src/lib/mcp/markdown/code-fences/index.ts`: `type FenceSegment = { kind: 'fence' | 'text'; text: string }` / `splitCodeFences(markdown): FenceSegment[]`(行頭 ```でトグル、未クローズは以降フェンス扱い)/`mapTextSegments(markdown, fn): string`
- `src/lib/mcp/markdown/media-placeholders/index.ts`: `PLACEHOLDER = /!\[media:(\d+)\]\(([^)]*)\)/g` を text セグメントのみに適用。`findMediaPlaceholders(markdown): { id: number; alt: string }[]` / `fillMediaPlaceholderAlts(markdown, altByID: ReadonlyMap<number, string>): string` / `stripMediaPlaceholderAlts(markdown): string`
- 両モジュール colocated TDD + I/O snapshot

### Task 6: tools 配線(alt 往復)

- `findMediaByFilename`(alt も返す)/ `findMediaByIDs`(`where: { id: { in } }` 1 クエリで id→alt map)
- get_post: raw URL 正規化を `mapTextSegments` 経由に変更 + placeholder alt fill(lenient)
- write 検証: 空 alt 拒否 / 同一 id の alt 競合拒否 / placeholder id 実在チェック / rawRefHint の置き換え先を alt 入りに
- alt 同期: doc alt と差分があれば `payload.update`(media)。その後 `stripMediaPlaceholderAlts` して toLexical
- upload_media placeholder / BODY_MARKDOWN_HELP 更新(image-row セル括弧は caption であることを注記)
- 既存テスト・snapshot 更新 + 新規ケース

### Task 7: list_media tool

- `list_posts` と同様の handler + 登録(readOnlyHint)。search は `or: [filename contains, alt contains]`、limit default 20 / max 50、sort -createdAt、depth: 0、overrideAccess: false + user
- テスト(検索あり/なし、placeholder 形式)+ I/O snapshot

### Task 8: 最終レビュー(opus)→ difit → commit / push(PR #21 に追加)
