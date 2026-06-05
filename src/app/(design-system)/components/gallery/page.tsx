import { css } from '@styled/css';

import { Gallery } from '@components/gallery';

import type { GalleryItem } from '@components/gallery';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', mb: '4', letterSpacing: 'wide', textTransform: 'uppercase' });

const items: GalleryItem[] = [
  { id: '1', src: '/placeholder-flyer.jpg', alt: 'night vol.19 flyer', width: 400, height: 600, span: 'portrait' },
  { id: '2', src: '/placeholder-stage.jpg', alt: 'stage overview wide shot', width: 800, height: 450, span: 'wide' },
  { id: '3', src: '/placeholder-crowd.jpg', alt: 'crowd energy square', width: 400, height: 400, span: 'square' },
  { id: '4', src: '/placeholder-booth.jpg', alt: 'DJ booth portrait', width: 400, height: 600, span: 'tall' },
  { id: '5', src: '/placeholder-venue.jpg', alt: 'venue exterior wide', width: 800, height: 450, span: 'wide' },
  { id: '6', src: '/placeholder-vinyl.jpg', alt: 'vinyl detail square', width: 400, height: 400, span: 'square' },
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
