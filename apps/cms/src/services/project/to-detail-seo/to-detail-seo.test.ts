import { describe, expect, it } from 'vitest';

import { toDetailSeo } from '.';

describe('toDetailSeo', () => {
  it('returns undefined when meta is absent', () => {
    expect(toDetailSeo(undefined)).toBeUndefined();
  });

  it('returns undefined when every field is empty/null', () => {
    expect(toDetailSeo({ title: null, description: null, image: null })).toBeUndefined();
  });

  it('maps title and description, coercing NULL to undefined', () => {
    expect(toDetailSeo({ title: 'T', description: null })).toEqual({ title: 'T', description: undefined, image: undefined });
  });

  it('reads the url from a populated media image', () => {
    const meta = { image: { id: 1, alt: 'x', url: '/media/og.jpg', updatedAt: '', createdAt: '' } };
    expect(toDetailSeo(meta)?.image).toBe('/media/og.jpg');
  });

  it('drops an unpopulated numeric media image', () => {
    expect(toDetailSeo({ title: 'T', image: 5 })?.image).toBeUndefined();
  });

  it('drops a populated media whose url is null', () => {
    const meta = { title: 'T', image: { id: 1, alt: 'x', url: null, updatedAt: '', createdAt: '' } };
    expect(toDetailSeo(meta)?.image).toBeUndefined();
  });
});
