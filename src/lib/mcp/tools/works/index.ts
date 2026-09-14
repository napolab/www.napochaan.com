import { err as errResult, errAsync, fromPromise, ok as okResult, okAsync } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { createValidator } from '@utils/run-validators';
import { absoluteUrl } from '@utils/site-url';

// collection 本体(src/collections/works.ts)は revalidate hooks 経由で next/cache を引くので
// ここからは import しない。種別の正準値は依存ゼロの葉モジュールに置いてある(logs の
// LOG_META_OPTIONS と同型)。src/collections に path alias は無く、tsconfig の paths 変更は
// 禁止(CLAUDE.md)なので相対。
import { WORK_TYPE_LABELS, WORK_TYPE_OPTIONS } from '../../../../collections/fields/work-type';
import { InvalidInputError, PayloadOperationError, WorkNotFoundError } from '../../errors';
import { BODY_MARKDOWN_HELP, buildBodyPatch, createBodyPipeline, verifyThumbnailIfProvided } from '../shared/body-pipeline';
import { requireSlugAvailable } from '../shared/require-slug-available';
import { ok, toToolError } from '../shared/tool-result';

import type { McpToolError } from '../../errors';
import type { MarkdownCodec } from '../../markdown';
import type { ToolResult } from '../shared/tool-result';
import type { Validator } from '@utils/run-validators';
import type { McpServer } from '@modelcontextprotocol/server';
import type { User, Work } from '@payload-types';
import type { ResultAsync } from 'neverthrow';
import type { Payload, Where } from 'payload';

// works の body は任意(Payload 型では `| null | undefined`)。pipeline には non-null な
// 本文型だけを渡し、null は呼び出し側で `?? undefined` に揃える(function-arg-types.md)。
export type WorkBody = NonNullable<Work['body']>;

export type WorkToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<WorkBody>;
  siteBaseUrl: string;
};

type WorkStatus = 'draft' | 'published' | 'all';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// resolveNextBody の拒否文言(blog の「この記事」「title/excerpt 等」に対応する works 版)。
const WORK_UNEDITABLE_WORDING = { subject: 'この制作物', otherFields: 'title/description 等' };

const TYPE_HELP = `種別。${WORK_TYPE_OPTIONS.map((value) => `${value} = ${WORK_TYPE_LABELS[value]}`).join(' / ')}`;
const URL_HELP = '外部リンク。設定すると /works 一覧や年表のリンク先がサイト内の詳細ページではなくこの URL になる';

// write path は strict。変換せず reject し、LLM が 1 回のリトライで自己修正できるヒントを返す
// (.claude/rules/mcp-write-strict.md)。logs / legal と同じ validator 合成。

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

// update 系: date が来ていれば先に検証する。未指定なら検証をスキップして素通しする。
const parseDateIfProvided = (value: string | undefined): ResultAsync<string | undefined, McpToolError> => (value === undefined ? okAsync(undefined) : parseDate(value));

// thumbnail は depth: 0 で読めば media id(number)だが、Payload 型上は populate 済みの
// Media オブジェクトも取りうるので両方から id を取り出す(blog の publishPost と同じ)。
// 未設定(null / undefined)は null で返す(応答の wire 形は null)。
const resolveThumbnailID = (thumbnail: Work['thumbnail']): number | null => {
  if (thumbnail === null || thumbnail === undefined) return null;
  if (typeof thumbnail === 'number') return thumbnail;
  return thumbnail.id;
};

// Payload の date フィールドは ISO タイムスタンプで返る。read は write が受け付ける
// 正準形(YYYY-MM-DD)に正規化する — でないと list → update の往復で date を素直に
// 渡し戻したときに弾かれる(read-normalize / write-strict)。
// dayOnly の値は UTC インスタントなので、JST 暦日で切らないと 1 日ズレる
// (.claude/rules/dayjs-timezone.md)。
const toSummary = (doc: Work) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  type: doc.type,
  date: dayjs(doc.date).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  url: doc.url ?? null,
  description: doc.description ?? null,
  thumbnailMediaID: resolveThumbnailID(doc.thumbnail),
  status: doc._status ?? 'draft',
});

const adminURLOf = (id: number): string => absoluteUrl(`/admin/collections/works/${id}`);

const resolveStatusWhere = (status: WorkStatus): Where | undefined => {
  switch (status) {
    case 'all':
      return undefined;
    case 'draft':
      return { _status: { equals: 'draft' } };
    case 'published':
      return { _status: { equals: 'published' } };
    default: {
      const _exhaustive: never = status;
      throw new Error(`unhandled work status: ${`${_exhaustive}`}`);
    }
  }
};

type WorkQuery = { kind: 'id'; id: number } | { kind: 'slug'; slug: string };

const parseWorkQuery = (input: { id?: number; slug?: string }): ResultAsync<WorkQuery, McpToolError> => {
  if (input.id !== undefined) return okAsync({ kind: 'id', id: input.id });
  if (input.slug !== undefined) return okAsync({ kind: 'slug', slug: input.slug });

  return errAsync(new InvalidInputError('id か slug のどちらかを指定してください。'));
};

export const createWorkToolHandlers = (deps: WorkToolDeps) => {
  const { payload, user, codec, siteBaseUrl } = deps;

  // 本文パイプライン(検証 / alt 同期 / Lexical 往復 / newTab)は blog と共用の shared モジュール。
  // works は body 任意なので、Payload の null は `?? undefined` で境界を揃えてから渡す。
  const { prepareBody, resolveNextBody, buildBodyPayload, verifyMediaExists } = createBodyPipeline<WorkBody>({ payload, user, codec, siteBaseUrl, wording: WORK_UNEDITABLE_WORDING });

  // create 系: bodyMarkdown 省略なら本文なし(codec を呼ばない)、指定されていれば prepareBody。
  const prepareBodyIfProvided = (bodyMarkdown: string | undefined): ResultAsync<WorkBody | undefined, McpToolError> => (bodyMarkdown === undefined ? okAsync(undefined) : prepareBody(bodyMarkdown));

  // depth: 0 で読む — 既定 depth だと body 内の upload node が media doc に populate
  // され、convertLexicalToMarkdown が生 URL として書き出してしまう(blog の findPost と同じ)。
  const findWork = (query: WorkQuery): ResultAsync<Work | null, McpToolError> => {
    switch (query.kind) {
      case 'id':
        return fromPromise(
          payload.findByID({ collection: 'works', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('制作物の取得に失敗しました', { cause }),
        );
      case 'slug':
        return fromPromise(
          payload.find({ collection: 'works', draft: true, where: { slug: { equals: query.slug } }, limit: 1, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('制作物の取得に失敗しました', { cause }),
        ).map(({ docs }) => docs[0] ?? null);
      default: {
        const _exhaustive: never = query;
        throw new Error(`unhandled work query: ${JSON.stringify(_exhaustive)}`);
      }
    }
  };

  const requireWork = (doc: Work | null): ResultAsync<Work, McpToolError> =>
    doc === null ? errAsync(new WorkNotFoundError('制作物が見つかりません。list_works で id / slug を確認してください。')) : okAsync(doc);

  const buildGetWorkPayload = (doc: Work) => buildBodyPayload(doc.body ?? undefined).map((bodyPayload) => ({ ...toSummary(doc), adminURL: adminURLOf(doc.id), ...bodyPayload }));

  return {
    listWorks: (input: { status?: WorkStatus; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'works',
          draft: true,
          where: resolveStatusWhere(input.status ?? 'all'),
          limit: input.limit ?? 0,
          sort: '-date',
          overrideAccess: false,
          user,
          depth: 0,
        }),
        (cause) => new PayloadOperationError('制作物一覧の取得に失敗しました', { cause }),
      )
        .map(({ docs }) => docs.map(toSummary))
        .match(ok, toToolError),

    getWork: (input: { id?: number; slug?: string }): Promise<ToolResult> => parseWorkQuery(input).andThen(findWork).andThen(requireWork).andThen(buildGetWorkPayload).match(ok, toToolError),

    createWork: (input: { title: string; slug: string; type: Work['type']; date: string; url?: string; description?: string; thumbnailMediaID?: number; bodyMarkdown?: string }): Promise<ToolResult> =>
      // 副作用を伴う検証は最後に置く: prepareBody は media doc alt 更新を即 commit する
      // 副作用を持つため、date / thumbnail / slug の失敗しうる検証を先に済ませ、
      // 不正入力で create が失敗した際に alt 変更だけが残るのを避ける(blog の createPost と同じ理由)。
      parseDate(input.date)
        .andThen(() => verifyThumbnailIfProvided(verifyMediaExists, input.thumbnailMediaID))
        .andThen(() => requireSlugAvailable(payload, 'works', input.slug, 'update_work'))
        .andThen(() => prepareBodyIfProvided(input.bodyMarkdown))
        .andThen((body) =>
          fromPromise(
            payload.create({
              collection: 'works',
              draft: true,
              data: {
                title: input.title,
                slug: input.slug,
                type: input.type,
                date: input.date,
                url: input.url,
                description: input.description,
                thumbnail: input.thumbnailMediaID,
                ...(body === undefined ? {} : { body }),
                _status: 'draft',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('制作物の作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          adminURL: adminURLOf(created.id),
          note: 'draft として作成済み。admin UI の Live Preview で確認後、publish_work で公開する。',
        }))
        .match(ok, toToolError),

    updateWork: (input: {
      id: number;
      title?: string;
      slug?: string;
      type?: Work['type'];
      date?: string;
      url?: string | null;
      description?: string | null;
      thumbnailMediaID?: number | null;
      bodyMarkdown?: string;
    }): Promise<ToolResult> =>
      parseDateIfProvided(input.date)
        // thumbnail は number のときだけ実在確認する(null = 外す、undefined = 変更なし)。
        .andThen(() => verifyThumbnailIfProvided(verifyMediaExists, input.thumbnailMediaID ?? undefined))
        .andThen(() => findWork({ kind: 'id', id: input.id }))
        .andThen(requireWork)
        .andThen((current) => resolveNextBody(input.bodyMarkdown, current.body ?? undefined))
        .andThen((nextBody) =>
          fromPromise(
            payload.update({
              collection: 'works',
              id: input.id,
              draft: true,
              // 指定されたフィールドだけを送る。undefined を混ぜると Payload 側で
              // 既存値を上書きしうるため、キー自体を落とす。url / description / thumbnail は
              // null を明示的な「クリア」として forward する(undefined = 変更なし、null = 外す)。
              data: {
                ...(input.title === undefined ? {} : { title: input.title }),
                ...(input.slug === undefined ? {} : { slug: input.slug }),
                ...(input.type === undefined ? {} : { type: input.type }),
                ...(input.date === undefined ? {} : { date: input.date }),
                ...(input.url === undefined ? {} : { url: input.url }),
                ...(input.description === undefined ? {} : { description: input.description }),
                ...(input.thumbnailMediaID === undefined ? {} : { thumbnail: input.thumbnailMediaID }),
                ...buildBodyPatch(nextBody),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('制作物の更新に失敗しました', { cause }),
          ),
        )
        // 公開済みの work を更新した直後でも /works に出ている published 版はまだ古いまま
        // なので、status は 'draft' と断定せず説明的な文言にする(blog / logs の update と同じ)。
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          status: 'draft version saved',
          adminURL: adminURLOf(updated.id),
          note: '変更は draft version として保存済み。公開反映には publish_work が必要。',
        }))
        .match(ok, toToolError),

    publishWork: (input: { id: number }): Promise<ToolResult> =>
      findWork({ kind: 'id', id: input.id })
        .andThen(requireWork)
        // draft-promotion: versions.drafts が有効なため update_work の変更は versions
        // テーブルに積まれる。ここで bare `_status` だけを update すると published 済みの
        // main テーブル行の上に浅くマージされ、未公開の draft 編集が黙って失われる。
        // 最新 draft を読み直し、全フィールドを published 付きで再送する
        // (blog の publishPost / logs の publishLog と同じ形)。
        .andThen((current) =>
          fromPromise(
            payload.update({
              collection: 'works',
              id: input.id,
              data: {
                title: current.title,
                slug: current.slug,
                type: current.type,
                date: current.date,
                url: current.url,
                description: current.description,
                thumbnail: resolveThumbnailID(current.thumbnail),
                body: current.body,
                _status: 'published',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('制作物の公開に失敗しました', { cause }),
          ),
        )
        .map((published) => ({
          id: published.id,
          slug: published.slug,
          title: published.title,
          status: published._status,
          url: absoluteUrl(`/works/${published.slug}`),
        }))
        .match(ok, toToolError),
  };
};

export const registerWorkTools = (server: McpServer, deps: WorkToolDeps): void => {
  const handlers = createWorkToolHandlers(deps);

  server.registerTool(
    'list_works',
    {
      title: 'works 一覧',
      description:
        '/works に載る制作物を一覧する(date 降順)。id / slug / title / type / date / url / description / thumbnailMediaID / 公開状態を返す。get_work・update_work・publish_work に渡す id はここで確認する。',
      inputSchema: {
        status: z.enum(['draft', 'published', 'all']).optional().describe('既定は all'),
        limit: z.number().int().positive().optional().describe('既定は無制限'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listWorks,
  );

  server.registerTool(
    'get_work',
    {
      title: 'works 取得',
      description: '制作物 1 件を取得し、本文を Markdown で返す。本文未設定なら bodyMarkdown は空文字。MCP 非対応 block を含む場合は bodyEditable: false と warning を返す。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getWork,
  );

  server.registerTool(
    'create_work',
    {
      title: 'works 作成(draft)',
      description:
        '制作物を必ず draft として作成する(公開は publish_work のみ)。thumbnail は任意(未設定なら詳細ページにプレースホルダが出る)。本文の画像・block 構文は bodyMarkdown フィールドの説明を参照。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        type: z.enum(WORK_TYPE_OPTIONS).describe(TYPE_HELP),
        date: z.string().describe('制作日。YYYY-MM-DD'),
        url: z.string().url().optional().describe(URL_HELP),
        description: z.string().min(1).optional().describe('一覧・詳細ページに出る概要'),
        thumbnailMediaID: z.number().int().optional().describe('upload_media で作成した media の id。省略可'),
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createWork,
  );

  server.registerTool(
    'update_work',
    {
      title: 'works 更新(draft 保存)',
      description: '指定フィールドのみ部分更新し draft version として保存する。bodyMarkdown 省略時は本文に触らない。公開反映は publish_work を呼ぶこと。',
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)').optional(),
        type: z.enum(WORK_TYPE_OPTIONS).optional().describe(TYPE_HELP),
        date: z.string().optional().describe('制作日。YYYY-MM-DD'),
        url: z.string().url().nullable().optional().describe(`${URL_HELP}。省略すると変更なし。null を渡すと外部リンクを外す`),
        description: z.string().min(1).nullable().optional().describe('省略すると変更なし。null を渡すと概要を消す'),
        thumbnailMediaID: z.number().int().nullable().optional().describe('省略すると変更なし。null を渡すとサムネイルを外す'),
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updateWork,
  );

  server.registerTool(
    'publish_work',
    {
      title: 'works 公開',
      description: '制作物を公開する(/works に即反映される唯一の操作)。最新 draft の内容がそのまま公開される。実行前にユーザーの明示的な意思を確認すること。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    handlers.publishWork,
  );
};
