import { css } from '@styled/css';

import { Breadcrumbs } from '@components/breadcrumbs';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });

const basicItems = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }] as const;
const singleItems = [{ href: '/', label: 'home' }, { label: 'about' }] as const;
const deepItems = [{ href: '/', label: 'home' }, { href: '/events', label: 'events' }, { href: '/events/2024', label: '2024' }, { label: 'night vol.13' }] as const;

const BreadcrumbsShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Breadcrumbs</h1>
      <section aria-label="Basic navigation trail">
        <Breadcrumbs items={basicItems} />
      </section>
      <section aria-label="Single level navigation">
        <Breadcrumbs items={singleItems} />
      </section>
      <section aria-label="Deep navigation trail">
        <Breadcrumbs items={deepItems} />
      </section>
    </main>
  );
};

export default BreadcrumbsShowcase;
