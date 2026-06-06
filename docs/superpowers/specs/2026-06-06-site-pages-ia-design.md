# サイト下層ページ 情報設計(IA)spec

作成日: 2026-06-06
ステータス: 洗い出し確定 / 各ページ UI 設計は本 spec を起点に1ページずつ実施

## 目的

CMS 統合に着手する前に、トップで確立した洗練された UI/UX を基準として「トップから遷移できる下層ページ」を洗い出し、共通レイアウトとエラーページ方針を確定する。本 spec は **情報設計(IA)レイヤ**を対象とし、各ページの詳細 UI 構成は後続で1ページずつ詰める。

## 背景(現状)

トップは単一ページ + アンカーセクション構成。

- `(site)/layout.tsx` が `SiteShell`(TypographyBand / GameOfLife 背景 / SysBar / SiteFooter)で全ページ共通の chrome を提供。
- `(site)/page.tsx` が Hero + 各 teaser セクション(about / news / works / log / gallery / blog)を並べる。
- SysBar nav は現状すべてアンカー(`#about` 等)。
- `news[].href → /news/{id}`、`posts[].href → /blog/{id}` は既に詳細ページ前提だが、遷移先は未実装。
- エラーページは未実装(payload admin の not-found のみ)。

## 確定方針(ステークホルダー合意済)

1. トップの各セクションは「専用ページへの入口(teaser)」とし、**全セクションを独立ページ化**する。
2. SysBar nav は全てアンカーから**実ページ遷移**へ変更する。トップは teaser ハブとして維持し、各 teaser に「→ full page」リンクを足す。
3. 進め方は **全ページ洗い出し → 1ページずつ設計**。
4. **contact は今回スコープ外**。Hero の `contact →` ボタンはフォームページではなく、メール / SNS リンクに代替する。
5. エラー系は **not-found(404)/ error(500)/ global-error / loading スケルトン**まで作る。

## サイトマップ(確定 10 ページ + システムページ)

```
src/app/(site)/
│
├─ /                  home          teaser ハブ(維持 + 各セクションに「→ full」リンク)
│
├─ /about             about         プロフィール(whoami のフル版: skills/now/likes/wants)
├─ /works             works 一覧     制作物グリッド(全件)             ┐ index
├─ /works/[id]        works 詳細     大ビジュアル + 説明 + 関連         ┘ detail
├─ /news              news 一覧      お知らせ全件(年月グルーピング)    ┐
├─ /news/[id]         news 詳細      短文お知らせ本文                  ┘
├─ /blog              blog 一覧      記事カード一覧                    ┐
├─ /blog/[id]         blog 詳細      rich-text 本文 + TOC(既存資産)   ┘
├─ /log               log           活動年表フル(news+works 合成・timeline 既存)
├─ /gallery           gallery       画像グリッドフル
│
├─ not-found.tsx      404           Hero の "▸ not found" danger モチーフ流用
├─ error.tsx          500           クライアント境界・ランタイムエラー(reset)
├─ global-error.tsx   layout崩壊     ルート layout 落下時の最小フォールバック
└─ loading.tsx        skeleton      index/detail の CLS 防止スケルトン
```

実ページ内訳: home / about / works(2) / news(2) / blog(2) / log / gallery = **10**。

## データソース対応(CMS 統合の見通し)

| ページ系統       | データ源                     | 区分                             |
| ---------------- | ---------------------------- | -------------------------------- |
| works(一覧/詳細) | works コレクション           | CMS 主対象                       |
| blog(一覧/詳細)  | blog コレクション            | CMS 主対象                       |
| news(一覧/詳細)  | news コレクション            | CMS 主対象                       |
| log              | news + works(+release)の合成 | 派生ビュー(専用コレクション不要) |
| about            | global(profile)              | global                           |
| gallery          | media / works 画像の集約     | 集約ビュー                       |
| home             | 上記の teaser(各最新 N 件)   | 集約                             |

`/log` は新規データを持たず news + works を年表に束ねる派生ビュー。メモリ `news-vs-log-rule`(news = 厳選お知らせ / log = 活動年表)と一致する。

## 共通レイアウト方針

レイヤを「layout.tsx で共有するもの」と「コンポーネントで共有するもの」に分離する。

```
┌─ (site)/layout.tsx  = SiteShell【全ページ共通・既存】 ───────────┐
│   TypographyBand / GameOfLife 背景 / SysBar / SiteFooter        │
│  ┌─ 各 page.tsx ───────────────────────────────────────────┐  │
│  │  home    → Hero + teaser 群(PageHeader なし・特別扱い)    │  │
│  │  subpage → <PageHeader/> + 本文                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

- **layout.tsx で共有(済)**: `SiteShell`。既に `(site)` 配下全体に効くため、新ページも自動で背景・SysBar・Footer を被る。**追加の共通 layout は作らない**。
- **コンポーネントで共有(新規)**: `PageHeader`(breadcrumbs + ページタイトル + system annotation)。タイトル / パンくずはページ固有データのため layout.tsx には押し込めず、各 subpage が `<PageHeader>` を描画する。
- route group `(site)/(pages)/layout.tsx` の追加は **却下**。layout はページ固有タイトルを受け取れず、PageHeader をコンポーネント化すれば十分。route group を増やさない。

### PageHeader(新規共通コンポーネント・概要)

- 入力: `title`(必須)、`breadcrumbs`(items 配列)、`annotation`(任意の system annotation テキスト/座標遊び)。
- 既存資産を合成: `Breadcrumbs`(`@components/breadcrumbs`)、`SectionHeading` / `Heading`、`SystemAnnotation`。
- home は使わない(Hero が見出しを兼ねる)。subpage 共通の上部 chrome。
- 詳細 UI(タイポ・余白・annotation の遊び)は後続の「共通基盤」設計で確定。

## エラー / システムページ方針

| ファイル                  | 役割              | 設計方針                                                                                            |
| ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `(site)/not-found.tsx`    | 404               | Hero の `▸ not found` / danger 角丸モチーフ流用。座標遊び(35.6595…)で世界観統一、`enter → /` ボタン |
| `(site)/error.tsx`        | 500               | `'use client'` 必須(`reset` 受け取り)。`● rec` 停止風演出 + retry ボタン                            |
| `(site)/global-error.tsx` | layout 自体の崩壊 | ルート layout 落下時の最小フォールバック(SiteShell に依存しない自己完結 HTML)                       |
| `loading.tsx`(各所)       | skeleton          | index/detail の CLS 防止。hooks を持たない純粋スケルトンコンポーネント(react.md 準拠)               |

## ビルド順(1ページずつ設計の順序)

1. **共通基盤**: `PageHeader` + `not-found` + `error` + `global-error`(全ページの土台・世界観確定)
2. **works** 一覧 → 詳細(画像中心・CMS 統合の typical ケース)
3. **blog** 一覧 → 詳細(rich-text / TOC 既存資産を活かす)
4. **news** 一覧 → 詳細(短文・log との関係確認)
5. **log / gallery / about**(合成ビュー・単一ページ群)
6. **home**: SysBar nav をアンカー → 実ページへ変更、各 teaser に「→ full」リンク追加、Hero `contact →` をメール/SNS に差し替え

各ステップは個別に brainstorming で UI 構成(ASCII ワイヤーフレーム → AskUserQuestion でパターン提示)を詰めてから実装する。

## スコープ外(今回やらないこと)

- contact ページ / フォーム送信(別途検討)。
- 各ページの詳細 UI 設計・実装(本 spec の後続)。
- CMS コレクション定義・migration(ページ設計が固まってから)。
- ページネーション(news/blog/works 一覧が増えたら別途。現状 YAGNI)。

## 未決事項(後続で確定)

- `PageHeader` の annotation 遊びの具体(座標 / system tone)。
- `/log` 年表のグルーピング粒度(年 / 月 / 種別)。
- `/gallery` のフルページ・レイアウト(home gallery-section の拡張か別構成か)。
- home の teaser「→ full」リンクの文言と配置。
