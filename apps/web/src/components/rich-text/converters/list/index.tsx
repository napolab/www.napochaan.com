import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical `list` / `listitem` nodes with styled markers.
 *
 * Payload's default converter relies on global `list-*` class names that Panda's
 * preflight resets. These converters apply the project's own styled classes instead.
 * A list whose parent is a `listitem` is marked `data-nested` so it indents properly.
 *
 * Lexical models a nested list as a `listitem` whose only child is another `list`
 * (the preceding sibling holds the parent text). Such a wrapper item carries no
 * text of its own, so it is flagged `data-has-sublist` to drop its bullet —
 * otherwise it paints a stray marker on the nested list's first line.
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
    const hasSubList = node.children.some((child) => child.type === 'list') ? true : undefined;
    return (
      <li className={styles.listItem} value={node.value} data-has-sublist={hasSubList}>
        {nodesToJSX({ nodes: node.children })}
      </li>
    );
  },
};
