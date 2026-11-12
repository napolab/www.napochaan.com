import { ValidationError } from 'payload';

import { findCause } from '@utils/find-cause';
import { matchOption } from '@utils/option';

import { formatPayloadValidationError, PayloadOperationError } from '../../../errors';

import type { McpToolError } from '../../../errors';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

export const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

const isValidationError = (value: unknown): value is ValidationError => value instanceof ValidationError;

// cause チェーンに ValidationError が無かった場合の文言。PayloadOperationError は内部エラーと
// してログ + 汎用文言(内部詳細は伏せる)、それ以外は自身の message がそのままユーザー向け。
const resolveNonValidationMessage = (error: McpToolError): string => {
  if (error instanceof PayloadOperationError) {
    console.error('[mcp] tool error', error.message, error.cause);

    return '内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。';
  }

  return error.message;
};

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
// .match の edge で唯一 ToolResult に折り畳む(chaining-neverthrow-results)。cause チェーンに
// ValidationError があれば(深さを問わず findCause で辿る)その回復ヒントを最優先で返し、
// 無ければ resolveNonValidationMessage に委ねる。文言を決めてから最後に fail で 1 回包む。
export const toToolError = (error: McpToolError): ToolResult =>
  fail(
    matchOption(findCause(error, isValidationError), {
      some: formatPayloadValidationError,
      none: () => resolveNonValidationMessage(error),
    }),
  );
