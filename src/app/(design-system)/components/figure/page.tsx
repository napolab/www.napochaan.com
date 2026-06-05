import { css } from '@styled/css';

import { Figure } from '@components/figure';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'flex-start', flexWrap: 'wrap' });

const FigureShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Figure</h1>
      <section className={row} aria-label="Image without caption">
        <Figure src="/placeholder.jpg" alt="event flyer" width={200} height={280} />
      </section>
      <section className={row} aria-label="Image with caption">
        <Figure src="/placeholder.jpg" alt="night vol.13 flyer" width={200} height={280} caption="night vol.13 — 2024.03.15" />
        <Figure src="/placeholder.jpg" alt="techno set visual" width={160} height={160} caption="techno set @ club metro" />
      </section>
    </main>
  );
};

export default FigureShowcase;
