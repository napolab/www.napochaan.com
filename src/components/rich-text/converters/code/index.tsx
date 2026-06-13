import { CodeBlock } from './code-block';
import { extractCode } from './extract-code';

import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical';
import type { JSXConverter, JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// Lexical's `code` block node is not in Payload's DefaultNodeTypes (it comes
// from @lexical/code). We register it via the string-keyed index signature so
// the converter fires when a `code` node appears in the document. The raw source
// and language are folded out of the node, then highlighted server-side.
type CodeBlockNode = SerializedLexicalNode & { language?: string | null; children?: { type: string; text?: string }[] };

const codeNodeConverter: JSXConverter<CodeBlockNode> = ({ node }) => {
  const { code, lang } = extractCode(node);

  return <CodeBlock code={code} lang={lang} />;
};

/**
 * Syntax-highlighted code block. Handles the Lexical `code` block node (fenced
 * code blocks from @lexical/code) — see ./code-block for the Shiki pipeline.
 */
export const codeConverter: Partial<JSXConverters<NodeTypes>> = {
  code: codeNodeConverter as JSXConverter,
};
