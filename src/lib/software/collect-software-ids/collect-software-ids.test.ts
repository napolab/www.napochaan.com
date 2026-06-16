import { describe, expect, it } from 'vitest';

import { collectSoftwareIds, referenceId } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = (children: unknown[]): SerializedEditorState => ({ root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } }) as unknown as SerializedEditorState;

const block = (software: unknown) => ({ type: 'block', fields: { blockType: 'software-download', software }, version: 1 });

describe('collectSoftwareIds', () => {
  it('returns [] for undefined body', () => {
    expect(collectSoftwareIds(undefined)).toEqual([]);
  });

  it('extracts ids from populated relationship objects', () => {
    expect(collectSoftwareIds(body([block({ id: 5 })]))).toEqual(['5']);
  });

  it('extracts ids from raw numeric/string references', () => {
    expect(collectSoftwareIds(body([block(7), block('8')]))).toEqual(['7', '8']);
  });

  it('dedupes and ignores non-software blocks', () => {
    expect(collectSoftwareIds(body([block(5), block(5), { type: 'block', fields: { blockType: 'image-row' }, version: 1 }]))).toEqual(['5']);
  });
});

describe('referenceId', () => {
  it('normalizes number, string, and populated-object refs to a string id', () => {
    expect(referenceId(5)).toBe('5');
    expect(referenceId('6')).toBe('6');
    expect(referenceId({ id: 7 })).toBe('7');
    expect(referenceId({})).toBeUndefined();
    expect(referenceId(null)).toBeUndefined();
  });
});
