import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { RelatedWorks } from './index';

const works = [
  { id: '4', no: '04', title: 'neon grid flyer', type: 'flyer', year: 2023 },
  { id: '8', no: '08', title: 'night graphics', type: 'flyer', year: 2024, thumbnail: { src: '/n.jpg', width: 80, height: 80 } },
];

describe('RelatedWorks', () => {
  it('renders a heading', async () => {
    await render(<RelatedWorks works={works} />);

    await expect.element(page.getByRole('heading', { name: /related/i })).toBeInTheDocument();
  });

  it('renders each related work as a link to /works/{id}', async () => {
    await render(<RelatedWorks works={works} />);

    const link = page.getByRole('link', { name: /neon grid flyer/ });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works/4');
  });

  it('labels the thumbnail with the work title', async () => {
    const { container } = await render(<RelatedWorks works={works} />);

    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('night graphics');
  });
});
