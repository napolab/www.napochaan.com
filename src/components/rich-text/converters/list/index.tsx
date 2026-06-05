import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical `list` / `listitem` nodes with styled markers.
 *
 * Payload's default converter relies on global `list-*` class names that Panda's
 * preflight resets. These converters apply the project's own styled classes instead.
 * A list whose parent is a `listitem` is marked `data-nested` so it indents properly.
 */
export const listConverter: Partial<JSXConverters<NodeTypes>> = {
  list: ({ node, nodesToJSX, parent }) => {
    const Tag = node.tag;
    const nested = 'type' in parent && parent.type === 'listitem' ? true : undefined;
    const className = node.tag === 'ol' ? styles.orderedList : styles.unorderedList;
    return (
      <Tag className={className} data-nested={nested}>
        {nodesToJSX({ nodes: node.children })}
      </Tag>
    );
  },
  listitem: ({ node, nodesToJSX }) => {
    return (
      <li className={styles.listItem} value={node.value}>
        {nodesToJSX({ nodes: node.children })}
      </li>
    );
  },
};
