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

// logs は richText を持たないフラットな collection なので、blog/legal が必要とする
// MarkdownCodec は渡さない。deps は payload と user だけ。
export type LogToolDeps = {
  payload: Payload;
  user: User;
};

type LogStatus = 'draft' | 'published' | 'all';

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

  const findLog = (id: number): ResultAsync<Log | null, McpToolError> =>
    fromPromise(
      payload.findByID({ collection: 'logs', id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
      (cause) => new PayloadOperationError('log の取得に失敗しました', { cause }),
    );

  const requireLog = (doc: Log | null): ResultAsync<Log, McpToolError> => (doc === null ? errAsync(new LogNotFoundError('log が見つかりません。list_logs で id を確認してください。')) : okAsync(doc));

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

    createLog: (input: { title: string; date: string; meta: Log['meta']; url?: string }): Promise<ToolResult> =>
      parseDate(input.date)
        .andThen(() =>
          fromPromise(
            payload.create({
              collection: 'logs',
              draft: true,
              data: { title: input.title, date: input.date, meta: input.meta, url: input.url, _status: 'draft' },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('log の作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({ ...toSummary(created), note: 'draft として作成した。年表に載せるには publish_log を呼ぶこと。' }))
        .match(ok, toToolError),

    updateLog: (input: { id: number; title?: string; date?: string; meta?: Log['meta']; url?: string | null }): Promise<ToolResult> =>
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
              // 既存値を上書きしうるため、キー自体を落とす。url は null を明示的な
              // 「リンクを外す」として forward する(undefined = 変更なし、null = クリア)。
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
        // toSummary はバージョンの _status をそのまま返すため、公開済みの log を
        // 更新した直後でも 'draft' に見えてしまう(実際に /log に出ている published
        // 版はまだ古いまま)。blog の updatePost(src/lib/mcp/tools/index.ts)と同じ形で
        // status を説明的な文言に上書きし、note も「未公開」と断定しないようにする。
        .map((updated) => ({ ...toSummary(updated), status: 'draft version saved', note: '変更は draft version として保存済み。公開への反映には publish_log が必要。' }))
        .match(ok, toToolError),

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
          fromPromise(payload.delete({ collection: 'logs', id: input.id, overrideAccess: false, user }), (cause) => new PayloadOperationError('log の削除に失敗しました', { cause })).map(() => doc),
        )
        .map((deleted) => ({ ...toSummary(deleted), note: '削除した。復元はできない。' }))
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
        url: z.string().url().nullable().optional().describe('省略すると変更なし。null を渡すとリンクを外す(url なしの状態にする)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updateLog,
  );

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
};
