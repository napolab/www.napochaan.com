import { describe, expect, it } from 'vitest';

import { readField, readValues } from './index';

const formOf = (entries: Record<string, string | Blob>): FormData => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.append(key, value);

  return formData;
};

describe('readField', () => {
  it('returns a string field', () => {
    expect(readField(formOf({ name: 'napo' }), 'name')).toBe('napo');
  });

  it('returns an empty string for a missing or file field', () => {
    expect(readField(formOf({}), 'name')).toBe('');
    expect(readField(formOf({ name: new Blob(['x']) }), 'name')).toBe('');
  });
});

describe('readValues', () => {
  it('picks name / email / message', () => {
    expect(readValues(formOf({ name: 'a', email: 'b@example.com', message: 'c', other: 'x' }))).toEqual({ name: 'a', email: 'b@example.com', message: 'c' });
  });
});
