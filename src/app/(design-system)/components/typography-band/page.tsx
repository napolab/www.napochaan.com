import { css } from '@styled/css';

import { TypographyBand } from '@components/typography-band';

const wrap = css({ position: 'relative', zIndex: 'dropdown', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });

const TypographyBandShowcase = () => {
  return (
    <>
      <TypographyBand />
      <main className={wrap}>
        <h1 className={heading}>TypographyBand</h1>
        <section aria-label="Preview">
          <p className={caption}>
            A fixed 4-edge frame (top, bottom, left, right) at 24px width — one design-grid module. Each band renders a duplicated text track that scrolls in response to page scroll velocity, then
            drifts gently at idle. Top and left run forward; bottom and right run in reverse for a rotation effect. prefers-reduced-motion: stops all animation. All bands are aria-hidden and
            pointer-events:none — purely decorative.
          </p>
        </section>
      </main>
    </>
  );
};

export default TypographyBandShowcase;
