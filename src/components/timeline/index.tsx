import * as styles from './styles.css';

export type TimelineItem = {
  id: string;
  date: string;
  label: string;
  meta?: string;
  upcoming?: boolean;
};

type Props = {
  items: TimelineItem[];
};

export const Timeline = ({ items }: Props) => {
  return (
    <ol className={styles.root}>
      {items.map((item) => {
        const upcomingAttr = item.upcoming === true ? 'true' : undefined;
        return (
          <li key={item.id} data-testid={`timeline-item-${item.id}`} data-upcoming={upcomingAttr} className={styles.item}>
            <span className={styles.dot} aria-hidden="true" data-upcoming={upcomingAttr} />
            <span className={styles.date} data-upcoming={upcomingAttr}>
              {item.date}
            </span>
            <p className={styles.content}>
              <span className={styles.label} data-upcoming={upcomingAttr}>
                {item.label}
              </span>
              {item.meta !== undefined ? <span className={styles.meta}> / {item.meta}</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
};
