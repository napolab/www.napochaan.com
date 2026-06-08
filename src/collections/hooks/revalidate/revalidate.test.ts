import { revalidateTag } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublishedTagRevalidateHooks, createTagRevalidateHooks, isPublished, isPublishedChange } from '.';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const revalidateTagMock = vi.mocked(revalidateTag);

// Minimal PayloadRequest stand-in: the hooks only read `req.context`.
const makeReq = (context: Record<string, unknown> = {}): PayloadRequest => ({ context }) as unknown as PayloadRequest;

type ChangeArgs = Parameters<CollectionAfterChangeHook>[0];
type DeleteArgs = Parameters<CollectionAfterDeleteHook>[0];

beforeEach(() => {
  revalidateTagMock.mockReset();
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

describe('createTagRevalidateHooks', () => {
  it('dispatches every tag on change', () => {
    const hooks = createTagRevalidateHooks(['news']);
    const doc = { id: 1 };
    const result = hooks.afterChange({ doc, req: makeReq() } as unknown as ChangeArgs);

    expect(revalidateTagMock).toHaveBeenCalledWith('news');
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(doc);
  });

  it('dispatches every tag on delete', () => {
    const hooks = createTagRevalidateHooks(['news']);
    hooks.afterDelete({ doc: { id: 1 }, req: makeReq() } as unknown as DeleteArgs);

    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});

describe('createPublishedTagRevalidateHooks', () => {
  it('does NOT dispatch for a draft-only change', () => {
    const hooks = createPublishedTagRevalidateHooks(['news']);
    hooks.afterChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'draft' }, req: makeReq() } as unknown as ChangeArgs);

    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('DOES dispatch for a published change', () => {
    const hooks = createPublishedTagRevalidateHooks(['news']);
    hooks.afterChange({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' }, req: makeReq() } as unknown as ChangeArgs);

    expect(revalidateTagMock).toHaveBeenCalledWith('news');
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });

  it('suppresses dispatch when req.context.disableRevalidate is true', () => {
    const hooks = createPublishedTagRevalidateHooks(['news']);
    hooks.afterChange({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' }, req: makeReq({ disableRevalidate: true }) } as unknown as ChangeArgs);

    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('dispatches on delete only when the doc was published', () => {
    const hooks = createPublishedTagRevalidateHooks(['news']);
    hooks.afterDelete({ doc: { _status: 'draft' }, req: makeReq() } as unknown as DeleteArgs);
    expect(revalidateTagMock).not.toHaveBeenCalled();

    hooks.afterDelete({ doc: { _status: 'published' }, req: makeReq() } as unknown as DeleteArgs);
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
  });
});
