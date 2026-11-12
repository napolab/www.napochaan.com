import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublishedPurgeHooks, isPublished, isPublishedChange, purgeOnChange } from '.';
import { requestWebPurge } from './request-web-purge';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload';

vi.mock('./request-web-purge', () => ({ requestWebPurge: vi.fn() }));

const requestWebPurgeMock = vi.mocked(requestWebPurge);

// Minimal PayloadRequest stand-in: the hooks only read `req.context`.
const makeReq = (context: Record<string, unknown> = {}): PayloadRequest => ({ context }) as unknown as PayloadRequest;

type ChangeArgs = Parameters<CollectionAfterChangeHook>[0];
type DeleteArgs = Parameters<CollectionAfterDeleteHook>[0];

beforeEach(() => {
  requestWebPurgeMock.mockReset();
});

describe('isPublished', () => {
  it('returns true for a published doc', () => {
    expect(isPublished({ _status: 'published' })).toBe(true);
  });

  it('returns false for a draft doc', () => {
    expect(isPublished({ _status: 'draft' })).toBe(false);
  });

  it('returns false for a status-less / nullish doc', () => {
    expect(isPublished({})).toBe(false);
    expect(isPublished(null)).toBe(false);
    expect(isPublished(undefined)).toBe(false);
  });
});

describe('isPublishedChange', () => {
  it('is true when the new doc is published', () => {
    expect(isPublishedChange({ _status: 'published' }, { _status: 'draft' })).toBe(true);
  });

  it('is true when the previous doc was published (unpublish/delete)', () => {
    expect(isPublishedChange({ _status: 'draft' }, { _status: 'published' })).toBe(true);
  });

  it('is false when neither is published', () => {
    expect(isPublishedChange({ _status: 'draft' }, { _status: 'draft' })).toBe(false);
  });
});

describe('createPublishedPurgeHooks', () => {
  it('purges once for a published change and returns the doc', () => {
    const doc = { id: 1, _status: 'published' };
    const result = createPublishedPurgeHooks().afterChange({ doc, previousDoc: { _status: 'draft' }, req: makeReq() } as unknown as ChangeArgs);

    expect(requestWebPurgeMock).toHaveBeenCalledOnce();
    expect(result).toBe(doc);
  });

  it('purges for an unpublish (previous doc was published)', () => {
    createPublishedPurgeHooks().afterChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' }, req: makeReq() } as unknown as ChangeArgs);
    expect(requestWebPurgeMock).toHaveBeenCalledOnce();
  });

  it('does NOT purge for a draft-only change', () => {
    createPublishedPurgeHooks().afterChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'draft' }, req: makeReq() } as unknown as ChangeArgs);
    expect(requestWebPurgeMock).not.toHaveBeenCalled();
  });

  it('does NOT purge when req.context.disableRevalidate is true', () => {
    createPublishedPurgeHooks().afterChange({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' }, req: makeReq({ disableRevalidate: true }) } as unknown as ChangeArgs);
    expect(requestWebPurgeMock).not.toHaveBeenCalled();
  });

  it('purges on delete only when the doc was published', () => {
    const hooks = createPublishedPurgeHooks();
    hooks.afterDelete({ doc: { _status: 'draft' }, req: makeReq() } as unknown as DeleteArgs);
    expect(requestWebPurgeMock).not.toHaveBeenCalled();

    hooks.afterDelete({ doc: { _status: 'published' }, req: makeReq() } as unknown as DeleteArgs);
    expect(requestWebPurgeMock).toHaveBeenCalledOnce();
  });

  it('does NOT purge on delete when disableRevalidate is true', () => {
    createPublishedPurgeHooks().afterDelete({ doc: { _status: 'published' }, req: makeReq({ disableRevalidate: true }) } as unknown as DeleteArgs);
    expect(requestWebPurgeMock).not.toHaveBeenCalled();
  });
});

describe('purgeOnChange', () => {
  it('purges and returns the doc, for collections/globals without drafts', () => {
    const doc = { id: 1 };
    expect(purgeOnChange({ doc, req: makeReq() } as unknown as ChangeArgs)).toBe(doc);
    expect(requestWebPurgeMock).toHaveBeenCalledOnce();
  });

  it('respects disableRevalidate', () => {
    purgeOnChange({ doc: {}, req: makeReq({ disableRevalidate: true }) } as unknown as ChangeArgs);
    expect(requestWebPurgeMock).not.toHaveBeenCalled();
  });
});
