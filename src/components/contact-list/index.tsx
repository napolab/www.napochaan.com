import { ScrambleText } from '@components/scramble-text';

import * as styles from './styles.css';

type Item = {
  label: string;
  handle: string;
  href: string;
};

type Props = {
  items: readonly Item[];
};

// Contact as button-style external links: each reads as an outline button with a
// trailing ↗ affordance (decorative, aria-hidden). The blue accent is reserved
// for hover so the resting row stays quiet.
export const ContactList = ({ items }: Props) => {
  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <li key={item.label}>
          <a className={styles.link} href={item.href} target="_blank" rel="noopener noreferrer">
            <ScrambleText className={styles.label}>{item.label}</ScrambleText>
            <span className={styles.handle}>{item.handle}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
};
