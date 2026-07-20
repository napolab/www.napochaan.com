import { ValidationError } from 'payload';

import { formatPayloadValidationError, PayloadOperationError } from '../../../errors';

import type { McpToolError } from '../../../errors';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

export const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
// .match の edge で唯一 ToolResult に折り畳む(chaining-neverthrow-results)。discriminate は
// instanceof(modeling-errors-as-classes) — PayloadOperationError だけ cause の中身で
// 分岐が要るので個別分岐、それ以外は自身の message がそのままユーザー向け文言。
export const toToolError = (error: McpToolError): ToolResult => {
  if (error instanceof PayloadOperationError) {
    if (error.cause instanceof ValidationError) return fail(formatPayloadValidationError(error.cause));
    console.error('[mcp] tool error', error.message, error.cause);
    return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
  }

  return fail(error.message);
};
