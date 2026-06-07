import { Link } from '@components/link';

import { paginationRange } from './pagination-range';
import * as styles from './styles.css';

type HrefFor = (page: number) => string;

type Props = {
  currentPage: number;
  totalPages: number;
  // Build the href for a page number. Injected so the consumer owns the URL shape
  // (?page=N, /page/N, …). A Server Component so the href function can be passed
  // straight from the RSC route without crossing a client boundary.
  href: HrefFor;
};

// Prev/next control. A discriminated union on `variant` instead of an `if`, so the
// switch is exhaustive and each variant carries exactly the data it needs.
type StepProps = { variant: 'link'; page: number; href: HrefFor; label: string; rel: string; glyph: string } | { variant: 'disabled'; label: string; glyph: string };

const Step = (props: StepProps) => {
  switch (props.variant) {
    case 'link':
      return (
        <Link href={props.href(props.page)} className={styles.step} aria-label={props.label} rel={props.rel} tone="muted" underline={false} fill={false}>
          {props.glyph}
        </Link>
      );
    case 'disabled':
      return (
        <span className={styles.step} aria-label={props.label} aria-disabled="true" data-disabled="true">
          {props.glyph}
        </span>
      );
  }
};

type PageLinkProps = {
  page: number;
  current: boolean;
  href: HrefFor;
};

const PageLink = ({ page, current, href }: PageLinkProps) => (
  <Link href={href(page)} className={styles.link} aria-current={current ? 'page' : undefined} data-current={current ? 'true' : undefined} tone="muted" underline={false} fill={false}>
    {page}
  </Link>
);

export const Pagination = ({ currentPage, totalPages, href }: Props) => {
  const items = paginationRange(currentPage, totalPages);

  const prev: StepProps = currentPage > 1 ? { variant: 'link', page: currentPage - 1, href, label: '前のページ', rel: 'prev', glyph: '‹' } : { variant: 'disabled', label: '前のページ', glyph: '‹' };
  const next: StepProps =
    currentPage < totalPages ? { variant: 'link', page: currentPage + 1, href, label: '次のページ', rel: 'next', glyph: '›' } : { variant: 'disabled', label: '次のページ', glyph: '›' };

  return (
    <nav aria-label="ページネーション" className={styles.root}>
      <Step {...prev} />

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          // Ellipses are positional, so the surrounding index disambiguates the key.
          <span key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
            …
          </span>
        ) : (
          <PageLink key={item} page={item} current={item === currentPage} href={href} />
        ),
      )}

      <Step {...next} />
    </nav>
  );
};
