import { css } from '@styled/css';

import { Link } from '@components/link';

// The design-system landing: an index of every component showcase. The route
// group keeps these out of the URL, so each entry lives at /components/<slug>.
// This page is the single linkable entry point into the catalog.
const slugs = [
  'badge',
  'breadcrumbs',
  'button',
  'card',
  'divider',
  'echo-text',
  'figure',
  'gallery',
  'game-of-life',
  'heading',
  'link',
  'list',
  'marquee',
  'page-header',
  'pagination',
  'rich-text',
  'scramble-text',
  'section-heading',
  'site-footer',
  'site-shell',
  'sys-bar',
  'system-annotation',
  'table',
  'tag',
  'timeline',
  'typography-band',
] as const;

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const lead = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
const grid = css({ display: 'grid', gridTemplateColumns: { base: '[repeat(2, 1fr)]', tablet: '[repeat(3, 1fr)]', desktop: '[repeat(4, 1fr)]' }, gap: 'element' });
const item = css({ fontFamily: 'mono', fontSize: 'sm' });

const ComponentsIndex = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>components</h1>
      <p className={lead}>{slugs.length} components — /components/&lt;name&gt;</p>
      <nav className={grid} aria-label="Component catalog">
        {slugs.map((slug) => (
          <Link key={slug} href={`/components/${slug}`} tone="default" className={item}>
            {slug}
          </Link>
        ))}
      </nav>
    </main>
  );
};

export default ComponentsIndex;
