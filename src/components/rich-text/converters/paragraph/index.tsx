import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical paragraph nodes as styled `<p>` elements.
 */
export const paragraphConverter: Partial<JSXConverters<NodeTypes>> = {
  paragraph: ({ node, nodesToJSX }) => {
    return <p className={styles.paragraph}>{nodesToJSX({ nodes: node.children })}</p>;
  },
};
