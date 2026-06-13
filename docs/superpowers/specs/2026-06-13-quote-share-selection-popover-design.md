# 引用共有(QuoteShare)— 選択テキスト共有 Popover 設計

- 日付: 2026-06-13
- Status: Draft（レビュー待ち）
- 対象ページ: `works/[id]`, `news/[id]`, `blog/[id]`（全詳細ページの本文）
- 実装は up-to-date な `main` から branch すること（git-workflow rule）

## 背景・動機

記事末尾の `ShareBar`（記事まるごとを X / コピー）はあるが、「本文のこの一節だけを
引用して広めたい」導線がない。読者が **本文テキストを選択** したら、その箇所への
deep link（Scroll-to-Text-Fragment, `#:~:text=`）のコピーと、その一節を引用文にした
X 投稿を、選択範囲の上に浮く小さな Popover から行えるようにする。Medium 等の
ハイライト共有と同じ体験。

見出しの `#` コピー（`CopyHashButton` / `AnchoredHeading`）は**今回触らない**（現状維持）。

## 確定事項（ブレインストーミングでの合意）

| 項目          | 決定                                                                  |
| ------------- | --------------------------------------------------------------------- |
| 作るもの      | 選択共有 Popover **のみ**（見出し `#` は現状維持）                    |
| 対象デバイス  | **PC（`pointer: fine`）のみ**。タッチは OS 標準の選択メニューに委ねる |
| UI            | **`Popover`**（`Tooltip` はボタンを内包できないため不可）             |
| text fragment | **素朴 encode**（`encodeURIComponent(selectedText)`）                 |
| アクション    | ① 引用リンクをコピー ② X で引用                                       |

## インタラクション

```
              ┌──────────────────────────────┐
              │  ⧉ 引用リンク     X で引用 ↗  │  ← 選択範囲の真上に浮く Popover
              └───────────────┬──────────────┘  （placement="top"）
                              ▼
   本文の中で [ ここをドラッグ選択している ] と pointerup で出る
```

- mouse で本文をドラッグ選択 → `pointerup` で選択範囲を確定 → 範囲の bounding rect の
  上に Popover を表示。
- ① **引用リンク**を押す → `https://…/blog/x#:~:text=選択テキスト` をクリップボードへ。
  ラベルが一時的に確認状態へ（`useAutoResetState`、ShareBar と同じ idiom）。
- ② **X で引用**を押す → 選択テキストを引用文、上記フラグメント URL を `url` にした
  X intent を新規タブで開く。
- 閉じる: Escape / 外側クリック（`Popover` 標準）、本文内で新しい選択を始めた時
  （`pointerdown`）、選択が空になった時。

## アーキテクチャ

### 新コンポーネント `src/components/quote-share/`

server-render された本文（`<RichText>`）を **children として受け取る client 島**。
本文自体は RSC のまま、この薄いラッパだけが hydrate する。

```
quote-share/
├── index.tsx                    # 'use client' <QuoteShare url={...}>{children}</QuoteShare>
├── build-text-fragment-url.ts   # pure: (baseUrl, text) => `${base}#:~:text=<encoded>`
├── build-text-fragment-url.test.ts
├── styles.css.ts                # Popover / Toolbar / triggerRef span
└── quote-share.test.tsx         # vitest browser-mode 挙動テスト
```

#### `index.tsx`

- Props: `{ url: string; children: ReactNode }`（`url` = 正準絶対 URL。ShareBar に
  渡しているものと同じ `absoluteUrl(path)`）。`null` を input に入れない（function-arg-types）。
- `usePointerFine()` が `false`（タッチ等）なら **`children` をそのまま返す**
  （リスナも Popover も付けない。本文は常に描画される）。
- `pointer: fine` の時:
  - ラッパは `display: contents`（レイアウトに影響を与えず `containerRef.contains()`
    でスコープ判定に使う）。
  - `onPointerUp`（合成イベント、useEffect 不使用）で `window.getSelection()` を読み、
    container 内の非空選択なら `{ text, rect }` を **`useState` に捕獲**し Popover を開く。
    空選択なら開かない／開いていれば閉じる。
  - `onPointerDown` で、Popover の外で新しい選択が始まったら捕獲をクリアして閉じる。
  - **捕獲したスナップショットからアクション URL を作る**（ライブの selection ではなく）。
    ボタン押下で選択が解除されても URL が確定済みなので壊れない（既知の罠の回避）。
- **standalone `Popover`**（公式に対応: `triggerRef` + 制御 `isOpen`/`onOpenChange`
  - `placement="top"` + `isNonModal`）。`triggerRef` は捕獲 rect の位置に置いた
    0×0 の固定要素（`position: fixed`、left/top/width/height を CSS 変数で渡す
    — dynamic-styles rule のカスタムプロパティ例外）。
- Popover の中身は **react-aria `Toolbar`**（`role="toolbar"`、focus trap なし、
  矢印キーで2アクション間を移動）。中に:
  - **引用リンク**: `@components/button` の `Button`（`onPress` は async 直接、`.then`/IIFE 禁止）。
    `await navigator.clipboard.writeText(buildTextFragmentUrl(url, text))` → `setCopied(true)`。
  - **X で引用**: `@components/button` の `Button` を `href` で（ShareBar と同じ作法）。
    `href={buildTweetUrl(quote, buildTextFragmentUrl(url, text))}`、`target="_blank"`
    `rel="noopener noreferrer"`。`quote` は選択テキストを短く整形（下記）。
- 装飾グリフ（⧉ / ↗）は CSS `::before`/`content` で描く（JSX に直書きしない
  — share-bar review rule）。状態は `data-copied` 属性（条件 className 禁止、variant-styling）。

#### `build-text-fragment-url.ts`（pure / node テスト）

```ts
// 既存の #fragment を除去し、Scroll-to-Text-Fragment を付ける。
// 素朴方式: 単一ブロック前提で選択テキストをそのまま encode。長文は先頭を上限で切る。
export const buildTextFragmentUrl = (baseUrl: string, selectedText: string): string => {
  const base = baseUrl.split('#')[0] ?? baseUrl;
  const text = selectedText.trim().slice(0, MAX_FRAGMENT_LEN); // 例: 200
  return `${base}#:~:text=${encodeURIComponent(text)}`;
};
```

### 既存 util の昇格（小さなリファクタ・正当化あり）

`buildTweetUrl(title, url)` は現状 `src/components/share-bar/build-tweet-url.ts` に
component-internal で存在。**消費者が2つ**（ShareBar・QuoteShare）になるため
`src/utils/tweet-intent/`（`index.ts` + 既存テスト移設）へ昇格し、両者が import する。
signature は不変。share-bar 側の import を差し替えるだけ。

- 引用文 `quote`: 選択テキストを `「…」` で囲み、約100字 + 省略記号で切った文字列。
  小さな pure helper（`truncate-quote`）として `quote-share/` に置くか
  `index.tsx` 内 inline（単一責任で切り出すなら前者）。X の文字数 / URL 長を考慮。

### 新フック `src/hooks/use-pointer-fine/`

`useSyncExternalStore` で `matchMedia('(pointer: fine)')` を購読し `boolean` を返す
（戻り値は primitive で参照安定、`use-prefers-reduced-motion` と同じ matchMedia 作法）。
`getServerSnapshot` は `false`（SSR は touch 想定の安全側）。

## 組み込み（統合点）

各詳細ページで本文 `<RichText>` を `<QuoteShare url={...}>` でラップ。`url` は
ShareBar に渡している正準 URL と同一。

| ページ                                   | ラップ対象                                   | url                        |
| ---------------------------------------- | -------------------------------------------- | -------------------------- |
| `blog/[id]/page.tsx`（bodyCol）          | `<RichText data={post.body} />`              | `absoluteUrl(/blog/${id})` |
| `news/_components/news-detail/index.tsx` | `<RichText data={item.body} />`              | `absoluteUrl(/news/${id})` |
| `works/[id]/_components/work-detail`     | `<RichText data={body} className={s.body}/>` | 親から `url` prop を渡す   |

works のみ `WorkDetail` に `url` prop を増やし、内部で RichText をラップする
（`works/[id]/page.tsx` は既に `absoluteUrl(/works/${id})` を算出済み → それを渡す）。

## テスト（TDD: Red → Green → Refactor）

- **pure（node, `.test.ts`）**
  - `build-text-fragment-url`: encode、既存 `#` 除去、上限切り詰め。
  - `tweet-intent/build-tweet-url`: 移設後も intent URL 組み立て・encode（既存テスト流用）。
  - `truncate-quote`（切り出す場合）: 100字超で省略記号、`「」` 付与。
- **挙動（browser mode, `.test.tsx`）**: サンプル本文を render →
  Range を作り選択 → `pointerup` dispatch → Popover が2アクション付きで出る →
  「引用リンク」押下で `navigator.clipboard.writeText`（mock）に `#:~:text=` 付き URL →
  「X で引用」の href に intent + フラグメント URL。空選択では Popover が出ないこと。

## colophon 登録（components rule 必須）

- `colophon/_demos/index.tsx` に `quoteShare` デモ（選択用のサンプル段落 + 説明）。
  実際に選択して挙動を見せられる。
- `colophon/content.ts` の `components.items` に `{ name: 'quoteShare', why }` を追加。
- デモ内の X リンク / 外部遷移は `e.preventDefault` で noaction（rule 準拠）。
- 追加後に panda codegen が要るトークンは無い想定（既存トークンで構成）。

## 非対象（YAGNI）

- 見出し `#` コピーの変更（現状維持）。
- タッチ / モバイルでの Popover 表示（OS 標準に委ねる）。
- 堅牢な range 生成（prefix/suffix 付き Chrome アルゴリズム移植）。素朴 encode のみ。
- キーボード選択（shift+矢印）からの起動。pointerup 起動の MVP 範囲外。
- 引用以外のアクション（プレーンテキストコピー等）。

## リスク / 既知の割り切り

- **ブロックまたぎ選択**: `#:~:text=` は単一ブロック内マッチが基本。複数段落に
  またがる選択は素朴 encode では当たらないことがある（先頭ブロックのみハイライト等）。
  リンク自体はフラグメント非対応ブラウザ含め通常 URL として機能する（ハイライト無しで開く）。
- **長文選択**: 上限で先頭を切る。完全一致しない場合あり（既知）。
- **ブラウザ対応**: text fragment は Chromium / Safari 16.4+。Firefox は既定オフ。
  未対応でも URL は有効。
- **選択解除の罠**: ボタン押下時に selection が collapse しても、捕獲済み
  スナップショットから URL を作るため動作する（上記アーキ参照）。
- **clipboard 不可/拒否**: `writeText` が reject → async handler は握り潰さず
  `console.error`、state は変化しない（CopyHashButton と同じ無害な no-op）。

## Revision — 2026-06-14（実装後の方針変更）

実装を進める中で、当初の Scroll-to-Text-Fragment 方式を取りやめ、次の最終形に落ち着いた。

1. **text fragment（`#:~:text=`）は廃止。** URL に選択箇所のアンカーは付けない。
   `build-text-fragment-url` は削除。
2. **共有は「引用ブロック」テキストに統一。** コピー / X 引用の両方が同じブロックを使う:

   ```
   > {選択文（100字でクリップ）}
   {ページタイトル} | {ページURL}
   ```

   - **コピー**: 上記ブロックをそのままクリップボードへ（`コピーしました`/✓ に一時スワップ）。
   - **X で引用**: 上記ブロックを intent の `text` に入れる（`&url=` は使わず、`タイトル | URL`
     を1行に保つ）。`build-quote-block` / `build-quote-tweet-url`（純粋関数・TDD）に分離。

3. **`QuoteShare` に `title` prop を追加**（blog=post.title / news=item.title /
   works=work.title）。`truncateQuote` は 「」 を付けず素のクリップに変更。
4. **ビジュアルは枠線 Popover を維持**（note.com 風ダークピルは不採用）。アクションは
   アイコン+テキストの `size="sm"` ボタン2つ。`CopyIcon` を追加、`LinkIcon` は撤去。
5. **`@components/button` を `type` 判別子へリファクタ。** `href` 有無ではなく
   `type: 'link' | 'button' | 'submit' | 'reset'` で要素を判別（`variant`/`size` は別軸）。
   link 利用箇所（hero / share-bar / quote-share）に `type="link"` を付与。submit
   （contact-form）はネイティブ type として維持。

```

```
