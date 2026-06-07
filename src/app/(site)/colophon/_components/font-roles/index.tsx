import * as styles from './styles.css';

type Props = {
  fonts: readonly { family: string; role: string; why: string }[];
};

// The three typefaces and why each was chosen. The family name is rendered in
// its own font (data-font → fontFamily token) so the specimen is the evidence.
export const FontRoles = ({ fonts }: Props) => {
  return (
    <dl className={styles.root}>
      {fonts.map((font) => (
        <div key={font.role} className={styles.row}>
          <dt className={styles.family} data-font={font.role}>
            {font.family}
          </dt>
          <dd className={styles.detail}>
            <span className={styles.role}>{font.role}</span>
            <span className={styles.why}>{font.why}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
