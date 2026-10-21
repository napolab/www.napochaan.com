import { describe, expect, it } from 'vitest';

import { PRIVATE_POLICY } from '../../policies';
import { mcpPlugin } from './index';

describe('mcpPlugin', () => {
  it.each(['/mcp', '/mcp/', '/mcp/x'])('denies storage for %s', (pathname) => {
    expect(mcpPlugin.run(pathname)._unsafeUnwrap()).toBe(PRIVATE_POLICY);
  });

  it.each(['/mcpfoo', '/api/mcp', '/x/mcp', '/', '/%6Dcp'])('does not match %s', (pathname) => {
    expect(mcpPlugin.run(pathname).isErr()).toBe(true);
  });

  it('returns the pathname as the err value on a miss', () => {
    expect(mcpPlugin.run('/works')._unsafeUnwrapErr()).toBe('/works');
  });
});
