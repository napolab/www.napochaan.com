import { css } from '@styled/css';

import { Marquee } from '@components/marquee';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: 'element' });

const MarqueeShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Marquee</h1>
      <section aria-label="Examples">
        <div className={stack}>
          <Marquee>napochaan ✕ graphic · digital · since 2020 · </Marquee>
          <Marquee reverse>napochaan ✕ graphic · digital · since 2020 · </Marquee>
        </div>
        <p className={caption}>Horizontal repeating band — seamless 2-track loop. Reverse direction available. Pauses at prefers-reduced-motion.</p>
      </section>
    </main>
  );
};

export default MarqueeShowcase;
