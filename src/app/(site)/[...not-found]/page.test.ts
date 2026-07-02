import { describe, expect, it } from 'vitest';

import CatchAllNotFound from './page';

describe('CatchAllNotFound', () => {
  it('throws the Next.js notFound error (digest NEXT_HTTP_ERROR_FALLBACK;404)', () => {
    expect(() => CatchAllNotFound()).toThrowError('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});
