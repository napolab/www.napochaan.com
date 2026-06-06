import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { WorkDetail } from './index';
import { richTextFromParagraphs } from '../../../_lib/sample-rich-text';

const work = {
  id: '7',
  no: '07',
  title: 'ALICE portrait series',
  type: 'graphic',
  year: 2024,
  thumbnail: { src: '/alice.jpg', width: 800, height: 800 },
  description: 'アバター ALICE のポートレートシリーズ。',
  body: richTextFromParagraphs(['アバター ALICE のポートレートシリーズ。']),
};

describe('WorkDetail', () => {
  it('renders the image with the title as alt text', async () => {
    const { container } = await render(<WorkDetail work={work} />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('ALICE portrait series');
  });

  it('renders the spec dl with type, year and no', async () => {
    await render(<WorkDetail work={work} />);

    await expect.element(page.getByText('graphic', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('2024', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('07', { exact: true })).toBeInTheDocument();
  });

  it('renders the rich-text body when present', async () => {
    await render(<WorkDetail work={work} />);

    await expect.element(page.getByText('アバター ALICE のポートレートシリーズ。')).toBeInTheDocument();
  });

  it('omits the body when absent', async () => {
    const noBody = { ...work, body: undefined };
    const { container } = await render(<WorkDetail work={noBody} />);

    expect(container.textContent).not.toContain('アバター ALICE のポートレートシリーズ。');
  });

  it('renders a placeholder block when there is no thumbnail', async () => {
    const noThumb = { ...work, thumbnail: undefined };
    const { container } = await render(<WorkDetail work={noThumb} />);

    expect(container.querySelector('img')).toBeNull();
  });
});
