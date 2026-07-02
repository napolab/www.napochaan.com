# /log 活動カレンダー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /log の feed リンクの左にカレンダートリガーを置き、クリックで react-aria Calendar のポップオーバーを開いてエントリのある日をドットで可視化する。

**Architecture:** 共通 client コンポーネント `ActivityCalendar`（DialogTrigger + Popover + read-only Calendar）に、サーバー側で純関数 `collectLogDates` が集計した marks を渡す。配線は async RSC `LogCalendarSection` が担い、log/layout.tsx の右寄せ metaRow に FeedLink と横並びで置く。colophon に登録する。

**Tech Stack:** Next.js 15 App Router / react-aria-components v1.17 / @internationalized/date（新規追加）/ Panda CSS (strictTokens) / vitest（node + browser）/ dayjs (`@utils/dayjs`, Asia/Tokyo)

**Spec:** `docs/superpowers/specs/2026-07-02-log-activity-calendar-design.md`

## Global Constraints

- パッケージ操作は `pnpm add` / `pnpm remove`
- top-level 関数はアロー関数のみ。`let` / IIFE / non-null `!` / `forEach` / `any` 禁止
- `Boolean()`/`String()`/`Number()` ラッパー禁止。真偽は `===`/`!==`、文字列化はテンプレートリテラル
- 日付は `import { dayjs } from '@utils/dayjs'` + 必ず `.tz('Asia/Tokyo')`。生 `Date` 禁止
- スタイルは `styles.css.ts`（Panda CSS・トークンのみ、非トークン値は `'[...]'` エスケープ）。`style` prop は CSS 変数のみ可
- variant は `data-*` 属性 + 属性セレクタ。条件付き className 禁止
- スタイル import は `import * as styles from './styles.css'`
- 子孫セレクタ禁止（`&:hover` `&[data-*]` `_after` 等は可）
- props 入力契約は `T?` のみ（`| null` 禁止）
- コールバック/オブジェクトを子に渡すときは `useCallback` / `useMemo`
- テストは colocation: `<name>.test.ts`（node 実行）/ `<name>.test.tsx`(browser 実行、DOM を触るなら JSX がなくても .tsx)
- 実装完了ごとに `pnpm lint && pnpm typecheck`
- **commit はユーザー確認後**（勝手に commit しない — 各 Task の commit step 前に承認を得ること。ブランチ全体への包括承認があれば個別確認は不要）

---

### Task 0: ブランチ準備 + 依存追加

**Files:**

- Modify: `package.json`（`@internationalized/date` 追加）
- Modify: `vitest.config.ts`（browser project の `optimizeDeps.include` に追加）

**Interfaces:**

- Produces: `@internationalized/date` の `parseDate` / `CalendarDate` が import 可能になる

- [ ] **Step 1: main を最新化してブランチ作成**

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main
git switch -c feat/log-activity-calendar
```

- [ ] **Step 2: 依存追加**

```bash
pnpm add @internationalized/date
```

- [ ] **Step 3: vitest optimizeDeps に追加**

`vitest.config.ts` の browser project にある `optimizeDeps.include` 配列（`'react-aria-components'` がある配列）に 1 行追加:

```ts
            'react-aria-components',
            '@internationalized/date',
```

理由: browser mode は依存を mid-run に発見すると Vite がリロードしてテストがフレークする（CI で顕在化）。新規依存は必ず事前バンドルに載せる。

- [ ] **Step 4: 動作確認**

```bash
pnpm vitest run src/components/feed-link/feed-link.test.tsx
```

Expected: PASS（既存テストが依存追加後も通ること）

---

### Task 1: ActivityCalendar 共通コンポーネント（TDD・browser）

**Files:**

- Create: `src/components/activity-calendar/index.tsx`
- Create: `src/components/activity-calendar/styles.css.ts`
- Create: `src/components/activity-calendar/activity-calendar.test.tsx`

**Interfaces:**

- Consumes: `@internationalized/date` の `parseDate`, `CalendarDate`
- Produces:
  - `export type ActivityCalendarMark = { date: string; upcoming: boolean }`（date は 'YYYY-MM-DD'）
  - `export const ActivityCalendar: (props: { marks: ActivityCalendarMark[]; minDate?: string; maxDate?: string; label: string }) => JSX.Element`

- [ ] **Step 1: 失敗するテストを書く**

`src/components/activity-calendar/activity-calendar.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ActivityCalendar } from './index';

import type { ActivityCalendarMark } from './index';

const marks: ActivityCalendarMark[] = [
  { date: '2026-01-10', upcoming: false },
  { date: '2026-01-15', upcoming: true },
];

// min/max を 1 月に固定すると、実行日がいつでも focusedValue が 2026-01 にクランプされ
// 表示月が決定的になる（ついでに両方向の月送り無効も検証できる）。
const singleMonth = { minDate: '2026-01-01', maxDate: '2026-01-31' };

describe('ActivityCalendar', () => {
  it('トリガーをクリックするとカレンダーの dialog が開く', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('marks の日付セルに data-mark が付く（past / upcoming の描き分け）', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    await expect.poll(() => document.querySelectorAll('[data-mark="past"]').length).toBe(1);
    await expect.poll(() => document.querySelectorAll('[data-mark="upcoming"]').length).toBe(1);
  });

  it('minDate / maxDate の月では月送りボタンが無効になる', async () => {
    render(<ActivityCalendar marks={marks} {...singleMonth} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('button', { name: '前の月' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: '次の月' })).toBeDisabled();
  });

  it('min/max が無いときは月送りできる', async () => {
    render(<ActivityCalendar marks={marks} label="活動カレンダー" />);
    await page.getByRole('button', { name: '活動カレンダー' }).click();
    await expect.element(page.getByRole('button', { name: '前の月' })).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: 実行して失敗を確認**

```bash
pnpm vitest run src/components/activity-calendar/activity-calendar.test.tsx
```

Expected: FAIL（`./index` が存在しない）

- [ ] **Step 3: styles.css.ts を書く**

`src/components/activity-calendar/styles.css.ts`:

```ts
import { css } from '@styled/css';

// FeedLink と同じ mono テキスト系トーン。metaRow で横に並ぶ前提。
export const trigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  color: 'fg.muted',
  cursor: 'pointer',
  '&[data-hovered]': {
    color: 'accent.text',
  },
});

// Floating surface — sys-bar / quote-share の popover トークンに合わせる。
export const popover = css({
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
});

export const dialog = css({
  padding: '3',
  outline: 'none',
});

export const headerRoot = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  marginBottom: '2',
});

export const heading = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
});

export const navButton = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  paddingX: '2',
  color: 'fg.muted',
  cursor: 'pointer',
  '&[data-hovered]': {
    color: 'accent.text',
  },
  '&[data-disabled]': {
    opacity: '[0.35]',
    cursor: 'default',
  },
});

export const headerCell = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  fontWeight: 'normal',
  color: 'fg.muted',
  paddingBottom: '1',
});

// セル下端のドットは ::after で描く（装飾グリフは CSS で描く — JSX に直書きしない）。
// timeline の記号系を踏襲: 塗り(accent) = upcoming、muted ドット = 過去エントリ。
export const cell = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.default',
  '&[data-outside-month]': {
    visibility: 'hidden',
  },
  '&[data-disabled]': {
    color: 'fg.muted',
  },
  _after: {
    content: '""',
    position: 'absolute',
    bottom: '[3px]',
    left: '[calc(50% - 2px)]',
    width: '[4px]',
    height: '[4px]',
    borderRadius: 'full',
    bg: 'transparent',
  },
  '&[data-mark="past"]': {
    _after: {
      bg: 'fg.muted',
    },
  },
  '&[data-mark="upcoming"]': {
    _after: {
      bg: 'accent.solid',
    },
  },
});
```

注意（strictTokens）: `'[...]'` エスケープが必要な値は上記の通り。`pnpm lint` / panda が別の書き方を要求したらトークン優先で直す。トークン名（`fg.muted` / `fg.default` / `bg.canvas` / `accent.text` / `accent.solid` / borderWidth `default`）は feed-link / quote-share / timeline の styles.css.ts で使用実績あり。

- [ ] **Step 4: index.tsx を実装**

`src/components/activity-calendar/index.tsx`:

```tsx
'use client';

import { parseDate } from '@internationalized/date';
import { useCallback, useMemo } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Dialog,
  DialogTrigger,
  Heading,
  I18nProvider,
  Popover,
} from 'react-aria-components';

import * as styles from './styles.css';

import type { CalendarDate } from '@internationalized/date';

// 'YYYY-MM-DD'（Asia/Tokyo で正規化済み）の日付と、その日が「これから」かどうか。
// upcoming の判定はサーバー側（collectLogDates）の責務 — この component は描き分けるだけ。
export type ActivityCalendarMark = {
  date: string;
  upcoming: boolean;
};

type Props = {
  marks: ActivityCalendarMark[];
  minDate?: string;
  maxDate?: string;
  label: string;
};

const toCalendarDate = (iso?: string): CalendarDate | undefined => {
  if (iso === undefined) return undefined;
  return parseDate(iso);
};

const resolveMark = (upcoming?: boolean): 'past' | 'upcoming' | undefined => {
  if (upcoming === undefined) return undefined;
  return upcoming ? 'upcoming' : 'past';
};

const CalendarIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="2.5" width="12" height="10.5" />
    <path d="M1 5.5h12" />
    <path d="M4.5 1v3M9.5 1v3" />
  </svg>
);

const renderHeaderCell = (day: string) => <CalendarHeaderCell className={styles.headerCell}>{day}</CalendarHeaderCell>;

// 純粋な可視化（isReadOnly）— 日付選択は持たない。表示月は react-aria が
// 今日を minValue/maxValue の範囲にクランプして決める。
export const ActivityCalendar = ({ marks, minDate, maxDate, label }: Props) => {
  const markMap = useMemo(() => new Map(marks.map((mark) => [mark.date, mark.upcoming])), [marks]);

  // CalendarDate#toString() は 'YYYY-MM-DD' — mark のキーとそのまま突き合わせる。
  const renderCell = useCallback(
    (date: CalendarDate) => <CalendarCell className={styles.cell} date={date} data-mark={resolveMark(markMap.get(date.toString()))} />,
    [markMap],
  );

  return (
    <DialogTrigger>
      <Button className={styles.trigger} aria-label={label}>
        <CalendarIcon />
      </Button>
      <Popover className={styles.popover} placement="bottom end">
        <Dialog className={styles.dialog} aria-label={label}>
          <I18nProvider locale="ja-JP">
            <Calendar isReadOnly minValue={toCalendarDate(minDate)} maxValue={toCalendarDate(maxDate)}>
              <header className={styles.headerRoot}>
                <Button slot="previous" className={styles.navButton} aria-label="前の月">
                  ‹
                </Button>
                <Heading className={styles.heading} />
                <Button slot="next" className={styles.navButton} aria-label="次の月">
                  ›
                </Button>
              </header>
              <CalendarGrid>
                <CalendarGridHeader>{renderHeaderCell}</CalendarGridHeader>
                <CalendarGridBody>{renderCell}</CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </I18nProvider>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};
```

実装メモ:

- `I18nProvider locale="ja-JP"` で曜日ヘッダ・見出し・セルの aria-label を訪問者のブラウザ locale に依存させず日本語に固定する（popover 内は client 描画のみなので hydration mismatch はない）
- `data-mark` は react-aria の filterDOMProps を素通りして cell 要素に付く。もしテストで属性が出ないことが判明したら、`CalendarCell` の `className` を関数にせず、wrapper の `<td>` ではなく render prop で `<span data-mark>` を中に置く形へフォールバックする（その場合もテストは同じアサーションで通る）
- `CalendarGridHeader` / `CalendarGridBody` の children は react-aria の必須 render prop。module-scope の `renderHeaderCell` と `useCallback` 済みの `renderCell` を渡して jsx-no-bind / memoization-in-props を満たす

- [ ] **Step 5: テストを通す**

```bash
pnpm vitest run src/components/activity-calendar/activity-calendar.test.tsx
```

Expected: PASS（4 件）。`data-mark` が出ない場合は Step 4 実装メモのフォールバックへ。

- [ ] **Step 6: lint / typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: エラーなし（strictTokens 由来の警告が出たらトークンに寄せて修正）

- [ ] **Step 7: commit（ユーザー承認後）**

```bash
git add src/components/activity-calendar vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(components): add ActivityCalendar popover calendar"
```

---

### Task 2: collectLogDates 純関数（TDD・node）

**Files:**

- Create: `src/app/(site)/log/_lib/collect-log-dates/index.ts`
- Create: `src/app/(site)/log/_lib/collect-log-dates/collect-log-dates.test.ts`

**Interfaces:**

- Consumes:
  - `ActivityCalendarMark`（Task 1、`@components/activity-calendar` から type import）
  - `WorkRow`（`../../../works/_lib/work-row` — `date?: string` ISO YYYY-MM-DD）
  - `ExternalPost`（`../external-feeds` — `date: string` ISO）
  - `LogManualItem`（`../log-manual-item` — `date: string` ISO YYYY-MM-DD）
- Produces:
  - `export type CollectLogDatesResult = { marks: ActivityCalendarMark[]; minDate?: string; maxDate?: string }`
  - `export const collectLogDates = (works, posts, logs, now) => CollectLogDatesResult`

- [ ] **Step 1: 失敗するテストを書く**

`src/app/(site)/log/_lib/collect-log-dates/collect-log-dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { collectLogDates } from './index';

import type { ExternalPost } from '../external-feeds';
import type { LogManualItem } from '../log-manual-item';
import type { WorkRow } from '../../../works/_lib/work-row';

const NOW = '2026-07-02T12:00:00+09:00';

const makeWork = (over: Partial<WorkRow>): WorkRow => ({
  id: 'w1',
  slug: 'sample-work',
  no: '001',
  title: 'work',
  type: 'web',
  year: 2026,
  ...over,
});

const makePost = (over: Partial<ExternalPost>): ExternalPost => ({
  id: 'p1',
  title: 'post',
  link: 'https://example.com/post',
  date: '2026-01-10T00:00:00+09:00',
  source: 'zenn',
  ...over,
});

const makeLog = (over: Partial<LogManualItem>): LogManualItem => ({
  id: 'l1',
  title: 'gig',
  date: '2026-07-15',
  meta: 'DJ',
  ...over,
});

describe('collectLogDates', () => {
  it('3 ソースを日付昇順の marks に集約する', () => {
    const result = collectLogDates(
      [makeWork({ date: '2026-03-01' })],
      [makePost({ date: '2026-01-10T00:00:00+09:00' })],
      [makeLog({ date: '2026-07-15' })],
      NOW,
    );
    expect(result.marks.map((m) => m.date)).toEqual(['2026-01-10', '2026-03-01', '2026-07-15']);
  });

  it('日付なしの work は除外する', () => {
    const result = collectLogDates([makeWork({ date: undefined })], [], [], NOW);
    expect(result.marks).toEqual([]);
  });

  it('同日の複数エントリは 1 mark に畳み、upcoming を優先する', () => {
    const result = collectLogDates([], [makePost({ date: '2026-07-15T09:00:00+09:00' })], [makeLog({ date: '2026-07-15' })], NOW);
    expect(result.marks).toEqual([{ date: '2026-07-15', upcoming: true }]);
  });

  it('manual log は当日いっぱいまで upcoming（前日は past）', () => {
    const result = collectLogDates(
      [],
      [],
      [makeLog({ id: 'a', date: '2026-07-01' }), makeLog({ id: 'b', date: '2026-07-02' }), makeLog({ id: 'c', date: '2026-07-03' })],
      NOW,
    );
    expect(result.marks).toEqual([
      { date: '2026-07-01', upcoming: false },
      { date: '2026-07-02', upcoming: true },
      { date: '2026-07-03', upcoming: true },
    ]);
  });

  it('post / work は未来日でも upcoming にならない', () => {
    const result = collectLogDates([makeWork({ date: '2026-12-01' })], [makePost({ date: '2026-12-24T00:00:00+09:00' })], [], NOW);
    expect(result.marks.every((m) => !m.upcoming)).toBe(true);
  });

  it('minDate は最古エントリの月初、maxDate は最新エントリの月末', () => {
    const result = collectLogDates([], [makePost({ date: '2026-01-10T00:00:00+09:00' })], [makeLog({ date: '2026-07-15' })], NOW);
    expect(result.minDate).toBe('2026-01-01');
    expect(result.maxDate).toBe('2026-07-31');
  });

  it('空入力なら marks は空で min/max は undefined', () => {
    const result = collectLogDates([], [], [], NOW);
    expect(result.marks).toEqual([]);
    expect(result.minDate).toBeUndefined();
    expect(result.maxDate).toBeUndefined();
  });
});
```

- [ ] **Step 2: 実行して失敗を確認**

```bash
pnpm vitest run "src/app/(site)/log/_lib/collect-log-dates/collect-log-dates.test.ts"
```

Expected: FAIL（`./index` が存在しない）

- [ ] **Step 3: 実装**

`src/app/(site)/log/_lib/collect-log-dates/index.ts`:

```ts
import { dayjs } from '@utils/dayjs';

import type { ActivityCalendarMark } from '@components/activity-calendar';
import type { ExternalPost } from '../external-feeds';
import type { LogManualItem } from '../log-manual-item';
import type { WorkRow } from '../../../works/_lib/work-row';

export type CollectLogDatesResult = {
  marks: ActivityCalendarMark[];
  minDate?: string;
  maxDate?: string;
};

const toDayKey = (iso: string): string => dayjs(iso).tz('Asia/Tokyo').format('YYYY-MM-DD');

// buildLogTimeline の toManualEntry と同じ境界: エントリは自分の日の終わりまで
// upcoming（Asia/Tokyo・day precision）。upcoming になり得るのは manual log のみ。
const isUpcoming = (iso: string, now: string): boolean => {
  const at = dayjs(iso).tz('Asia/Tokyo').startOf('day');
  const today = dayjs(now).tz('Asia/Tokyo').startOf('day');

  return !at.isBefore(today);
};

// タイムラインと同じ 3 ソースから「エントリのある日」を集める。日付なし works は
// 除外。同日複数エントリは 1 mark に畳み、upcoming が 1 つでもあれば upcoming。
// min/max はカレンダーの月送り範囲（最古の月初〜最新の月末）。純関数。
export const collectLogDates = (
  works: readonly WorkRow[],
  posts: readonly ExternalPost[],
  logs: readonly LogManualItem[],
  now: string,
): CollectLogDatesResult => {
  const workMarks = works.flatMap((work) => (work.date === undefined ? [] : [{ date: toDayKey(work.date), upcoming: false }]));
  const postMarks = posts.map((post) => ({ date: toDayKey(post.date), upcoming: false }));
  const logMarks = logs.map((log) => ({ date: toDayKey(log.date), upcoming: isUpcoming(log.date, now) }));

  const merged = [...workMarks, ...postMarks, ...logMarks].reduce<Map<string, boolean>>(
    (acc, mark) => acc.set(mark.date, (acc.get(mark.date) ?? false) || mark.upcoming),
    new Map(),
  );

  const keys = [...merged.keys()].sort();
  const [first] = keys;
  const last = keys.at(-1);

  return {
    marks: keys.map((date) => ({ date, upcoming: merged.get(date) === true })),
    get minDate() {
      if (first === undefined) return undefined;

      return dayjs(first).tz('Asia/Tokyo').startOf('month').format('YYYY-MM-DD');
    },
    get maxDate() {
      if (last === undefined) return undefined;

      return dayjs(last).tz('Asia/Tokyo').endOf('month').format('YYYY-MM-DD');
    },
  };
};
```

- [ ] **Step 4: テストを通す**

```bash
pnpm vitest run "src/app/(site)/log/_lib/collect-log-dates/collect-log-dates.test.ts"
```

Expected: PASS（7 件）

- [ ] **Step 5: lint / typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: エラーなし

- [ ] **Step 6: commit（ユーザー承認後）**

```bash
git add "src/app/(site)/log/_lib/collect-log-dates"
git commit -m "feat(log): add collectLogDates aggregation for activity calendar"
```

---

### Task 3: LogCalendarSection RSC + layout 配線

**Files:**

- Create: `src/app/(site)/log/_components/log-calendar-section/index.tsx`
- Modify: `src/app/(site)/log/layout.tsx`
- Modify: `src/app/(site)/log/styles.css.ts`

**Interfaces:**

- Consumes: `ActivityCalendar`（Task 1）、`collectLogDates`（Task 2）、`findWorksList` / `findLogList`（`@lib/payload/works` / `@lib/payload/logs`）、`fetchExternalPosts`（`../../_lib/fetch-external-posts`）
- Produces: `export const LogCalendarSection: () => Promise<JSX.Element>`（async RSC）

- [ ] **Step 1: LogCalendarSection を実装**

`src/app/(site)/log/_components/log-calendar-section/index.tsx`:

```tsx
import { collectLogDates } from '../../_lib/collect-log-dates';
import { fetchExternalPosts } from '../../_lib/fetch-external-posts';

import { ActivityCalendar } from '@components/activity-calendar';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

// タイムラインと同じ 3 ソース（unstable_cache 済みなので page 側と実体は共有）を
// 集計してカレンダーに渡す。ISR(3600s) にそのまま乗る。
export const LogCalendarSection = async () => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const { marks, minDate, maxDate } = collectLogDates(works, posts, logs, now);

  return <ActivityCalendar marks={marks} minDate={minDate} maxDate={maxDate} label="活動カレンダー" />;
};
```

import 順は既存ファイル（log-timeline-section）の oxlint グルーピングに合わせる。`pnpm lint` が並びを指摘したら従う。

- [ ] **Step 2: log/styles.css.ts に metaRow スタイルを追加**

`src/app/(site)/log/styles.css.ts` の末尾に追加:

```ts
// feed リンクとカレンダートリガーの横並び行。FeedLink は自前の marginTop -4 を
// 持っているので、calendarSlot が同じオフセットを鏡写しにして 1 行に揃える。
export const metaRow = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '3',
});

export const calendarSlot = css({
  display: 'flex',
  alignItems: 'center',
  marginTop: '-4',
});
```

- [ ] **Step 3: layout.tsx を配線（トリガーが左・FeedLink が右）**

`src/app/(site)/log/layout.tsx` 全体を以下に:

```tsx
import { Suspense } from 'react';

import { LogCalendarSection } from './_components/log-calendar-section';
import * as s from './styles.css';

import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'log' }] as const;

const LogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    <PageHeader title="log" breadcrumbs={crumbs} kicker="// 活動年表 — gig · release · work" lead="進捗どうですか？" />
    <div className={s.metaRow}>
      {/* metaRow は右寄せなので fallback=null でも FeedLink は動かない（カレンダーは
          左側に後から現れるだけ）。データエラーは log/error.tsx に委譲。 */}
      <span className={s.calendarSlot}>
        <Suspense fallback={null}>
          <LogCalendarSection />
        </Suspense>
      </span>
      <FeedLink href="/log/rss.xml" label="log の RSS フィード" />
    </div>
    {children}
  </main>
);

export default LogLayout;
```

- [ ] **Step 4: lint / typecheck / 全テスト**

```bash
pnpm lint && pnpm typecheck && pnpm vitest run
```

Expected: すべて PASS

- [ ] **Step 5: commit（ユーザー承認後）**

```bash
git add "src/app/(site)/log"
git commit -m "feat(log): wire activity calendar next to feed link"
```

---

### Task 4: colophon 登録

**Files:**

- Modify: `src/app/(site)/colophon/content.ts`（`components.items` の FeedLink エントリの直後）
- Modify: `src/app/(site)/colophon/_demos/index.tsx`（import + demo エントリ）

**Interfaces:**

- Consumes: `ActivityCalendar` / `ActivityCalendarMark`（Task 1）
- Produces: colophon カタログの `ActivityCalendar` エントリ（content の name と demo キーは型で 1:1 強制される — 片方だけだとコンパイルエラー）

- [ ] **Step 1: content.ts にエントリ追加**

`src/app/(site)/colophon/content.ts` の `{ name: 'FeedLink', ... }` の直後に追加:

```ts
      {
        name: 'ActivityCalendar',
        why: 'log の活動カレンダー。feed リンクの隣に置いて、エントリのある日をドットで打つ。これからの予定だけ accent で灯るのは Timeline と同じ約束。',
      },
```

- [ ] **Step 2: \_demos/index.tsx にデモ追加**

import 群（`@components/` アルファベット順の位置）に追加:

```tsx
import { ActivityCalendar } from '@components/activity-calendar';
```

デモデータ定義部（他のサンプルデータ定数の近く）に追加:

```tsx
// 過去ドットと upcoming ドットが両方見えるサンプル。表示月が固定されるよう
// min/max で 2026-06〜07 に範囲を絞ってある。
const activityCalendarMarks = [
  { date: '2026-06-06', upcoming: false },
  { date: '2026-06-20', upcoming: false },
  { date: '2026-07-11', upcoming: true },
  { date: '2026-07-25', upcoming: true },
];
```

demos オブジェクトの `FeedLink:` エントリの直後に追加（href を持たないので NoAction 不要）:

```tsx
  ActivityCalendar: (
    <ActivityCalendar marks={activityCalendarMarks} minDate="2026-06-01" maxDate="2026-07-31" label="活動カレンダー（サンプル）" />
  ),
```

- [ ] **Step 3: lint / typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: エラーなし（content に name を足して demo を忘れると型エラーになる設計 — 両方入っていることの検証を兼ねる）

- [ ] **Step 4: commit（ユーザー承認後）**

```bash
git add "src/app/(site)/colophon"
git commit -m "docs(colophon): register ActivityCalendar in the catalog"
```

---

### Task 5: 目視確認 + レビュー依頼

**Files:** なし（検証のみ）

- [ ] **Step 1: 全チェック**

```bash
pnpm lint && pnpm typecheck && pnpm vitest run
```

Expected: すべて PASS

- [ ] **Step 2: chrome-devtools で localhost:3000 を目視確認**

dev サーバーは MAIN repo の `next dev`（localhost:3000）が動いている前提（止まっていたら**ユーザーに起動を依頼** — `pnpm dev` の実行は不可。workerd を kill しない）。

確認項目:

1. `http://localhost:3000/log` — feed リンクの**左**にカレンダーアイコンが出る
2. アイコンをクリック → popover が開き、今月（またはクランプされた月）が表示される
3. エントリのある日にドット、upcoming の日に accent ドット（/log のタイムラインと突き合わせる）
4. 月送り ‹ › が動き、最古/最新の月で止まる
5. `http://localhost:3000/colophon` — ActivityCalendar のデモが表示され、開ける
6. キーボード操作（Tab でトリガー → Enter で開く → 矢印キーで日付移動 → Esc で閉じる）

注意: dev サーバーの ISR キャッシュが古い場合、layout.tsx への実変更が反映されないことがある（next-dev-isr-stale 既知事象）。反映されない場合はページを touch ではなく実変更で確認するか、ユーザーに再起動を依頼。

- [ ] **Step 3: difit を起動してレビュー依頼**

```bash
npx difit HEAD main
```

ユーザーにレビューを依頼し、指摘があれば反映する。

---

## Self-Review 結果

- **Spec coverage:** UI（トリガー左配置・popover・ドット2種・月送り範囲）= Task 1/3、collectLogDates = Task 2、LogCalendarSection + metaRow = Task 3、colophon = Task 4、依存追加 = Task 0、完了条件（lint/typecheck/目視/difit）= Task 5。ギャップなし。
- **Placeholder scan:** TBD/TODO なし。全ステップに実コード・実コマンドあり。
- **Type consistency:** `ActivityCalendarMark` は Task 1 で定義し Task 2/4 で type import。`collectLogDates(works, posts, logs, now)` の引数順は Task 2 定義と Task 3 呼び出しで一致。`CollectLogDatesResult` のフィールド名（marks/minDate/maxDate）は ActivityCalendar props と対応。
