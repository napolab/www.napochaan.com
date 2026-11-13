import { BlankDim } from '../blank-dim';
import * as styles from '../styles.css';

import type { Blank } from '../skyline/compute-blanks';
import type { CSSProperties } from 'react';

type Props = {
  blank: Blank;
  // Which breakpoint layout this blank belongs to (0/1/2 → shown via data-bp).
  bp: number;
  // Index within its breakpoint set, for the reference number.
  index: number;
};

// A blank's cw-unit position; consumed by styles.blank via --col / --y / --h.
const blankVars = (blank: Blank): CSSProperties => ({ '--col': `${blank.col}`, '--y': `${blank.y}`, '--h': `${blank.height}` }) as CSSProperties;

const refNo = (index: number): string => `${index + 1}`.padStart(2, '0');

// One empty grid cell, dimensioned like a technical drawing: registration crosshairs at
// the corners + the measured size / reference number (BlankDim). Decorative (aria-hidden).
export const BlankCell = ({ blank, bp, index }: Props) => (
  <li className={styles.blank} data-bp={bp} style={blankVars(blank)} aria-hidden="true">
    <span className={styles.corner} data-pos="tl">
      +
    </span>
    <span className={styles.corner} data-pos="tr">
      +
    </span>
    <span className={styles.corner} data-pos="bl">
      +
    </span>
    <span className={styles.corner} data-pos="br">
      +
    </span>
    <BlankDim refLabel={refNo(index)} />
  </li>
);
