import { Link } from '@components/link';
import { clsx } from '@utils/clsx';
import { isExternal } from '@utils/is-external';

import * as styles from './styles.css';

export type TimelineItem = {
  id: string;
  date: string;
  label: string;
  meta?: string;
  upcoming?: boolean;
  // Where the title links. Absolute http(s) URLs open in a new tab; everything
  // else is treated as an internal route. Omit to render the title as plain text.
  href?: string;
};

type Props = {
  items: TimelineItem[];
};

// The title cell. `tone="inherit"` keeps the timeline's own label colour (which
// carries the data-upcoming accent), so the link only adds the underline
// affordance — matching the underlined title links in the works/news archives.
const Label = ({ label, upcoming, href }: { label: string; upcoming?: string; href?: string }) => {
  if (href === undefined) {
    return (
      <span className={styles.label} data-upcoming={upcoming}>
        {label}
      </span>
    );
  }

  const external = isExternal(href);

  return (
    <Link
      href={href}
      tone="inherit"
      className={clsx(styles.label, styles.labelLink)}
      data-upcoming={upcoming}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {label}
      {external ? (
        <span className={styles.externalMark} aria-hidden="true">
          ↗
        </span>
      ) : null}
    </Link>
  );
};

export const Timeline = ({ items }: Props) => {
  return (
    <ol className={styles.root}>
      {items.map((item) => {
        const upcomingAttr = item.upcoming === true ? 'true' : undefined;
        return (
          <li key={item.id} data-testid={`timeline-item-${item.id}`} data-upcoming={upcomingAttr} className={styles.item}>
            <span className={styles.date} data-upcoming={upcomingAttr}>
              <span className={styles.dot} aria-hidden="true" data-upcoming={upcomingAttr} />
              {item.date}
            </span>
            <p className={styles.content}>
              <Label label={item.label} upcoming={upcomingAttr} href={item.href} />
              {item.meta !== undefined ? <span className={styles.meta}> / {item.meta}</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
};
