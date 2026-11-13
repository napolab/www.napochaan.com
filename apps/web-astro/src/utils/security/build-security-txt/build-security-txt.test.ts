import { describe, expect, it } from 'vitest';

import { dayjs } from '@utils/dayjs';

import { buildSecurityTxt } from './index';

const now = dayjs('2026-06-12T00:00:00Z');

describe('buildSecurityTxt', () => {
  it('exposes the contact as a mailto Contact field (RFC 9116)', () => {
    const text = buildSecurityTxt({ contactEmail: 'contact@napochaan.com', now });
    expect(text).toContain('Contact: mailto:contact@napochaan.com');
  });

  it('sets an Expires field in the future, under a year out', () => {
    const text = buildSecurityTxt({ contactEmail: 'contact@napochaan.com', now });
    const line = text.split('\n').find((row) => row.startsWith('Expires:'));
    expect(line).toBeDefined();
    const expires = dayjs(`${line}`.replace('Expires: ', ''));
    expect(expires.isAfter(now)).toBe(true);
    expect(expires.isBefore(now.add(1, 'year'))).toBe(true);
  });

  it('declares preferred languages', () => {
    const text = buildSecurityTxt({ contactEmail: 'contact@napochaan.com', now });
    expect(text).toContain('Preferred-Languages: ja, en');
  });

  it('ends with a trailing newline', () => {
    const text = buildSecurityTxt({ contactEmail: 'contact@napochaan.com', now });
    expect(text.endsWith('\n')).toBe(true);
  });
});
