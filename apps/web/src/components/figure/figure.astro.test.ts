import { describe, expect, it } from 'vitest';

import { formatBlurURL } from '@components/image/helper';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import FigureAstro from './figure.astro';
import { Figure } from './index';

const base = { src: '/m/a.jpg', alt: 'alt a', width: 640, height: 360, caption: 'cap', variant: 'cover' as const };
const cases = [
  { ...base, fit: 'intrinsic' as const },
  { ...base, sizes: '(min-width: 1388px) 500px, 66vw' },
];

describe('figure.astro', () => {
  it.each(cases)('renders the same markup as a zoomable Figure (%#)', async (props) => {
    const html = await renderComponent(FigureAstro, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(Figure, { ...props, zoomable: true, placeholder: 'blur' as const, blurDataURL: formatBlurURL(props.src, { blur: 20 }) }));
  });

  it('hydrates only the Lightbox', async () => {
    const html = await renderComponent(FigureAstro, { props: cases[0] });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['LightboxIsland']);
  });
});
