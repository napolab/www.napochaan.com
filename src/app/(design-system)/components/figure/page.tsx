import { css } from '@styled/css';

import { Figure } from '@components/figure';

import flyerBooth0424 from '../../_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../../_assets/flyer-booth-0523.jpg';
import vrchatSquare from '../../_assets/vrchat-square.jpg';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'flex-start', flexWrap: 'wrap' });

const FigureShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Figure</h1>
      <section className={row} aria-label="Image without caption">
        <Figure src={vrchatSquare.src} alt="VRChat アバターのフレーミングポーズ" width={200} height={200} />
      </section>
      <section className={row} aria-label="Image with caption">
        <Figure src={flyerBooth0424.src} alt="Booth² 2026.04.24 イベントフライヤー" width={200} height={356} caption="Booth² — 2026.04.24 (FRI) @ VRChat" />
        <Figure src={flyerBooth0523.src} alt="Booth² 2026.05.23 イベントフライヤー" width={200} height={356} caption="Booth² — 2026.05.23 (SAT) @ VRChat" />
      </section>
    </main>
  );
};

export default FigureShowcase;
