import { SectionHeading } from '@components/section-heading';
import { Tag } from '@components/tag';

import * as styles from './styles.css';

type Props = {
  id?: string;
  skills: string[];
  now: string;
  likes: string;
  wants: string;
};

export const AboutWhoami = ({ id, skills, now, likes, wants }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="00">about</SectionHeading>
      <div className={styles.who}>
        <p className={styles.prompt}>$ whoami</p>
        <p className={styles.row}>
          <span className={styles.key}>skills</span>
          <span className={styles.pills}>
            {skills.map((skill) => (
              <Tag key={skill} tone="blue">
                {skill}
              </Tag>
            ))}
          </span>
        </p>
        <p className={styles.row}>
          <span className={styles.key}>now</span>
          <span className={styles.value}>{now}</span>
        </p>
        <p className={styles.row}>
          <span className={styles.key}>likes</span>
          <span className={styles.value}>{likes}</span>
        </p>
        <p className={styles.row}>
          <span className={styles.key}>wants</span>
          <span className={styles.value}>{wants}</span>
        </p>
      </div>
    </section>
  );
};
