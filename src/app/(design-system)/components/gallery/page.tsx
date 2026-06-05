import { css } from '@styled/css';

import { Gallery } from '@components/gallery';

import flyerBooth0424 from '../../_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../../_assets/flyer-booth-0523.jpg';
import vrchatAlice from '../../_assets/vrchat-alice.jpg';
import vrchatGlitch from '../../_assets/vrchat-glitch.jpg';
import vrchatSquare from '../../_assets/vrchat-square.jpg';
import vrchatWide from '../../_assets/vrchat-wide.jpg';

import type { GalleryItem } from '@components/gallery';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', mb: '4', letterSpacing: 'wide', textTransform: 'uppercase' });

const items: GalleryItem[] = [
  { id: '1', src: flyerBooth0424.src, alt: 'Booth² 2026.04.24 イベントフライヤー', width: flyerBooth0424.width, height: flyerBooth0424.height, span: 'portrait' },
  { id: '2', src: vrchatWide.src, alt: 'VRChat ライブ会場の光跡ショット', width: vrchatWide.width, height: vrchatWide.height, span: 'wide' },
  { id: '3', src: vrchatSquare.src, alt: 'VRChat アバターのフレーミングポーズ', width: vrchatSquare.width, height: vrchatSquare.height, span: 'square' },
  { id: '4', src: flyerBooth0523.src, alt: 'Booth² 2026.05.23 イベントフライヤー', width: flyerBooth0523.width, height: flyerBooth0523.height, span: 'tall' },
  { id: '5', src: vrchatGlitch.src, alt: 'VRChat アバターのグリッチビジュアル', width: vrchatGlitch.width, height: vrchatGlitch.height, span: 'portrait' },
  { id: '6', src: vrchatAlice.src, alt: 'VRChat アバター ALICE ポートレート', width: vrchatAlice.width, height: vrchatAlice.height, span: 'square' },
];

const GalleryShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Gallery</h1>
      <section aria-label="Photo grid">
        <p className={caption}>grid-snap variable-span — click any image to open lightbox</p>
        <Gallery items={items} />
      </section>
    </main>
  );
};

export default GalleryShowcase;
