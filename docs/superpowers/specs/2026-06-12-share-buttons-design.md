# 共有ボタン(ShareBar)設計

- 日付: 2026-06-12
- 対象ページ: `works/[id]`, `news/[id]`, `blog/[id]`(全詳細ページ)
- 共有先: **X(Twitter)** と **リンクコピー** の2つ

## 背景・動機

works / news / blog の各記事を SNS で共有する導線がない。読者が読了後に記事を
広められるよう、各詳細ページに共有バーを追加する。

当初 Twitter / Instagram / Copy の3つを想定していたが、**Instagram には URL を
渡して投稿を開く公式の Web 導線が存在しない**(リンク付き投稿を外部から prefill
する手段がない)。ネイティブ共有シートやプロフィール誘導は「共有」の体験として
中途半端になるため、**Instagram 枠は作らない**ことで合意。Copy がインスタへの実質
的な共有手段(手動ペースト)を兼ねる。

## 確定事項

| 項目       | 決定                                 |
| ---------- | ------------------------------------ |
| 共有先     | X(Twitter)+ リンクコピー の2つ       |
| 配置       | 記事末尾(prev/next ナビの手前)       |
| ビジュアル | border ボックス(角丸なし)・mono 語彙 |
| Instagram  | 作らない                             |

## コンポーネント設計

### `src/components/share-bar/`

- `'use client'` — clipboard API と外部遷移のために必要。クライアント島として最小化。
- Props:
  - `url: string` — サーバ側で組み立てた**絶対 URL**(正準 URL)。
  - `title: string` — 記事タイトル(tweet 本文に使用)。
- 構造: `<div role="group" aria-label="この記事を共有">` の中に border ボックス2つ。
  - 角丸なし、グリッド的な矩形。
  - `focus-visible` リング。
  - タップ領域 ≥ 44px。
  - WCAG 2.1 AA コントラストを満たす color token を使用。

```
── share ────────────────────
┌──────────────┐ ┌──────────────┐
│  X  ↗        │ │  COPY        │   ← 押すと COPIED ✓
└──────────────┘ └──────────────┘
```

### アクション

1. **X(Twitter)**
   - `https://twitter.com/intent/tweet?text={encodeURIComponent(title)}&url={encodeURIComponent(url)}`
   - `react-aria-components` の `Link`(rules: リンクは react-aria の Link を使う)。
   - 外部リンク。新規タブ(`target="_blank"` + `rel="noopener noreferrer"`)。

2. **Copy**
   - `react-aria-components` の `Button` + 非同期 `onPress`(rules: handler は async 直接、`.then`/IIFE 禁止)。
   - `await navigator.clipboard.writeText(url)`。
   - 成功後、ラベルを `COPY` → `COPIED ✓` に約 2 秒スワップして元に戻す。
   - タイマーは `useEffect` のクリーンアップで解除し、アンマウント時のリーク・更新を防ぐ。

## URL 解決

- 新規・純粋関数 `src/utils/site-url/index.ts` に `absoluteUrl(path: string): string` を追加。
  - 実装: `${process.env.BASE_URL ?? 'http://localhost:3000'}${path}`。
  - 現状この `BASE_URL ?? localhost` パターンは robots / llms.txt / preview-factory で
    3 重にインライン化されているが、**それらの置換は今回のスコープ外**(ShareBar からの
    新規利用のみ)。将来の一本化の足がかりとして関数だけ用意する。
- 各詳細ページ(server component)で path を組んで渡す:
  - works: `absoluteUrl(`/works/${id}`)`
  - blog: `absoluteUrl(`/blog/${id}`)`
  - news: `absoluteUrl(`/news/${item.id}`)`

## 配置(統合点)

記事末尾、prev/next ナビの**手前**に `<ShareBar url={...} title={...} />` を挿入。

| ページ                                   | 挿入位置               |
| ---------------------------------------- | ---------------------- |
| `works/[id]/page.tsx`                    | `<AdjacentNav>` の手前 |
| `blog/[id]/page.tsx`                     | `<BlogNav>` の手前     |
| `news/_components/news-detail/index.tsx` | `<NewsNav>` の手前     |

- news は共有レンダー `NewsDetail` が公開ページと preview ページの両方で使われる。
  `item.id` から url を算出するため preview でも動作するが、draft の共有は実害なし。

## テスト(TDD)

- 純粋関数を node 単体テスト(`.test.ts`):
  - `buildTweetUrl(title, url)` — intent URL の組み立てとエンコードを検証。
  - `absoluteUrl(path)` — `BASE_URL` 設定時/未設定時のフォールバックを検証。
- コンポーネント挙動を browser mode(`.test.tsx`)で1本:
  - Copy 押下 → `navigator.clipboard.writeText` 呼び出し + ラベルが `COPIED` にスワップ。

## colophon 登録

- `src/app/(site)/colophon/_demos` に ShareBar デモを追加(rules: components に追加したら colophon にも追加)。
- デモ内の href / 外部遷移は `e.preventDefault` で noaction にする(rules 準拠)。

## 非対象(YAGNI)

- Instagram 共有。
- ネイティブ共有シート(`navigator.share`)。
- Facebook / LINE / はてブ等の追加共有先。
- 既存インライン `BASE_URL` 3 箇所の `absoluteUrl` への一本化(別タスク)。
- 共有数カウント等の集計。
