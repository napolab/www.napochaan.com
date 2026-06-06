import { css } from '@styled/css';

import { Pagination } from '@components/pagination';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });

// The consumer owns the URL shape; Pagination owns layout, styling, a11y and
// (via react-aria Link) routing.
const href = (page: number): string => (page <= 1 ? '/works' : `/works?page=${page}`);

const PaginationShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Pagination</h1>

      <section aria-label="Few pages — no ellipsis">
        <p className={caption}>5 pages, current 3 — every page visible</p>
        <Pagination currentPage={3} totalPages={5} href={href} />
      </section>

      <section aria-label="Many pages — current in the middle">
        <p className={caption}>20 pages, current 10 — ellipses on both sides</p>
        <Pagination currentPage={10} totalPages={20} href={href} />
      </section>

      <section aria-label="First page — prev disabled">
        <p className={caption}>20 pages, current 1 — prev step disabled</p>
        <Pagination currentPage={1} totalPages={20} href={href} />
      </section>

      <section aria-label="Last page — next disabled">
        <p className={caption}>20 pages, current 20 — next step disabled</p>
        <Pagination currentPage={20} totalPages={20} href={href} />
      </section>
    </main>
  );
};

export default PaginationShowcase;
