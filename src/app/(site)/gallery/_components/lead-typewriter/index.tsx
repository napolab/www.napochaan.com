'use client';

import { useTypewriter } from '@hooks/use-typewriter';

import * as styles from './styles.css';

type Props = {
  text: string;
};

// The /gallery lead, revealed one character at a time (cf. hero's LeadQuote). Inline
// markup only — PageHeader wraps `lead` in a <p>, which may not contain block
// elements. The full text stays in the DOM (srOnly) for assistive tech and crawlers;
// the typed copy is visual and aria-hidden.
export const LeadTypewriter = ({ text }: Props) => {
  const { displayText } = useTypewriter(text);

  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span className={styles.typeWrap} aria-hidden="true">
        <span className={styles.typeSizer}>{text}</span>
        <span className={styles.typed}>
          {displayText}
          <span className={styles.caret} />
        </span>
      </span>
    </>
  );
};
