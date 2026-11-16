import { describe, expect, it } from 'vitest';

import { discoveryJSONResponse } from './index';

describe('discoveryJSONResponse', () => {
  it('serializes the body as application/json with open CORS by default', async () => {
    const res = discoveryJSONResponse({ a: 1 });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.text()).toBe('{"a":1}');
  });

  it('takes a more specific media type', () => {
    expect(discoveryJSONResponse({}, 'application/ai-catalog+json').headers.get('content-type')).toBe('application/ai-catalog+json');
  });
});
