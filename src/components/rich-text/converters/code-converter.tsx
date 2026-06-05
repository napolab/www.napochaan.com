import * as styles from '../styles.css';

import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical';
import type { JSXConverter, JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

// Lexical's `code` block node is not in Payload's DefaultNodeTypes (it comes
// from @lexical/code). We register it via the string-keyed index signature so
// the converter fires when a `code` node appears in the document.
const codeNodeConverter: JSXConverter<SerializedLexicalNode & { children: SerializedLexicalNode[] }> = ({ node, nodesToJSX }) => (
  <pre className={styles.codeBlock}>
    <code>{nodesToJSX({ nodes: node.children })}</code>
  </pre>
);

/**
 * DARK TERMINAL code block: ink background, canvas-colored text.
 * Handles the Lexical `code` block node (fenced code blocks from @lexical/code).
 */
export const codeConverter: Partial<JSXConverters<NodeTypes>> = {
  code: codeNodeConverter as JSXConverter,
};
