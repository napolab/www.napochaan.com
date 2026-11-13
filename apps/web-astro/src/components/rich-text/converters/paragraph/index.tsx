import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical paragraph nodes as styled `<p>` elements.
 *
 * An empty paragraph is what the editor produces for a blank line (Enter on an
 * empty row). Rendered as a bare `<p></p>` it collapses to zero height and the
 * author's intentional spacing disappears, so it gets a `<br />` to keep one
 * line of height — matching Payload's default paragraph converter.
 */
export const paragraphConverter: Partial<JSXConverters<NodeTypes>> = {
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    if (children.length === 0) {
      return (
        <p className={styles.paragraph}>
          <br />
        </p>
      );
    }
    return <p className={styles.paragraph}>{children}</p>;
  },
};
