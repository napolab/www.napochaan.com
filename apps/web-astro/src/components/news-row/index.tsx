import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { Tag } from '@components/tag';
import { isExternal } from '@utils/is-external';

import * as styles from './styles.css';

type Props = {
  // Display-ready date string — the caller formats it (the home feed passes a
  // pre-formatted string; the archive formats with dayjs before rendering).
  date: string;
  category: string;
  title: string;
  // Where the title links. Absolute http(s) URLs open in a new tab; everything
  // else is an internal route. Omit to render the title as plain (non-link) text.
  href?: string;
};

const NewsRowTitle = ({ title, href }: { title: string; href?: string }) => {
  if (href === undefined) return <span className={styles.title}>{title}</span>;

  const external = isExternal(href);

  // The ↗ rides inside ScrambleText as a trailing slot so it tucks against the last
  // wrapped line of the title — as a sibling of the atomic inline-block scramble box
  // it would orphan onto its own line whenever the title wraps.
  const externalMark = external ? (
    <span className={styles.externalMark} aria-hidden="true">
      ↗
    </span>
  ) : undefined;

  return (
    <Link href={href} tone="accent" className={styles.titleLink} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      <ScrambleText trailing={externalMark}>{title}</ScrambleText>
    </Link>
  );
};

// A single news row — date · category tag · title — laid out across the parent
// list's three subgrid columns. Shared by the home news feed and the /news
// archive. A Server Component; the only client islands are the title's Link and
// ScrambleText (which decodes the title on hover).
export const NewsRow = ({ date, category, title, href }: Props) => {
  return (
    <li className={styles.root}>
      <span className={styles.date}>{date}</span>
      <span className={styles.category}>
        <Tag tone="outline">{category}</Tag>
      </span>
      <NewsRowTitle title={title} href={href} />
    </li>
  );
};
