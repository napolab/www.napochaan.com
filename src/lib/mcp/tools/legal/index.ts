import { err as errResult, errAsync, fromPromise, fromThrowable, ok as okResult, okAsync } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { createValidator } from '@utils/run-validators';

import { InvalidInputError, PayloadOperationError, PostNotFoundError } from '../../errors';
import { ok, toToolError } from '../shared/tool-result';

import type { McpToolError } from '../../errors';
import type { MarkdownCodec } from '../../markdown';
import type { ToolResult } from '../shared/tool-result';
import type { Validator } from '@utils/run-validators';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LegalDocument, User } from '@payload-types';
import type { ResultAsync } from 'neverthrow';
import type { Payload } from 'payload';

export type LegalToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<LegalDocument['body']>;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BODY_MARKDOWN_HELP =
  '法務文書の本文を Markdown で書く。見出し・箇条書き・リンクが使える。画像を入れる場合は upload_media で登録し、返された ![media:<id>](alt) 参照をそのまま貼ること(生 URL は不可)。';

// write path は strict。変換せず reject し、LLM が 1 回のリトライで自己修正できるヒントを返す
// (.claude/rules/mcp-write-strict.md)。逐次バリデーションを @utils/run-validators の
// sequence plugin に落とし込む(小関数合成、validator-composition-style.md の系譜)。

// 1. 形式 — YYYY-MM-DD かどうか。
const requireDayFormat: Validator<string, McpToolError> = {
  run: (value) => (DAY_PATTERN.test(value) ? okResult(value) : errResult(new InvalidInputError(`effectiveAt は YYYY-MM-DD 形式で指定してください。受け取った値: "${value}"`))),
};

// 2. 実在 — 2026-02-30 のような「形式は合うが存在しない日付」を弾く。dayjs の strict parse
//    (customParseFormat)は存在しない日付(2/30 等)をロールオーバーせず invalid として
//    検出する(.claude/rules/dayjs-timezone.md 準拠、dayjs は @utils/dayjs 経由)。
const requireRealDay: Validator<string, McpToolError> = {
  run: (value) => (dayjs(value, 'YYYY-MM-DD', true).isValid() ? okResult(value) : errResult(new InvalidInputError(`effectiveAt が存在しない日付です。受け取った値: "${value}"`))),
};

// validators を固定した具体 validator。sync な Result を返す。
const validateEffectiveAt = createValidator([requireDayFormat, requireRealDay]);

// 既存の call site が ResultAsync チェーンなので、sync な validator 合成を async に持ち上げる
// (okAsync の恒等 andThen で err 型も McpToolError に合流する)。
const parseEffectiveAt = (value: string): ResultAsync<string, McpToolError> => validateEffectiveAt(value).asyncAndThen((valid) => okAsync(valid));

const toSummary = (doc: LegalDocument) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  // Payload の date フィールドは ISO タイムスタンプ("2026-08-01T00:00:00.000Z")で返る。
  // read は write が受け付ける正準形(YYYY-MM-DD)に正規化して返す — でないと get → update の
  // 往復で effectiveAt を素直に渡し戻すと parseEffectiveAt の DAY_PATTERN に弾かれる
  // (read-normalize / write-strict、.claude/rules/mcp-write-strict.md)。JST 暦日で切る。
  effectiveAt: dayjs(doc.effectiveAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  status: doc._status ?? 'draft',
});

type DocumentQuery = { kind: 'id'; id: number } | { kind: 'slug'; slug: string };

const parseDocumentQuery = (input: { id?: number; slug?: string }): ResultAsync<DocumentQuery, McpToolError> => {
  if (input.id !== undefined) return okAsync({ kind: 'id', id: input.id });
  if (input.slug !== undefined) return okAsync({ kind: 'slug', slug: input.slug });

  return errAsync(new InvalidInputError('id か slug のどちらかを指定してください。'));
};

export const createLegalToolHandlers = (deps: LegalToolDeps) => {
  const { payload, user, codec } = deps;

  // codec.toLexical / toMarkdown は同期関数なので、fromThrowable で同期 throw を Result に
  // 拾う(blog 側の toLexicalSafe と同じ形)。返りは同期 Result で、async チェーンの
  // .andThen はこれをそのまま受け付ける。
  const toLexicalSafe = fromThrowable(
    (markdown: string) => codec.toLexical(markdown),
    (cause) => new PayloadOperationError('Markdown → Lexical 変換に失敗しました', { cause }),
  );

  const toMarkdownSafe = fromThrowable(
    (data: LegalDocument['body']) => codec.toMarkdown(data),
    (cause) => new PayloadOperationError('Lexical → Markdown 変換に失敗しました', { cause }),
  );

  const findDocument = (query: DocumentQuery): ResultAsync<LegalDocument | null, McpToolError> => {
    switch (query.kind) {
      case 'id':
        return fromPromise(
          payload.findByID({ collection: 'legal-documents', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('法務文書の取得に失敗しました', { cause }),
        );
      case 'slug':
        return fromPromise(
          payload.find({ collection: 'legal-documents', draft: true, where: { slug: { equals: query.slug } }, limit: 1, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('法務文書の取得に失敗しました', { cause }),
        ).map(({ docs }) => docs[0] ?? null);
      default: {
        const _exhaustive: never = query;
        throw new Error(`unhandled legal document query: ${JSON.stringify(_exhaustive)}`);
      }
    }
  };

  const requireDocument = (doc: LegalDocument | null): ResultAsync<LegalDocument, McpToolError> =>
    doc === null ? errAsync(new PostNotFoundError('法務文書が見つかりません。list_legal_documents で id / slug を確認してください。')) : okAsync(doc);

  return {
    listLegalDocuments: (): Promise<ToolResult> =>
      fromPromise(
        payload.find({ collection: 'legal-documents', draft: true, limit: 0, sort: 'slug', overrideAccess: false, user, depth: 0 }),
        (cause) => new PayloadOperationError('法務文書一覧の取得に失敗しました', { cause }),
      )
        .map(({ docs }) => docs.map(toSummary))
        .match(ok, toToolError),

    getLegalDocument: (input: { id?: number; slug?: string }): Promise<ToolResult> =>
      parseDocumentQuery(input)
        .andThen(findDocument)
        .andThen(requireDocument)
        // effectiveAt は本文に混ぜず独立フィールドで返す。frontmatter に埋めると
        // read → write の往復で本文の一部として書き戻される。
        .andThen((doc) => toMarkdownSafe(doc.body).map((bodyMarkdown) => ({ ...toSummary(doc), bodyMarkdown })))
        .match(ok, toToolError),

    createLegalDocument: (input: { title: string; slug: string; effectiveAt: string; bodyMarkdown: string }): Promise<ToolResult> =>
      parseEffectiveAt(input.effectiveAt)
        .andThen(() => toLexicalSafe(input.bodyMarkdown))
        .andThen((body) =>
          fromPromise(
            payload.create({
              collection: 'legal-documents',
              draft: true,
              data: {
                title: input.title,
                slug: input.slug,
                effectiveAt: input.effectiveAt,
                body,
                _status: 'draft',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('法務文書の作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          note: 'draft として作成済み。法務文書の公開は admin UI で本文を確認してから行う(MCP からは公開できない)。',
        }))
        .match(ok, toToolError),

    updateLegalDocument: (input: { id?: number; slug?: string; title?: string; effectiveAt?: string; bodyMarkdown?: string }): Promise<ToolResult> =>
      parseDocumentQuery(input)
        .andThen(findDocument)
        .andThen(requireDocument)
        .andThen((doc) => (input.effectiveAt === undefined ? okAsync(doc) : parseEffectiveAt(input.effectiveAt).map(() => doc)))
        // toLexicalSafe は同期 Result なので、無変換ブランチも同期 okResult に揃える
        // (ResultAsync | Result の union を作らず、外側の async .andThen が受け取れる形に)。
        .andThen((doc) => (input.bodyMarkdown === undefined ? okResult({ doc, body: undefined }) : toLexicalSafe(input.bodyMarkdown).map((body) => ({ doc, body }))))
        .andThen(({ doc, body }) =>
          fromPromise(
            payload.update({
              collection: 'legal-documents',
              id: doc.id,
              draft: true,
              data: {
                ...(input.title === undefined ? {} : { title: input.title }),
                ...(input.effectiveAt === undefined ? {} : { effectiveAt: input.effectiveAt }),
                ...(body === undefined ? {} : { body }),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('法務文書の更新に失敗しました', { cause }),
          ),
        )
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          status: 'draft',
          note: 'draft を更新した。公開は admin UI で行う。',
        }))
        .match(ok, toToolError),
  };
};

export const registerLegalTools = (server: McpServer, deps: LegalToolDeps): void => {
  const handlers = createLegalToolHandlers(deps);

  server.registerTool(
    'list_legal_documents',
    {
      title: '法務文書一覧',
      description: '利用規約・免責事項などの法務文書を一覧する。id / slug / 施行日 / 公開状態を返す。',
      annotations: { readOnlyHint: true },
    },
    handlers.listLegalDocuments,
  );

  server.registerTool(
    'get_legal_document',
    {
      title: '法務文書取得',
      description: '法務文書 1 件を取得し、本文を Markdown で返す。施行日は bodyMarkdown ではなく effectiveAt フィールドに入る。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getLegalDocument,
  );

  server.registerTool(
    'create_legal_document',
    {
      title: '法務文書作成(draft)',
      description: '法務文書を必ず draft として作成する。公開(施行)は admin UI で行うため、MCP からは公開できない。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        effectiveAt: z.string().describe('施行日。YYYY-MM-DD'),
        bodyMarkdown: z.string().min(1).describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createLegalDocument,
  );

  server.registerTool(
    'update_legal_document',
    {
      title: '法務文書更新(draft)',
      description: '法務文書の draft を更新する。指定したフィールドだけが変わる。公開は admin UI で行う。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
        title: z.string().min(1).optional(),
        effectiveAt: z.string().optional().describe('施行日。YYYY-MM-DD'),
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updateLegalDocument,
  );
};
