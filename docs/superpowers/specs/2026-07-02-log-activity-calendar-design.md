# /log 活動カレンダー — 設計

日付: 2026-07-02
ステータス: 設計承認待ち → 実装計画へ

## 目的

/log の feed リンク（`rss · feed ↗`）の隣にカレンダーアイコンのトリガーを置き、クリックで
react-aria-components の Calendar をポップオーバー表示して「エントリが埋まっている日」を可視化する。
純粋な可視化のみ — 日付クリックによるスクロールやフィルタは行わない。

## 決定事項（brainstorming で確定）

| 論点                 | 決定                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| 日付クリック時の挙動 | なし（純粋に可視化のみ、`isReadOnly`）                                                                     |
| 対象データ           | タイムラインと同じ全ソース（manual log + 外部 post + 日付あり works）。日付なし works は除外               |
| 表示範囲             | 全期間自由に移動。`minValue` = 最古エントリの月初、`maxValue` = 最新エントリの月末                         |
| オーバーレイ         | `DialogTrigger + Popover + Dialog`（react-aria の Tooltip は hover 専用・非インタラクティブのため不採用）  |
| 置き場所             | Calendar 本体は **共通コンポーネント** `src/components/activity-calendar/` に置き、**colophon に登録する** |

## UI

```
PageHeader (log)
                     [▦]  rss · feed ↗   ← metaRow: ActivityCalendar トリガー + FeedLink（右寄せ、トリガーが左）
                     ┌────────────────┐
                     │  ‹   2026.07  › │  ← Calendar heading + 月送り
                     │ 日 月 火 水 木 金 土│
                     │        1  2  3 4 │
                     │  5  6• 7  8 …    │  ← エントリのある日: 小ドット
                     │ …      15◦ …     │  ← upcoming: accent 塗りドット
                     └────────────────┘
timeline …
```

- トリガーは react-aria の `Button`。FeedLink と同じ mono テキスト系トーンの小さい線画 SVG アイコン
  - `aria-label`（例:「活動カレンダーを表示」）
- ドットの記号系は timeline を踏襲: 塗り（accent）= upcoming、通常ドット = 過去のエントリ
- ドットは装飾表現。セルの中に `formattedDate` + マーカー span を描く（`data-filled` / `data-upcoming`
  属性 + styles.css.ts の属性セレクタで描画）
- キーボード操作・フォーカス管理・月送りは react-aria Calendar のものをそのまま使う

## コンポーネント分割

### 1. `src/components/activity-calendar/`（共通・'use client'）

```
activity-calendar/
├── index.tsx                      # DialogTrigger + Button + Popover + Dialog + Calendar
├── styles.css.ts                  # Panda CSS（トークンのみ、ドットは data-* 属性セレクタ）
└── activity-calendar.test.tsx     # vitest browser test
```

Props（入力契約は `T?` のみ、null は境界で吸収）:

```ts
type ActivityCalendarMark = {
  date: string;      // 'YYYY-MM-DD'（Asia/Tokyo で正規化済み）
  upcoming: boolean;
};

type Props = {
  marks: ActivityCalendarMark[];
  minDate?: string;  // 'YYYY-MM-DD' — 月送りの下限
  maxDate?: string;  // 'YYYY-MM-DD' — 月送りの上限
  label: string;     // トリガー aria-label 兼 Dialog のラベル
};
```

- `@internationalized/date` の `parseDate` で `CalendarDate` 化（直接依存に追加する）
- `Calendar` は `isReadOnly`。選択状態は持たない
- marks は `Map<string, boolean>`（date → upcoming）に `useMemo` で変換してセル描画時に参照

### 2. `src/app/(site)/log/_lib/collect-log-dates/`（純関数・TDD）

```ts
type CollectLogDatesResult = {
  marks: ActivityCalendarMark[];
  minDate?: string;
  maxDate?: string;
};

const collectLogDates = (
  works: readonly WorkRow[],
  posts: readonly ExternalPost[],
  logs: readonly LogManualItem[],
  now: string,
): CollectLogDatesResult => { ... };
```

- タイムライン（`buildLogTimeline`）と同じ 3 ソースから日付を集める
- 日付なし works は除外
- Asia/Tokyo で `YYYY-MM-DD` に正規化（`@utils/dayjs`）
- 同日複数エントリは 1 mark に畳む（upcoming が 1 つでもあれば upcoming 優先）
- upcoming 判定は `buildLogTimeline` の `toManualEntry` と同一（当日いっぱいまで upcoming）。
  manual log のみ upcoming になり得る — post / work は常に過去扱い

### 3. `src/app/(site)/log/_components/log-calendar-section/`（async RSC）

```
log/layout.tsx (RSC)
 └─ metaRow（右寄せ flex 行 — トリガーが左、FeedLink が右）
     ├─ Suspense(fallback=null)  ※ react-error-boundary は未導入・既存 LogTimelineSection も Suspense のみ。エラーは log/error.tsx に委譲
     │   └─ LogCalendarSection (async RSC)
     │       ├─ findWorksList / fetchExternalPosts / findLogList  ← unstable_cache 済み・page と共有
     │       ├─ collectLogDates(works, posts, logs, now)
     │       └─ <ActivityCalendar marks minDate maxDate label />
     └─ FeedLink（既存・無変更）
```

- client island は Popover 部分（ActivityCalendar）のみ。日付計算はすべてサーバー側
- データ層は `unstable_cache` 済みなので layout 側からの再呼び出しは実コストなし
- ISR（revalidate 3600）にそのまま乗る — カレンダーも timeline と同じ鮮度
- metaRow は右寄せ（justify-end）なので、Suspense fallback=null でも FeedLink の位置は動かない（カレンダーは左側に後から現れるだけで CLS なし）

### 4. colophon 登録

- `colophon/content.ts` の `components.items` に `{ name: 'ActivityCalendar', why: '…' }` を追加
- `colophon/_demos/index.tsx` にサンプル marks（過去ドット + upcoming ドットが見えるデータ）で demo を追加
- ActivityCalendar は href を持たないので `NoAction` ラップは不要

## レイアウト調整（log/layout.tsx）

- `FeedLink` の行を `metaRow`（`display: flex; justifyContent: flex-end; alignItems: center; gap`）で包み、
  FeedLink とトリガーを横並びにする
- FeedLink 自体は無変更。FeedLink root の `marginTop: -4` とはトリガー側スタイルで揃える
  （必要ならトリガー wrapper にも同じ negative margin）

## テスト（TDD — Red → Green → Refactor）

| 対象                         | 種別    | ケース                                                                                                                                    |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `collect-log-dates.test.ts`  | node    | 3 ソース混在 / 日付なし works 除外 / 同日重複の畳み込みと upcoming 優先 / upcoming 境界（当日・前日・翌日）/ minDate・maxDate / 空入力    |
| `activity-calendar.test.tsx` | browser | トリガークリックで popover が開く / marks の日にドットが出る（upcoming と過去の描き分け）/ minDate・maxDate で月送りが止まる / aria-label |

## a11y

- トリガー Button に `aria-label`、Popover 内 Dialog にラベル
- Calendar のセル・月送り・キーボード操作は react-aria 準拠（WCAG 2.1 AA の操作性は react-aria が担保）
- ドット自体は装飾（セルの日付ラベルは react-aria が生成するものを使用）

## 依存追加

- `@internationalized/date`（`pnpm add`）

## 完了条件

1. `pnpm lint && pnpm typecheck` パス、全テスト green
2. chrome-devtools で localhost:3000/log を目視確認（トリガー位置・popover 表示・ドット・月送り）
3. colophon ページに ActivityCalendar が表示されている
4. difit を起動してレビュー依頼

## 変更履歴

- 2026-07-02（実装中のステークホルダー決定）: 共通コンポーネントは log 特化の `ActivityCalendar` ではなく、
  **汎用プリミティブ `src/components/calendar/`（`Calendar` / `CalendarMark = { date, tone?: 'default' | 'accent' }`）**
  として抽象化する。トリガー + Popover の組み立ては log 専用の `log/_components/log-calendar/` に移動。
  `upcoming`（log ドメイン）→ `tone`（表示）の変換は RSC `log-calendar-section` の境界で行い、
  `collect-log-dates` は自前の `LogDateMark` 型を持つ。colophon には `Calendar` をインラインデモで登録する。
