import { ValidationError } from 'payload';

import { findCause } from '@utils/find-cause';

import { formatPayloadValidationError, PayloadOperationError } from '../../../errors';

import type { McpToolError } from '../../../errors';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

export const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

const isValidationError = (value: unknown): value is ValidationError => value instanceof ValidationError;

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
// .match の edge で唯一 ToolResult に折り畳む(chaining-neverthrow-results)。discriminate は
// instanceof(modeling-errors-as-classes)。cause チェーンに ValidationError があれば(深さを
// 問わず findCause で辿る)その回復ヒントを最優先で返す。それ以外の PayloadOperationError は
// 内部エラーとしてログ + 汎用文言、残りは自身の message がそのままユーザー向け文言。
export const toToolError = (error: McpToolError): ToolResult => {
  const validationError = findCause(error, isValidationError);
  if (validationError !== undefined) return fail(formatPayloadValidationError(validationError));

  if (error instanceof PayloadOperationError) {
    console.error('[mcp] tool error', error.message, error.cause);
    return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
  }

  return fail(error.message);
};
