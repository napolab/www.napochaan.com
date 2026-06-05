import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// headerState bitmask constants (mirrors @lexical/table TableCellHeaderStates)
const HEADER_ROW = 2;
const HEADER_COLUMN = 4;

/**
 * Resolves the `scope` attribute for a `<th>` cell based on the headerState bitmask.
 * ROW-only → "row", COLUMN-only → "col", BOTH → "rowgroup", catch-all → "col".
 */
const resolveScope = (headerState: number): 'col' | 'row' | 'rowgroup' => {
  const isRow = (headerState & HEADER_ROW) !== 0;
  const isCol = (headerState & HEADER_COLUMN) !== 0;
  if (isRow && isCol) return 'rowgroup';
  if (isRow) return 'row';
  return 'col';
};

/**
 * Renders Lexical experimental table nodes with project styling.
 * - Outer scroll wrapper keeps wide tables from breaking layout.
 * - `headerState > 0` → `<th scope=…>` with mono uppercase header style.
 * - colSpan / rowSpan forwarded when > 1.
 * - Row hover via the `tableRow` class.
 */
export const tableConverter: Partial<JSXConverters<NodeTypes>> = {
  table: ({ node, nodesToJSX }) => (
    <div className={styles.tableScroll}>
      <table className={styles.tableRoot}>{nodesToJSX({ nodes: node.children })}</table>
    </div>
  ),
  tablerow: ({ node, nodesToJSX }) => (
    <tr className={styles.tableRow} data-row="">
      {nodesToJSX({ nodes: node.children })}
    </tr>
  ),
  tablecell: ({ node, nodesToJSX }) => {
    const colSpan = node.colSpan !== undefined && node.colSpan > 1 ? node.colSpan : undefined;
    const rowSpan = node.rowSpan !== undefined && node.rowSpan > 1 ? node.rowSpan : undefined;
    const children = nodesToJSX({ nodes: node.children });

    if (node.headerState > 0) {
      return (
        <th className={styles.headerCell} scope={resolveScope(node.headerState)} colSpan={colSpan} rowSpan={rowSpan}>
          {children}
        </th>
      );
    }

    return (
      <td className={styles.cell} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
      </td>
    );
  },
};
