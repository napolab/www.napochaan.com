import { css } from '@styled/css';

import { SiteFooter } from '@components/site-footer';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: 'element' });

const SiteFooterShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>SiteFooter</h1>
      <section aria-label="Examples">
        <div className={stack}>
          <SiteFooter />
          <SiteFooter buildId="abc1234" />
        </div>
        <p className={caption}>System status bar footer — contentinfo landmark. Displays copyright on the left and build ID + life status on the right. Uses mono font at xs size.</p>
      </section>
    </main>
  );
};

export default SiteFooterShowcase;
