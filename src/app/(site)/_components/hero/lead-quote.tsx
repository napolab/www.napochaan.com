'use client';

import { useTypewriter } from '@hooks/use-typewriter';

import * as styles from './styles.css';

type Props = {
  text: string;
};

export const LeadQuote = ({ text }: Props) => {
  const { displayText } = useTypewriter(text);

  return (
    <blockquote className={styles.lead}>
      {/* Full text stays available to SR / crawlers; the typed copy is visual only. */}
      <span className={styles.srOnly}>{text}</span>
      <span className={styles.typeWrap} aria-hidden="true">
        {/* Hidden sizer reserves the final height so typing never shifts the buttons. */}
        <span className={styles.typeSizer}>{text}</span>
        <span className={styles.typed}>
          {displayText}
          <span className={styles.caret} />
        </span>
      </span>
    </blockquote>
  );
};
