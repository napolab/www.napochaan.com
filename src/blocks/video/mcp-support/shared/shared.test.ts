import { describe, expect, it } from 'vitest';

import { attrValue, bodyMediaIDOf, posterIDOf, propsOf } from '.';

describe('propsOf', () => {
  it('extracts the unquoted props string from a fence start line', () => {
    expect(propsOf('```video variant=player poster=media:5\n![media:79]()\n```')).toBe('variant=player poster=media:5');
  });

  it('returns an empty string when the start line has no props', () => {
    expect(propsOf('```video\n![media:79]()\n```')).toBe('');
  });
});

describe('attrValue', () => {
  it('finds a key=value pair among whitespace-separated tokens', () => {
    expect(attrValue('variant=player poster=media:5', 'poster')).toBe('media:5');
  });

  it('returns undefined when the key is absent', () => {
    expect(attrValue('variant=player', 'poster')).toBeUndefined();
  });

  it('preserves "=" characters within the value', () => {
    expect(attrValue('foo=a=b', 'foo')).toBe('a=b');
  });
});

describe('bodyMediaIDOf', () => {
  it('returns the id for a single valid media line', () => {
    expect(bodyMediaIDOf('![media:79]()')).toBe(79);
  });

  it('returns undefined for an empty body', () => {
    expect(bodyMediaIDOf('')).toBeUndefined();
  });

  it('returns undefined for more than one body line', () => {
    expect(bodyMediaIDOf('![media:79]()\n![media:78]()')).toBeUndefined();
  });

  it('returns undefined for a non-media body line', () => {
    expect(bodyMediaIDOf('not a media line')).toBeUndefined();
  });
});

describe('posterIDOf', () => {
  it('returns the id for a valid poster=media:<id> attribute', () => {
    expect(posterIDOf('variant=player poster=media:5')).toBe(5);
  });

  it('returns undefined when there is no poster attribute', () => {
    expect(posterIDOf('variant=player')).toBeUndefined();
  });

  it('returns undefined for a malformed poster value', () => {
    expect(posterIDOf('variant=player poster=notmedia')).toBeUndefined();
  });
});
