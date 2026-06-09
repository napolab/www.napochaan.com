import * as s from './styles.css';

type Props = {
  rows?: number;
  label?: string;
};

// Per-row cell counts (deterministic, no Math.random so the markup is stable for
// RSC + tests). Rows of uneven length read as ragged decoded text rather than a
// solid block. Cycles if `rows` exceeds the table.
const CELLS_PER_ROW = [11, 8, 12, 9, 10, 7] as const;

const cellsForRow = (index: number): number => {
  const count = CELLS_PER_ROW[index % CELLS_PER_ROW.length];
  return count ?? 9;
};

// On-brand loading fallback: a stack of mono glyph cells churning through the
// ScrambleText glyph vocabulary (█▓▒░#%&@/\<>0-9) with an electric-blue caret, so
// the wait reads as text being *decoded* in the site's visual language rather than
// a generic spinner. Server Component — the entire effect is HTML + CSS keyframes
// (no JS, no 'use client'); see styles.css.ts. Used as the Suspense fallback on the
// works / news / blog / log list routes.
//
// Accessibility: the churn is decorative and lives under one aria-hidden subtree; a
// visually-hidden role="status" / aria-live="polite" node carries `label` so screen
// readers announce the load without reading any glyphs. Reduced-motion freezes the
// churn and the caret (handled in CSS).
export const DecodingSkeleton = ({ rows = 6, label = '読み込み中…' }: Props) => {
  const rowIndexes = Array.from({ length: rows }, (_, index) => index);

  return (
    <div className={s.root} role="status" aria-live="polite" aria-busy="true">
      <span className={s.srOnly}>{label}</span>
      <div aria-hidden="true" className={s.glyphs}>
        {rowIndexes.map((rowIndex) => {
          const cellCount = cellsForRow(rowIndex);
          const cellIndexes = Array.from({ length: cellCount }, (_, cellIndex) => cellIndex);

          return (
            <div key={rowIndex} data-testid="decoding-row" className={s.row}>
              {cellIndexes.map((cellIndex) => (
                <span key={cellIndex} className={s.cell} />
              ))}
              {rowIndex === 0 ? <span className={s.caret} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
