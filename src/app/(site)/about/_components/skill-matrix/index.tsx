import { TagCloud } from '../tag-cloud';

import * as styles from './styles.css';

type Props = {
  groups: readonly { category: string; items: readonly string[] }[];
};

// The skill inventory as a category matrix: a <dl> where each category label
// (dt) leads a row of outline code-chips (dd, via the shared TagCloud). No
// heading element here — the section's "05 skill" SectionHeading is the heading,
// so a dl avoids an h2→h3 skip while still pairing label with its chips.
export const SkillMatrix = ({ groups }: Props) => {
  return (
    <dl className={styles.root}>
      {groups.map((group) => (
        <div key={group.category} className={styles.row}>
          <dt className={styles.term}>{group.category}</dt>
          <dd className={styles.description}>
            <TagCloud items={group.items} />
          </dd>
        </div>
      ))}
    </dl>
  );
};
