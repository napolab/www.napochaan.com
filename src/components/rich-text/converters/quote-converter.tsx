import * as styles from '../styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

/**
 * TERMINAL-style blockquote: monospaced font, muted color, "> " prefix via CSS `_before`.
 */
export const quoteConverter: Partial<JSXConverters<NodeTypes>> = {
  quote: ({ node, nodesToJSX }) => {
    return <blockquote className={styles.blockquote}>{nodesToJSX({ nodes: node.children })}</blockquote>;
  },
};
