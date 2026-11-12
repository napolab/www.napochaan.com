import { describe, expect, it } from 'vitest';

import { CURSOR_COLORS, deriveIdentity, hashIp } from './identity';

describe('identity', () => {
  it('derives a stable label and a palette color from a uid', () => {
    const a = deriveIdentity('a3f29b10c4d5e6f7');
    expect(a.label).toBe('#a3f2');
    expect(CURSOR_COLORS).toContain(a.color);
    expect(deriveIdentity('a3f29b10c4d5e6f7')).toEqual(a);
  });

  it('hashIp is deterministic for same ip+salt and differs across ips', async () => {
    const u1 = await hashIp('203.0.113.5', 'salt');
    const u2 = await hashIp('203.0.113.5', 'salt');
    const u3 = await hashIp('203.0.113.9', 'salt');
    expect(u1).toBe(u2);
    expect(u1).not.toBe(u3);
    expect(u1).toHaveLength(16);
  });
});
