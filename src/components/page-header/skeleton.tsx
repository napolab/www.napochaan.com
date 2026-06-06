import * as styles from './styles.css';

type Props = {
  breadcrumbs?: readonly string[];
  kicker?: string;
  title?: string;
  lead?: string;
};

type SlotProps = {
  className: string;
  text?: string;
};

// A single placeholder slot. Known-text mode (`text` provided) masks the real
// text so the box reserves its exact width + height with zero JS. Bar mode
// (`text` omitted) renders an empty one-line box at a percentage width.
const Slot = ({ className, text }: SlotProps) => {
  if (text === undefined) return <span className={className} data-mode="bar" />;
  return <span className={className}>{text}</span>;
};

// Pure, hook-free loading placeholder for PageHeader. Mirrors the header's
// stacked rhythm (breadcrumb, kicker, title, lead, bottom rule) to prevent CLS
// when the real header replaces it. Decorative only — hidden from assistive tech.
export const PageHeaderSkeleton = ({ breadcrumbs, kicker, title, lead }: Props) => {
  return (
    <div className={styles.skeletonRoot} aria-hidden="true">
      <Slot className={styles.skeletonBreadcrumb} text={breadcrumbs?.join(' / ')} />
      <Slot className={styles.skeletonKicker} text={kicker} />
      <Slot className={styles.skeletonTitle} text={title} />
      <Slot className={styles.skeletonLead} text={lead} />
    </div>
  );
};
