import { Fragment } from 'react';

import { clsx } from '@utils/clsx';
import { phrase } from '@utils/phrase';

import * as styles from './styles.css';

type Props = {
  children: string;
  className?: string;
};

// Wraps Japanese prose so lines break between 文節 on every browser. BudouX
// segments the text (see @utils/phrase) and the chunks are joined with <wbr>
// break opportunities; `word-break: keep-all` (styles) then suppresses breaks
// everywhere else, so the <wbr> are the only break points — what Chromium's
// `word-break: auto-phrase` does, but on iOS Safari / Firefox too.
//
// Server Component: phrase() runs at render time and is deterministic, so the
// markup is identical on server and client (no hydration mismatch). `children`
// is a plain string because BudouX segments raw text, not arbitrary nodes.
export const PhrasedText = ({ children, className }: Props) => {
  const segments = phrase(children);

  return (
    <span className={clsx(styles.root, className)}>
      {segments.map((segment, index) => (
        <Fragment key={`${index}-${segment}`}>
          {index > 0 ? <wbr /> : null}
          {segment}
        </Fragment>
      ))}
    </span>
  );
};
