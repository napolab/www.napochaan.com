# MCP 画像参照ミニパーサ化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR #21 で入った regex 積層(media-file-refs / media-placeholders + tools 内の述語群)を、「fence lexer → 画像参照ミニパーサ(型付きノード)→ processor → serializer」構成に置き換える**振る舞い保存リファクタ**。既存 136 テスト + I/O snapshot を無変更で通すことが等価の証明。

**Architecture:** `splitCodeFences`(既存)を外側 lexer として維持。text セグメント内の `![...](...)` を 1 回だけパースして判別 union `ImageRef`(placeholder / mediaFile / external)に落とす。パースは prefix-match-processor 形式の plugin registry(first-match)。後段処理(fill / strip / rewrite / hint 分類)はノード列上の exhaustive `switch`。serializer が文法の不変条件(alt に `)` 不可)を一元管理する。

**Tech Stack:** TypeScript (tsgo), neverthrow, vitest (node env), oxlint/oxfmt。新規依存なし。

## Global Constraints

- **振る舞い保存**: `src/lib/mcp/tools/tools.test.ts` と既存 snapshot は原則 1 文字も変えない(変えたくなったら等価でない証拠 — 実装を疑う)。media-file-refs / media-placeholders / code-fences の既存テストは、モジュール置換に伴い移設・書き換え可
- `pnpm lint && pnpm typecheck` を各タスク末で実行(`npx tsc` 禁止)
- **勝手に commit しない** — 各タスクは stage まで。最後に difit → ユーザー承認 → commit
- arrow functions のみ / `let`・IIFE・non-null assertion・`forEach`・`any` 禁止 / wrapper coercion 禁止・`parseInt(x, 10)`
- 頭字語: `ImageRef` 系の `ID`・`URL` は全大文字を維持
- neverthrow combinator 合成、`.match` は edge のみ。パース plugin は `run(input): Result<Node, input>`(非マッチ = `err(input)`、throw / null 禁止)
- colocation TDD、barrel 禁止
- prefix-match-processor の適用範囲は**参照の家族分け(パース)のみ**。ノード後段処理は判別 union の `switch`(registry に押し込まない)

---

### Task 1: `image-ref` ミニパーサモジュール

**Files:**

- Create: `src/lib/mcp/markdown/image-ref/index.ts`
- Test: `src/lib/mcp/markdown/image-ref/image-ref.test.ts`

**Interfaces (Produces):**

```typescript
export type ImageRef =
  | { kind: 'placeholder'; id: number; alt: string }
  | { kind: 'mediaFile'; filename: string; alt: string }
  | { kind: 'external'; target: string; alt: string };

export type InlineNode = { kind: 'text'; raw: string } | ({ node: ImageRef; raw: string } & { kind: 'image' });
// ↑実装時は { kind: 'text'; raw } | { kind: 'image'; raw; ref: ImageRef } の 2 分岐で可

// text セグメント(フェンス外)を走査し、![...](...) を ImageRef ノードへ、それ以外を text ノードへ。
export const parseInlineNodes = (text: string): InlineNode[];

// ノード列 → markdown 文字列。parse → serialize は恒等(raw を保持しているため)。
export const serializeInlineNodes = (nodes: InlineNode[]): string;

// ImageRef → canonical 文字列。placeholder は ![media:<id>](<alt>)。
// alt に ")" を含む場合はこの文法で表現不能 — ここが不変条件の一元管理点。
export const serializeImageRef = (ref: ImageRef): string;
export const isRoundTrippableAlt = (alt: string): boolean;
```

**設計メモ:**

- スキャンは既存 `IMAGE_REF` 相当(`/!\[[^\]]*\]\(([^)]*)\)/g`)を「トークン検出」に使い、検出した参照文字列を **plugin registry(first-match)** で家族分けする:
  1. `placeholderPlugin`: 括弧前の `[...]` が `media:<digits>` → placeholder(alt = 括弧内)
  2. `mediaFilePlugin`: 括弧内先頭トークンの pathname が `/api/media/file/` → mediaFile(filename は decodeURIComponent、失敗/ネスト path は非マッチ)
  3. `externalPlugin`: 残り全部 → external
- plugin は `{ run(raw: string): Result<ImageRef, string> }`、runner は先頭から試して最初の ok(prefix-match-processor の canonical shape。順序: placeholder → mediaFile → external — 最後は必ず ok)
- 各ノードは `raw`(元文字列)を保持 — 未変換ノードの serialize は raw をそのまま返すことで恒等性を保証(title 付き・`%20` エンコード等も破壊しない)
- 既存挙動の再現に注意: `![media:007](x)` は placeholder id=7 だが raw 保持で見た目維持(fill 時は raw の id 表記を保つ — 既存テストが固定済み)。`![media:12x](a)` は placeholder 非マッチ → external。`![x]()`(空括弧・非 placeholder)は現行 `IMAGE_REF` が `[^)]+` だった箇所と挙動を揃える… **現行との差異が出る入力はテストで洗い出し、既存 tools snapshot が変わらない範囲に留める**
- markdown の `]` 入り alt・title 内 `)` の完全対応は**このリファクタではやらない**(検出トークンの regex は現行と同一にして挙動保存を優先。文法強化は次の機会)

**Steps:** brief 化の際に(1) 家族分け plugin + runner のテスト→実装 (2) parse/serialize 恒等 property テスト(fixture 群で serialize(parse(x)) === x)→実装 (3) `pnpm lint && pnpm typecheck` (4) stage。

### Task 2: tools を image-ref ノードパイプラインに置換

**Files:**

- Modify: `src/lib/mcp/tools/index.ts`
- Delete: `src/lib/mcp/markdown/media-file-refs/`(モジュールごと)
- Delete: `src/lib/mcp/markdown/media-placeholders/`(モジュールごと)
- Keep: `src/lib/mcp/markdown/code-fences/`(外側 lexer として続投)
- Test: `src/lib/mcp/tools/tools.test.ts` は**無変更で全通し**(等価の証明)。削除モジュールのテストのうち意味のあるケースは image-ref のテストへ移設済みであること(Task 1)

**置換対応表(旧 → 新):**

- `findMediaFileRefs(md)` → parse して `kind: 'mediaFile'` ノードを集める
- `rewriteMediaFileRefs(md, idByFilename)` → mediaFile ノードを placeholder ノードに差し替えて serialize
- `findMediaPlaceholders(md)` → placeholder ノード列挙(フェンス外は mapTextSegments…ではなく、セグメント単位で parse)
- `fillMediaPlaceholderAlts(md, altByID)` / `filterRoundTrippableAlts` → placeholder ノードの alt 差し替え(round-trippable でない alt はスキップ)+ serialize
- `stripMediaPlaceholderAlts(md)` → placeholder ノードの alt を '' にして serialize
- `isMediaPlaceholderRef` / `RAW_IMAGE_REF` ベースの raw 判定 → ノード kind で判定(`mediaFile` / `external` が raw、`placeholder` は raw でない)
- `rawRefHint` の 3 分岐 → `switch (ref.kind)` の exhaustive switch
- `isRoundTrippableAlt` は image-ref モジュールへ移動(tools からは import)

**注意:** `findRawImageRefs`(markdown/index.ts、block-support strip 経由)は get_post/write 検証で今も使われている。この置換で tools 側の raw 判定がノードベースになった後、`markdown/index.ts` 側の `RAW_IMAGE_REF`・`findRawImageRefs` が不要になるなら削除まで含める(dead code を残さない)。ただし fence-strip の 2 系統問題の統一は**このリファクタの範囲外**(挙動が変わるため)。

### Task 3: 最終確認

- `pnpm vitest run src/lib/mcp src/blocks/image-row` 全 PASS(tools.test.ts 無変更のまま)
- `git diff` で tools.test.ts と snapshot に差分ゼロを確認(あれば等価でない — 戻って直す)
- `pnpm lint && pnpm typecheck` / opus 最終レビュー → difit → ユーザー承認後 commit

## 挙動変更の承認 (2026-07-17)

Task 2 注意の「fence-strip 統一は範囲外」を訂正する。raw 検査のフェンス扱いを generic ` ``` ` フェンスに統一した(旧: image-row のみ除外)。コードフェンス内の生 URL 例は write で素通しになる — get_post との対称化で往復バグ修正、ステークホルダー承認済み。
