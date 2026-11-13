import { describe, expect, it } from 'vitest';

import { rssResponse } from './index';

describe('rssResponse', () => {
  it('serves the document as application/rss+xml with a charset', async () => {
    const res = rssResponse('<rss/>');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(await res.text()).toBe('<rss/>');
  });
});
