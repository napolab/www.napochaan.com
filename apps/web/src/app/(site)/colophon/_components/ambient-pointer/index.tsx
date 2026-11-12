import * as styles from './styles.css';

type Props = {
  label: string;
  target: string;
};

// One ambient-chrome pointer: names a part of the page chrome that SiteShell
// already renders (TypographyBand / GameOfLife / SysBar) instead of re-rendering
// it. Reads as a full sentence: "▸ <label> → <target>".
export const AmbientPointer = ({ label, target }: Props) => {
  return (
    <li className={styles.root}>
      <span className={styles.marker} aria-hidden="true">
        ▸
      </span>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
      <span className={styles.target}>{target}</span>
    </li>
  );
};
