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
