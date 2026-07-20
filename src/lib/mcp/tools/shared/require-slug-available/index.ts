import { errAsync, fromPromise, okAsync } from 'neverthrow';

import { InvalidInputError, PayloadOperationError } from '../../../errors';

import type { McpToolError } from '../../../errors';
import type { ResultAsync } from 'neverthrow';
import type { Payload } from 'payload';

// MCP から create できる、slug を持つ collection。
type SluggedCollection = 'blog' | 'legal-documents';

// create 前の重複 slug チェック。DB の unique 制約に触れる前に回復ヒントで弾く
// (.claude/rules/mcp-write-strict.md: opaque な DB エラーになる前に actionable な hint へ)。
// 一意性は access/status に依らないので overrideAccess:true で問い合わせ、未公開 draft の
// slug も拾うため draft:true で見る。
export const requireSlugAvailable = (payload: Payload, collection: SluggedCollection, slug: string, updateToolName: string): ResultAsync<void, McpToolError> =>
  fromPromise(
    payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, draft: true, overrideAccess: true, depth: 0 }),
    (cause) => new PayloadOperationError('slug の重複確認に失敗しました', { cause }),
  ).andThen(({ docs }) =>
    docs.length > 0 ? errAsync(new InvalidInputError(`slug "${slug}" は既に使われています。${updateToolName} で更新するか、別の slug を指定してください。`)) : okAsync(undefined),
  );
