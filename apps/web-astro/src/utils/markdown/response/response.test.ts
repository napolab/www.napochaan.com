import { describe, expect, it } from 'vitest';

import { markdownResponse, notFoundResponse } from '.';

describe('markdownResponse', () => {
  it('returns 200 with text/markdown content-type and the given body', async () => {
    const res = markdownResponse('# hi\n');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe('# hi\n');
  });
});

describe('notFoundResponse', () => {
  it('returns 404 text/plain Not Found', async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Not Found');
  });
});
