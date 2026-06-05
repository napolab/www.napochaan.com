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

export const Table = ({ columns, rows, caption }: Props) => {
  return (
    <table className={styles.root}>
      {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={styles.headerCell} scope="col">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className={styles.row}>
            {columns.map((column) => (
              <td key={column.key} className={styles.cell}>
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
