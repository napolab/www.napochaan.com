import { describe, expect, it } from 'vitest';

import { resolveCSP } from './index';

const FRAME_ANCESTORS = "frame-ancestors 'self'";

describe('resolveCSP', () => {
  it('uses frame-ancestors alone when there is no upstream CSP', () => {
    expect(resolveCSP(null, FRAME_ANCESTORS)).toBe("frame-ancestors 'self'");
  });

  it('uses frame-ancestors alone when the upstream CSP is blank', () => {
    expect(resolveCSP('  ', FRAME_ANCESTORS)).toBe("frame-ancestors 'self'");
  });

  it('appends frame-ancestors to an upstream CSP that lacks it', () => {
    expect(resolveCSP("default-src 'self'", FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'self'");
    expect(resolveCSP("default-src 'self';", FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'self'");
  });

  it('leaves an upstream CSP that already has frame-ancestors', () => {
    expect(resolveCSP("default-src 'self'; frame-ancestors 'none'", FRAME_ANCESTORS)).toBe("default-src 'self'; frame-ancestors 'none'");
  });
});
