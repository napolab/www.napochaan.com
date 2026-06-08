import { TypewriterText } from '@components/typewriter-text';

import * as styles from './styles.css';

type Props = {
  text: string;
};

export const LeadQuote = ({ text }: Props) => (
  <blockquote className={styles.lead}>
    <TypewriterText>{text}</TypewriterText>
  </blockquote>
);
