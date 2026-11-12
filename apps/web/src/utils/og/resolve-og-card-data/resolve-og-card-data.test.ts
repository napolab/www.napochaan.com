import { describe, expect, it } from 'vitest';

import { resolveOgCardData } from './index';

describe('resolveOgCardData', () => {
  it('uppercases the label and clamps the title into chunks', () => {
    const data = resolveOgCardData({ section: 'news', title: 'サイトを v3 にリニューアルしました', meta: '2026.06.11' });
    expect(data.label).toBe('NEWS');
    expect(data.title.chunks.length).toBeGreaterThan(0);
    expect(data.meta).toBe('2026.06.11');
  });

  it('flags hasImage when a non-empty image url is present', () => {
    const withImage = resolveOgCardData({ section: 'works', title: 'X', meta: 'm', imageUrl: 'https://r2/x.jpg' });
    expect(withImage.hasImage).toBe(true);
    expect(withImage.imageUrl).toBe('https://r2/x.jpg');
  });

  it('treats an empty/absent image url as no image', () => {
    expect(resolveOgCardData({ section: 'news', title: 'X', meta: 'm', imageUrl: '' }).hasImage).toBe(false);
    expect(resolveOgCardData({ section: 'news', title: 'X', meta: 'm' }).hasImage).toBe(false);
  });
});
