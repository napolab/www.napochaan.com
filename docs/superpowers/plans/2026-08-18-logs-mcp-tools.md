# logs collection の MCP ツール 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/log` の年表に載る手動エントリ(`logs` collection)を MCP から追加・編集・公開・削除できるようにする。

**Architecture:** `src/lib/mcp/tools/legal` を雛形に `src/lib/mcp/tools/logs` を新設する。`logs` は richText を持たないため Markdown codec 層は不要で、`LogToolDeps` は `{ payload, user }` のみ。ハンドラは neverthrow の `ResultAsync` チェーンで組み、`.match(ok, toToolError)` で終端する。`meta` の選択肢は依存ゼロの葉モジュール `src/collections/fields/log-meta` を単一の出所とし、collection の `options` も MCP の `z.enum` もそこから導出する。

**Tech Stack:** Payload CMS 3.84.1 / `@modelcontextprotocol/server` 2.0.0 / zod 4 / neverthrow / vitest / `@utils/dayjs`

## Global Constraints

- ツールは 5 つ: `list_logs` / `create_log` / `update_log` / `publish_log` / `delete_log`
- `create_log` は必ず `_status: 'draft'` で作る。公開は `publish_log` のみ
- `delete_log` は **`id` のみ**。title 照合は入れない(本人決定 2026-08-18)
- `meta` の正準値は `src/collections/fields/log-meta` の `LOG_META_OPTIONS` ただ一つ。MCP 側にも collection 側にもリテラルを複製しない(どちらも導出する)
- 日付は `YYYY-MM-DD` 固定。検証は `@utils/dayjs` の strict parse。生の `Date` / `Intl` / `slice` 禁止(`.claude/rules/dayjs-timezone.md`)
- write path は strict。不正入力は**変換せず reject** し、①何が不正か ②有効な選択肢の全列挙 ③問題の値 ④回避手段 を含む回復ヒントを返す(`.claude/rules/mcp-write-strict.md`)
- 関数は arrow function。`let` / IIFE / 非 null assertion `!` / `forEach` / `any` 禁止
- `Boolean()` / `String()` / `Number()` 禁止。`parseInt(x, 10)` / テンプレートリテラル / 明示的な `!==` を使う
- 各タスク完了時に `pnpm lint && pnpm typecheck` を通す。`npx tsc` は使わない
- commit はタスク毎に行う。push と PR はしない

---

## 事前に確認済みの事実(推測ではない)

| 事実                                                                                          | 出典                                 |
| --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `logs` に slug は無い。識別は `id` のみ                                                       | `src/collections/logs.ts`            |
| `meta` の型は `'DJ' \| 'VJ' \| 'DJ/VJ' \| 'Support' \| 'Dev' \| 'Flyer' \| 'Talk' \| 'Video'` | `src/payload-types.ts:367`           |
| `logs` は `versions: { drafts: { autosave: { interval: 375 } } }`                             | `src/collections/logs.ts`            |
| `afterChange` / `afterDelete` が `/` と `/log` を revalidate 済み                             | `src/collections/logs.ts:10`         |
| `publish_post` は **draft-promotion**(全フィールド再送)で実装されている                       | `src/lib/mcp/tools/index.ts:757-781` |
| `PostNotFoundError` は `class X extends Error { override name = 'X' as const }` の形          | `src/lib/mcp/errors/index.ts:15`     |
| `McpToolError` は union。新エラーは union にも足す                                            | `src/lib/mcp/errors/index.ts:95`     |

## File Structure

| ファイル                                           | 責務                                                    | タスク |
| -------------------------------------------------- | ------------------------------------------------------- | ------ |
| `src/collections/fields/log-meta/index.ts`         | **新規**。`LOG_META_OPTIONS` の葉モジュール             | 1      |
| `src/collections/fields/log-meta/log-meta.test.ts` | **新規**。8 個のリテラル値を固定する                    | 1      |
| `src/collections/logs.ts`                          | `options` を `LOG_META_OPTIONS` から導出する            | 1      |
| `src/lib/mcp/errors/index.ts`                      | `LogNotFoundError` を追加し `McpToolError` union に足す | 2      |
| `src/lib/mcp/tools/logs/index.ts`                  | **新規**。`createLogToolHandlers` + `registerLogTools`  | 2,3,4  |
| `src/lib/mcp/tools/logs/logs.test.ts`              | **新規**。ハンドラの成功系と拒否系                      | 2,3,4  |
| `src/app/api/mcp/route.ts`                         | `registerLogTools` を 1 行配線                          | 2      |

---

### Task 1: `meta` の正準値を葉モジュールに切り出す

MCP 側にリテラルを複製せず、単一の出所を作る。

**なぜ collection 本体から export しないか:** `src/collections/logs.ts` は
`./hooks/revalidate` 経由で `next/cache` を先頭 import している。これを MCP ツールと
node 環境の vitest に引き込むと壊れる。`src/collections/fields/slug/` が同じ用途の
既存パターン(コロケートしたテスト付きの葉モジュール)なので、それに倣う。

**同期テストは書かない:** collection の `options` を定数から `.map()` で**導出**すれば、
構造上ドリフトが起こり得ない。`.claude/rules/cross-module-sync-test.md` が求めているのは
本来これで、同期テストは「導出できない場合の次善策」。代わりにリテラル 8 個そのものを
固定するテストを書く — `'DJ/VJ'` を `'DJ / VJ'` に直した瞬間に既存 DB 行とバイト不一致に
なるが、`Log['meta']` も同時に再生成されるため型では守れない。

**Files:**

- Create: `src/collections/fields/log-meta/index.ts`
- Create: `src/collections/fields/log-meta/log-meta.test.ts`
- Modify: `src/collections/logs.ts`

**Interfaces:**

- Consumes: なし(最初のタスク)
- Produces: `src/collections/fields/log-meta` から
  `export const LOG_META_OPTIONS: readonly ['DJ','VJ','DJ/VJ','Support','Dev','Flyer','Talk','Video']`。
  Task 3 の `z.enum(LOG_META_OPTIONS)` がこれを使う

- [ ] **Step 1: 失敗するテストを書く**

Create `src/collections/fields/log-meta/log-meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { LOG_META_OPTIONS } from '.';

// この 8 個の値は年表の表示ラベルそのものであり、既存の DB 行とバイト一致していないと
// 壊れる。型(`Log['meta']`)は payload-types.ts の再生成で一緒に変わってしまうため、
// 「うっかり表記を変えた」を型では検出できない。ここで値そのものに釘を刺す。
describe('LOG_META_OPTIONS', () => {
  it('既存の DB 行と一致する 8 個の値を保つ', () => {
    expect([...LOG_META_OPTIONS]).toEqual(['DJ', 'VJ', 'DJ/VJ', 'Support', 'Dev', 'Flyer', 'Talk', 'Video']);
  });

  it('重複を含まない', () => {
    expect(new Set(LOG_META_OPTIONS).size).toBe(LOG_META_OPTIONS.length);
  });
});
```

- [ ] **Step 2: 走らせて失敗を確認**

Run: `pnpm exec vitest run src/collections/fields/log-meta/log-meta.test.ts`
Expected: FAIL — モジュールが解決できない

- [ ] **Step 3: 葉モジュールを作る**

Create `src/collections/fields/log-meta/index.ts`:

```ts
import type { Log } from '@payload-types';

// 年表に表示する種別ラベルの正準値。値がそのまま画面に出るため、既存行
// (DJ / VJ / DJ/VJ)とバイト一致していなければならない。
//
// collection 本体(src/collections/logs.ts)ではなくここに置くのは、logs.ts が
// ./hooks/revalidate 経由で next/cache を引いており、MCP ツール(src/lib/mcp/tools/logs)や
// node 環境の vitest から import できないため。ここは依存ゼロの葉に保つこと。
//
// `satisfies readonly Log['meta'][]` により、payload-types.ts の再生成で union が
// 変わった瞬間にコンパイルエラーになる。
export const LOG_META_OPTIONS = ['DJ', 'VJ', 'DJ/VJ', 'Support', 'Dev', 'Flyer', 'Talk', 'Video'] as const satisfies readonly Log['meta'][];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm exec vitest run src/collections/fields/log-meta/log-meta.test.ts`
Expected: PASS(2 件)

- [ ] **Step 5: collection の options を導出に差し替える**

`src/collections/logs.ts` の import に足す(`./hooks/revalidate` の import の**前**):

```ts
import { LOG_META_OPTIONS } from './fields/log-meta';
```

`meta` フィールドの `options`(既存の 8 行のリテラル配列)を導出に差し替える:

```ts
      options: LOG_META_OPTIONS.map((value) => ({ label: value, value })),
```

既存の `// Stored verbatim and rendered as ...` コメントは**消さずに残す**。その下に 1 行足す:

```ts
      // 正準値は ./fields/log-meta。MCP の create_log / update_log も同じ配列から
      // z.enum を組む。ここで導出しているのでリテラルの二重管理は発生しない。
```

- [ ] **Step 6: lint / typecheck / commit**

Run:

```bash
pnpm exec vitest run src/collections/fields/log-meta/log-meta.test.ts
pnpm lint && pnpm typecheck
git add src/collections/fields/log-meta src/collections/logs.ts
```

commit message:

```
refactor(logs): extract LOG_META_OPTIONS as a dependency-free leaf module

meta の値は年表の表示ラベルそのもので既存行とバイト一致が要る。MCP ツールが同じ
選択肢を必要とするため単一の出所を作る。collection 本体は next/cache を引いていて
MCP 側から import できないので、fields/slug と同じ葉モジュールの形にした。

collection の options はこの配列から導出するため二重管理は発生しない。
satisfies readonly Log['meta'][] で payload-types との drift をコンパイル時に検出し、
リテラル 8 個そのものはテストで固定する(型では表記変更を検出できないため)。
```

---

### Task 2: ツールの骨格と `list_logs`

`LogToolDeps` / `registerLogTools` / `list_logs` を作り、`route.ts` まで配線して MCP に露出させる。

**Files:**

- Modify: `src/lib/mcp/errors/index.ts`
- Create: `src/lib/mcp/tools/logs/index.ts`
- Create: `src/lib/mcp/tools/logs/logs.test.ts`
- Modify: `src/app/api/mcp/route.ts`

**Interfaces:**

- Consumes: Task 1 の `LOG_META_OPTIONS`(このタスクではまだ使わない)
- Produces:
  - `export type LogToolDeps = { payload: Payload; user: User }`
  - `export const createLogToolHandlers = (deps: LogToolDeps) => ({ listLogs, ... })`
  - `export const registerLogTools = (server: McpServer, deps: LogToolDeps): void`
  - `listLogs: (input: { status?: 'draft' | 'published' | 'all'; limit?: number }) => Promise<ToolResult>`
  - `toSummary(doc: Log)` が返す形: `{ id, title, date, meta, url, status }`。`date` は JST 暦日の `YYYY-MM-DD`
  - `export class LogNotFoundError extends Error`(`src/lib/mcp/errors`)

- [ ] **Step 1: 失敗するテストを書く**

Create `src/lib/mcp/tools/logs/logs.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { createLogToolHandlers } from '.';

import type { LogToolDeps } from '.';
import type { User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const deps = { payload, user } as unknown as LogToolDeps;

  return { payload, deps };
};

describe('listLogs', () => {
  it('published だけを引く where を組む', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.listLogs({ status: 'published' });

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        draft: true,
        where: { _status: { equals: 'published' } },
        sort: '-date',
        overrideAccess: false,
        user,
      }),
    );
  });

  it('status 未指定なら all 扱いで where を付けない', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLogToolHandlers(deps);
    await handlers.listLogs({});

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it('date を JST 暦日の YYYY-MM-DD に正規化して返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({
      docs: [{ id: 7, title: 'TBA at Real に VJ 出演', date: '2026-10-24T00:00:00.000Z', meta: 'VJ', url: null, _status: 'published' }],
    });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.listLogs({});
    const [{ text }] = result.content;

    expect(JSON.parse(text)).toEqual([{ id: 7, title: 'TBA at Real に VJ 出演', date: '2026-10-24', meta: 'VJ', url: null, status: 'published' }]);
  });
});
```

- [ ] **Step 2: 走らせて失敗を確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: FAIL — `src/lib/mcp/tools/logs` が解決できない

- [ ] **Step 3: エラー型を追加する**

`src/lib/mcp/errors/index.ts` の `PostNotFoundError` の**直後**に足す:

```ts
// 指定 id の log(年表の手動エントリ)が見つからない。
export class LogNotFoundError extends Error {
  override name = 'LogNotFoundError' as const;
}
```

`McpToolError` union に `LogNotFoundError` を足す(`PostNotFoundError` の次の行):

```ts
  | LogNotFoundError
```

- [ ] **Step 4: 骨格と `list_logs` を実装する**

Create `src/lib/mcp/tools/logs/index.ts`:

```ts
import { fromPromise } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';

import { PayloadOperationError } from '../../errors';
import { ok, toToolError } from '../shared/tool-result';

import type { ToolResult } from '../shared/tool-result';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Log, User } from '@payload-types';
import type { Payload } from 'payload';
import type { Where } from 'payload';

// logs は richText を持たないフラットな collection なので、blog/legal が必要とする
// MarkdownCodec は渡さない。deps は payload と user だけ。
export type LogToolDeps = {
  payload: Payload;
  user: User;
};

type LogStatus = 'draft' | 'published' | 'all';

// Payload の date フィールドは ISO タイムスタンプで返る。read は write が受け付ける
// 正準形(YYYY-MM-DD)に正規化する — でないと list → update の往復で date を素直に
// 渡し戻したときに弾かれる(read-normalize / write-strict)。
// dayOnly の値は UTC インスタントなので、JST 暦日で切らないと 1 日ズレる
// (.claude/rules/dayjs-timezone.md)。
const toSummary = (doc: Log) => ({
  id: doc.id,
  title: doc.title,
  date: dayjs(doc.date).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  meta: doc.meta,
  url: doc.url ?? null,
  status: doc._status ?? 'draft',
});

const resolveStatusWhere = (status: LogStatus): Where | undefined => {
  switch (status) {
    case 'all':
      return undefined;
    case 'draft':
      return { _status: { equals: 'draft' } };
    case 'published':
      return { _status: { equals: 'published' } };
    default: {
      const _exhaustive: never = status;
      throw new Error(`unhandled log status: ${`${_exhaustive}`}`);
    }
  }
};

export const createLogToolHandlers = (deps: LogToolDeps) => {
  const { payload, user } = deps;

  return {
    listLogs: (input: { status?: LogStatus; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'logs',
          draft: true,
          where: resolveStatusWhere(input.status ?? 'all'),
          limit: input.limit ?? 0,
          sort: '-date',
          overrideAccess: false,
          user,
          depth: 0,
        }),
        (cause) => new PayloadOperationError('log 一覧の取得に失敗しました', { cause }),
      )
        .map(({ docs }) => docs.map(toSummary))
        .match(ok, toToolError),
  };
};

export const registerLogTools = (server: McpServer, deps: LogToolDeps): void => {
  const handlers = createLogToolHandlers(deps);

  server.registerTool(
    'list_logs',
    {
      title: 'log 一覧',
      description: '/log の年表に載る手動エントリを一覧する。id / title / date / meta / url / 公開状態を返す。update_log・publish_log・delete_log に渡す id はここで確認する。',
      inputSchema: {
        status: z.enum(['draft', 'published', 'all']).optional().describe('既定は all'),
        limit: z.number().int().positive().optional().describe('既定は無制限'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listLogs,
  );
};
```

- [ ] **Step 5: テストが通ることを確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: PASS(3 件)

- [ ] **Step 6: route.ts に配線する**

`src/app/api/mcp/route.ts` の import に足す(`registerLegalTools` の import の次の行):

```ts
import { registerLogTools } from '@lib/mcp/tools/logs';
```

`registerLegalTools(...)` の呼び出しの**直後**に足す:

```ts
  // logs は richText を持たないので codec は渡さない。
  registerLogTools(server, { payload, user });
```

- [ ] **Step 7: 全テスト + lint + typecheck + commit**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
git add src/lib/mcp/errors/index.ts src/lib/mcp/tools/logs src/app/api/mcp/route.ts
```

commit message:

```
feat(mcp): add list_logs and wire the logs tool module

logs は richText を持たないため MarkdownCodec を渡さず、deps は payload/user のみ。
date は Payload が ISO で返すので、write が受け付ける YYYY-MM-DD に JST 暦日で
正規化して返す(read-normalize / write-strict)。
```

---

### Task 3: `create_log` と `update_log`

write path。`meta` は Task 1 の正準値から `z.enum` を組み、`date` は strict parse で検証する。

**Files:**

- Modify: `src/lib/mcp/tools/logs/index.ts`
- Modify: `src/lib/mcp/tools/logs/logs.test.ts`

**Interfaces:**

- Consumes: Task 1 の `LOG_META_OPTIONS`、Task 2 の `createLogToolHandlers` / `toSummary` / `LogNotFoundError`
- Produces:
  - `createLog: (input: { title: string; date: string; meta: Log['meta']; url?: string }) => Promise<ToolResult>`
  - `updateLog: (input: { id: number; title?: string; date?: string; meta?: Log['meta']; url?: string }) => Promise<ToolResult>`
  - `findLog(id: number): ResultAsync<Log | null, McpToolError>` と `requireLog(doc: Log | null): ResultAsync<Log, McpToolError>` を module 内に用意する。Task 4 の `publish_log` / `delete_log` が再利用する

- [ ] **Step 1: 失敗するテストを追記する**

`src/lib/mcp/tools/logs/logs.test.ts` の末尾に足す:

```ts
describe('createLog', () => {
  it('draft として作成する', async () => {
    const { payload, deps } = createDeps();
    payload.create.mockResolvedValue({ id: 9, title: 'Booth2Booth vol.04', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'Booth2Booth vol.04', date: '2026-11-01', meta: 'DJ/VJ' });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ title: 'Booth2Booth vol.04', date: '2026-11-01', meta: 'DJ/VJ', _status: 'draft' }),
      }),
    );
  });

  it('date の形式が違えば回復ヒント付きで reject し、create しない', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'x', date: '2026/11/01', meta: 'DJ' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('YYYY-MM-DD');
    expect(result.content[0].text).toContain('2026/11/01');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('存在しない日付は reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'x', date: '2026-02-30', meta: 'DJ' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('updateLog', () => {
  it('指定したフィールドだけを渡す', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '旧', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });
    payload.update.mockResolvedValue({ id: 9, title: '新', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 9, title: '新' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'logs', id: 9, data: { title: '新' } }));
  });

  it('存在しない id は回復ヒント付きで reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 999, title: '新' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('list_logs');
    expect(payload.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 走らせて失敗を確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: FAIL — `handlers.createLog is not a function`

- [ ] **Step 3: date validator と findLog/requireLog を足す**

`src/lib/mcp/tools/logs/index.ts` の import を差し替える:

```ts
import { err as errResult, errAsync, fromPromise, ok as okResult, okAsync } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { createValidator } from '@utils/run-validators';

// collection 本体(src/collections/logs.ts)は next/cache を引くのでここからは import
// できない。正準値は依存ゼロの葉モジュールに置いてある(Task 1)。
// src/collections に path alias は無く、tsconfig の paths 変更は禁止(CLAUDE.md)なので相対。
import { LOG_META_OPTIONS } from '../../../../collections/fields/log-meta';
import { InvalidInputError, LogNotFoundError, PayloadOperationError } from '../../errors';
import { ok, toToolError } from '../shared/tool-result';

import type { McpToolError } from '../../errors';
import type { ToolResult } from '../shared/tool-result';
import type { Validator } from '@utils/run-validators';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Log, User } from '@payload-types';
import type { ResultAsync } from 'neverthrow';
import type { Payload, Where } from 'payload';
```

`toSummary` の**上**に日付検証を置く(legal の `parseEffectiveAt` と同じ構成):

```ts
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 1. 形式 — YYYY-MM-DD かどうか。
const requireDayFormat: Validator<string, McpToolError> = {
  run: (value) => (DAY_PATTERN.test(value) ? okResult(value) : errResult(new InvalidInputError(`date は YYYY-MM-DD 形式で指定してください。受け取った値: "${value}"`))),
};

// 2. 実在 — 2026-02-30 のような「形式は合うが存在しない日付」を弾く。dayjs の strict parse
//    (customParseFormat)はロールオーバーせず invalid として検出する。
const requireRealDay: Validator<string, McpToolError> = {
  run: (value) => (dayjs(value, 'YYYY-MM-DD', true).isValid() ? okResult(value) : errResult(new InvalidInputError(`date が存在しない日付です。受け取った値: "${value}"`))),
};

const validateDate = createValidator([requireDayFormat, requireRealDay]);

const parseDate = (value: string): ResultAsync<string, McpToolError> => validateDate(value).asyncAndThen((valid) => okAsync(valid));
```

`createLogToolHandlers` の中、`return {` の**前**に共有ヘルパを置く:

```ts
  const findLog = (id: number): ResultAsync<Log | null, McpToolError> =>
    fromPromise(
      payload.findByID({ collection: 'logs', id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
      (cause) => new PayloadOperationError('log の取得に失敗しました', { cause }),
    );

  const requireLog = (doc: Log | null): ResultAsync<Log, McpToolError> =>
    doc === null ? errAsync(new LogNotFoundError('log が見つかりません。list_logs で id を確認してください。')) : okAsync(doc);
```

- [ ] **Step 4: `createLog` と `updateLog` を実装する**

`listLogs` の**次**にハンドラを足す:

```ts
    createLog: (input: { title: string; date: string; meta: Log['meta']; url?: string }): Promise<ToolResult> =>
      parseDate(input.date)
        .andThen(() =>
          fromPromise(
            payload.create({
              collection: 'logs',
              draft: true,
              data: { title: input.title, date: input.date, meta: input.meta, url: input.url },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('log の作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({ ...toSummary(created), note: 'draft として作成した。年表に載せるには publish_log を呼ぶこと。' }))
        .match(ok, toToolError),

    updateLog: (input: { id: number; title?: string; date?: string; meta?: Log['meta']; url?: string }): Promise<ToolResult> =>
      // date が来ていれば先に検証する。未指定なら検証をスキップして素通しする。
      (input.date === undefined ? okAsync<string | undefined, McpToolError>(undefined) : parseDate(input.date))
        .andThen(() => findLog(input.id))
        .andThen(requireLog)
        .andThen(() =>
          fromPromise(
            payload.update({
              collection: 'logs',
              id: input.id,
              draft: true,
              // 指定されたフィールドだけを送る。undefined を混ぜると Payload 側で
              // 既存値を上書きしうるため、キー自体を落とす。
              data: {
                ...(input.title === undefined ? {} : { title: input.title }),
                ...(input.date === undefined ? {} : { date: input.date }),
                ...(input.meta === undefined ? {} : { meta: input.meta }),
                ...(input.url === undefined ? {} : { url: input.url }),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('log の更新に失敗しました', { cause }),
          ),
        )
        .map((updated) => ({ ...toSummary(updated), note: 'draft を更新した。年表への反映は publish_log を呼ぶこと。' }))
        .match(ok, toToolError),
```

- [ ] **Step 5: ツール登録を足す**

`registerLogTools` の中、`list_logs` の登録の**次**に足す:

```ts
  server.registerTool(
    'create_log',
    {
      title: 'log 作成(draft)',
      description: '年表の手動エントリを draft として作成する。年表に載せるには publish_log を続けて呼ぶこと。',
      inputSchema: {
        title: z.string().min(1).describe('年表に出るテキスト。例: "Booth2Booth vol.03 at VRChat 開催"'),
        date: z.string().describe('YYYY-MM-DD'),
        meta: z.enum(LOG_META_OPTIONS).describe('年表に出る種別ラベル。この値がそのまま画面に表示される'),
        url: z.string().url().optional().describe('設定するとタイトルがこの URL へのリンクになる'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createLog,
  );

  server.registerTool(
    'update_log',
    {
      title: 'log 更新(draft)',
      description: 'log を更新する。指定したフィールドだけが変わる。年表への反映は publish_log を呼ぶこと。',
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        date: z.string().optional().describe('YYYY-MM-DD'),
        meta: z.enum(LOG_META_OPTIONS).optional(),
        url: z.string().url().optional(),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updateLog,
  );
```

- [ ] **Step 6: テストが通ることを確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: PASS(8 件)

- [ ] **Step 7: 全テスト + lint + typecheck + commit**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
git add src/lib/mcp/tools/logs
```

commit message:

```
feat(mcp): add create_log and update_log

meta は collection の LOG_META_OPTIONS から z.enum を組み、リテラルを複製しない。
date は形式と実在の 2 段で strict 検証する(2026-02-30 のような存在しない日付を
dayjs の strict parse で弾く)。update は指定されたキーだけを送る。
```

---

### Task 4: `publish_log` と `delete_log`

**Files:**

- Modify: `src/lib/mcp/tools/logs/index.ts`
- Modify: `src/lib/mcp/tools/logs/logs.test.ts`

**Interfaces:**

- Consumes: Task 3 の `findLog` / `requireLog` / `toSummary`
- Produces:
  - `publishLog: (input: { id: number }) => Promise<ToolResult>`
  - `deleteLog: (input: { id: number }) => Promise<ToolResult>`

- [ ] **Step 1: 失敗するテストを追記する**

`src/lib/mcp/tools/logs/logs.test.ts` の末尾に足す:

```ts
describe('publishLog', () => {
  // draft-promotion: versions.drafts が有効なため update_log の変更は versions テーブルに
  // 積まれる。bare `_status` だけを update すると published 済みの main テーブル行の上に
  // 浅くマージされ、未公開の draft 編集が黙って失われる(blog の publishPost と同じ罠)。
  it('最新 draft の全フィールドを published で再送する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'draft' });
    payload.update.mockResolvedValue({ id: 9, title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'published' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.publishLog({ id: 9 });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        id: 9,
        data: { title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'published' },
      }),
    );
  });

  it('存在しない id は reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.publishLog({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('list_logs');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('deleteLog', () => {
  it('存在する id を削除する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '消す対象', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });
    payload.delete.mockResolvedValue({ id: 9 });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.deleteLog({ id: 9 });

    expect(result.isError).toBeUndefined();
    expect(payload.delete).toHaveBeenCalledWith(expect.objectContaining({ collection: 'logs', id: 9, overrideAccess: false, user }));
    expect(JSON.parse(result.content[0].text)).toEqual(expect.objectContaining({ id: 9, title: '消す対象' }));
  });

  it('存在しない id は回復ヒント付きで reject し、delete しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.deleteLog({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('list_logs');
    expect(payload.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 走らせて失敗を確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: FAIL — `handlers.publishLog is not a function`

- [ ] **Step 3: ハンドラを実装する**

`updateLog` の**次**に足す:

```ts
    publishLog: (input: { id: number }): Promise<ToolResult> =>
      findLog(input.id)
        .andThen(requireLog)
        // draft-promotion: versions.drafts が有効なため update_log の変更は versions
        // テーブルに積まれる。ここで bare `_status` だけを update すると published 済みの
        // main テーブル行の上に浅くマージされ、未公開の draft 編集が黙って失われる。
        // 最新 draft を読み直し、全フィールドを published 付きで再送する
        // (blog の publishPost と同じ形、src/lib/mcp/tools/index.ts)。
        .andThen((current) =>
          fromPromise(
            payload.update({
              collection: 'logs',
              id: input.id,
              data: {
                title: current.title,
                date: current.date,
                meta: current.meta,
                url: current.url,
                _status: 'published',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('log の公開に失敗しました', { cause }),
          ),
        )
        .map((published) => ({ ...toSummary(published), note: '公開した。/log の年表に反映される。' }))
        .match(ok, toToolError),

    deleteLog: (input: { id: number }): Promise<ToolResult> =>
      // 削除前に実物を引くのは ①存在しない id を回復ヒントで弾く ②何を消したかを
      // 応答に含める、の 2 つのため。Payload の delete はバージョンごと消すハード削除で
      // 復元手段がない。
      findLog(input.id)
        .andThen(requireLog)
        .andThen((doc) =>
          fromPromise(
            payload.delete({ collection: 'logs', id: input.id, overrideAccess: false, user }),
            (cause) => new PayloadOperationError('log の削除に失敗しました', { cause }),
          ).map(() => doc),
        )
        .map((deleted) => ({ ...toSummary(deleted), note: '削除した。復元はできない。' }))
        .match(ok, toToolError),
```

- [ ] **Step 4: ツール登録を足す**

`registerLogTools` の中、`update_log` の登録の**次**に足す:

```ts
  server.registerTool(
    'publish_log',
    {
      title: 'log 公開',
      description: 'log を公開して /log の年表に載せる。最新 draft の内容がそのまま公開される。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: false },
    },
    handlers.publishLog,
  );

  server.registerTool(
    'delete_log',
    {
      title: 'log 削除',
      description: 'log を削除する。復元はできない。削除前に list_logs で対象の id を必ず確認すること。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: true },
    },
    handlers.deleteLog,
  );
```

- [ ] **Step 5: テストが通ることを確認**

Run: `pnpm exec vitest run src/lib/mcp/tools/logs/logs.test.ts`
Expected: PASS(12 件)

- [ ] **Step 6: 全テスト + lint + typecheck + commit**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
git add src/lib/mcp/tools/logs
```

commit message:

```
feat(mcp): add publish_log and delete_log

publish_log は blog の publishPost と同じ draft-promotion。bare _status 更新だと
published 行に浅くマージされて未公開の draft 編集が消えるため、最新 draft を
読み直して全フィールドを再送する。

delete_log は id のみで照合ガードは持たない(設計判断、spec に記録)。
ハード削除で復元手段がないため destructiveHint: true を付ける。
```

---

### Task 5: 全体検証とレビュー依頼

**Files:**

- Modify: なし(想定)

**Interfaces:**

- Consumes: Task 1-4 の全変更
- Produces: レビュー可能な差分

- [ ] **Step 1: ツールが 5 つ登録されていることを確認**

Run:

```bash
grep -c "server.registerTool(" src/lib/mcp/tools/logs/index.ts
```

Expected: `5`

- [ ] **Step 2: meta のリテラルが複製されていないことを確認**

Run:

```bash
grep -rn "DJ/VJ" src/lib src/app src/collections
```

Expected: `src/collections/fields/log-meta/index.ts` と同ディレクトリの
`log-meta.test.ts` の 2 ファイルのみ。`src/lib` / `src/app` / `src/collections/logs.ts` に
出たら複製が残っている

- [ ] **Step 3: 全体検証**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: すべて PASS

- [ ] **Step 4: 本番相当ビルド**

Run:

```bash
pnpm build
```

Expected: 成功

- [ ] **Step 5: difit でレビュー依頼**

Run:

```bash
nohup difit HEAD origin/main --merge-base --no-open --keep-alive --port 4982 > /dev/null 2>&1 &
```

差分を提示してレビューを依頼する。push と PR は承認後に行う。

---

## 本計画の範囲外

- **staging E2E**: 実装完了後に別途判断する。手順は memory の `staging-mcp-e2e-via-cloudflared`。
- **`unpublish_log`**: 「年表から下ろす」操作は入れない(YAGNI)。必要になったら追加する。
- **年表の派生エントリ**(news / works / 外部投稿から導出される項目)は `logs` collection の管轄外。
