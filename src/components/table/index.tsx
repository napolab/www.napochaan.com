import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Column = {
  key: string;
  label: string;
};

type Props = {
  columns: readonly Column[];
  rows: readonly Record<string, ReactNode>[];
  caption?: string;
};

// Explicit ARIA roles preserve table semantics on mobile, where the layout
// switches to display:block stacked cards (which would otherwise strip the
// implicit table roles). Each cell carries data-label for its ::before field name.
export const Table = ({ columns, rows, caption }: Props) => {
  return (
    <table role="table" className={styles.root}>
      {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
      <thead role="rowgroup" className={styles.head}>
        <tr role="row">
          {columns.map((column) => (
            <th key={column.key} role="columnheader" className={styles.headerCell} scope="col">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup" className={styles.body}>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} role="row" className={styles.row}>
            {columns.map((column) => (
              <td key={column.key} role="cell" className={styles.cell} data-label={column.label}>
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
