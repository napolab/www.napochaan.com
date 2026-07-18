import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { FASTSTART_REQUIRED_MESSAGE, isISOBMFFVideoMimeType, resolveVideoUploadOutcome } from './index';

// Reuse the real fixtures from src/utils/mp4 rather than duplicating them —
// they're the ground truth for what a faststart vs. regular MP4 looks like.
const fixturePath = (name: string): string => path.join(import.meta.dirname, '../../utils/mp4/fixtures', name);

const readFixture = async (name: string): Promise<Uint8Array> => {
  const buffer = await readFile(fixturePath(name));
  return new Uint8Array(buffer);
};

describe('isISOBMFFVideoMimeType', () => {
  it('accepts video/mp4', () => {
    expect(isISOBMFFVideoMimeType('video/mp4')).toBe(true);
  });

  it('accepts video/quicktime', () => {
    expect(isISOBMFFVideoMimeType('video/quicktime')).toBe(true);
  });

  it('rejects non-ISOBMFF video containers like webm', () => {
    expect(isISOBMFFVideoMimeType('video/webm')).toBe(false);
  });

  it('rejects non-video mimetypes', () => {
    expect(isISOBMFFVideoMimeType('image/png')).toBe(false);
    expect(isISOBMFFVideoMimeType('application/pdf')).toBe(false);
  });
});

describe('resolveVideoUploadOutcome', () => {
  it('returns a patch with duration/width/height for a faststart mp4', async () => {
    const data = await readFixture('faststart.mp4');

    const outcome = resolveVideoUploadOutcome({ mimetype: 'video/mp4', data });

    expect(outcome.kind).toBe('patch');
    if (outcome.kind !== 'patch') return;
    expect(outcome.patch.duration).toBeCloseTo(2, 1);
    expect(outcome.patch.width).toBe(64);
    expect(outcome.patch.height).toBe(48);
  });

  it('rejects a regular (non-faststart) mp4 with the Japanese re-encode message', async () => {
    const data = await readFixture('regular.mp4');

    const outcome = resolveVideoUploadOutcome({ mimetype: 'video/mp4', data });

    expect(outcome).toEqual({ kind: 'reject', message: FASTSTART_REQUIRED_MESSAGE });
  });

  it('treats video/quicktime the same as video/mp4 (both ISOBMFF)', async () => {
    const data = await readFixture('regular.mp4');

    const outcome = resolveVideoUploadOutcome({ mimetype: 'video/quicktime', data });

    expect(outcome.kind).toBe('reject');
  });

  it('clears stale video metadata when a file is present but not an ISOBMFF container (e.g. webm), even with mp4 bytes', async () => {
    const data = await readFixture('regular.mp4');

    const outcome = resolveVideoUploadOutcome({ mimetype: 'video/webm', data });

    expect(outcome).toEqual({ kind: 'clear' });
  });

  it('clears stale video metadata when a file is present but is a non-video mimetype (e.g. an image upload)', () => {
    const outcome = resolveVideoUploadOutcome({ mimetype: 'image/png', data: new Uint8Array(0) });

    expect(outcome).toEqual({ kind: 'clear' });
  });

  it('is a no-op when there is no file on the request (metadata-only update must not wipe duration)', () => {
    const outcome = resolveVideoUploadOutcome(undefined);

    expect(outcome).toEqual({ kind: 'skip' });
  });
});
