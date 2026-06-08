'use client';

import { useTypewriter } from '@hooks/use-typewriter';

import { PhrasedText } from '@components/phrased-text';

import * as styles from './styles.css';

type Props = {
  children: string;
  phrase?: boolean;
};

// The hero's 3-layer typewriter, generalized: an SR/crawler copy of the full text,
// a hidden sizer that reserves the final wrapped height (CLS guard), and an
// absolutely-positioned typed overlay that reveals the text one keystroke at a
// time. Renders only spans (a Fragment) so the host supplies the wrapping
// <p>/<blockquote> and the font/color these spans inherit.
export const TypewriterText = ({ children, phrase = false }: Props) => {
  const { displayText, isDone } = useTypewriter(children);
  const sizer = phrase ? <PhrasedText>{children}</PhrasedText> : children;
  const body = phrase && isDone ? <PhrasedText>{children}</PhrasedText> : displayText;

  return (
    <>
      {/* Full text stays available to SR / crawlers; the typed copy is visual only. */}
      <span className={styles.srOnly}>{children}</span>
      <span className={styles.typeWrap} aria-hidden="true">
        {/* Hidden sizer reserves the final wrapped height so typing never shifts what's below. */}
        <span className={styles.sizer}>{sizer}</span>
        <span className={styles.typed}>
          {body}
          <span className={styles.caret} />
        </span>
      </span>
    </>
  );
};
