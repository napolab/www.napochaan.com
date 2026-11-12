import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { saveMediaFile } from './index';

import type { Media } from '@payload-types';

// Minimal Media factory — saveMediaFile only reads `filename` after its
// number/null guards, but the param is typed as the full Media, so satisfy the
// required fields without reaching for `any`.
const makeMedia = (filename: string | null | undefined): Media => ({
  id: 1,
  alt: 'alt text',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  filename,
});

const makeLogger = () => ({ info: vi.fn(), warn: vi.fn() });

const bytesOf = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe('saveMediaFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'save-media-file-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes the R2 object bytes to the assets dir when the file is absent', async () => {
    const logger = makeLogger();
    const get = vi.fn(async () => ({ arrayBuffer: async () => bytesOf('image-bytes') }));

    await saveMediaFile(makeMedia('photo.jpg'), dir, { get }, logger);

    const written = await readFile(path.join(dir, 'photo.jpg'), 'utf8');
    expect(written).toBe('image-bytes');
    expect(get).toHaveBeenCalledWith('photo.jpg');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('wrote photo.jpg'));
  });

  it('skips writing (and never reads R2) when the asset already exists', async () => {
    const logger = makeLogger();
    const get = vi.fn(async () => {
      throw new Error('bucket.get must not be called when the asset already exists');
    });
    await writeFile(path.join(dir, 'photo.jpg'), 'curated-bytes', 'utf8');

    await saveMediaFile(makeMedia('photo.jpg'), dir, { get }, logger);

    const onDisk = await readFile(path.join(dir, 'photo.jpg'), 'utf8');
    expect(onDisk).toBe('curated-bytes');
    expect(get).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('skip (exists) photo.jpg'));
  });

  it('warns and writes nothing when the media has no filename', async () => {
    const logger = makeLogger();
    const get = vi.fn(async () => ({ arrayBuffer: async () => bytesOf('image-bytes') }));

    await saveMediaFile(makeMedia(undefined), dir, { get }, logger);

    expect(get).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('no filename'));
  });

  it('warns and writes nothing when the R2 object is missing', async () => {
    const logger = makeLogger();
    const get = vi.fn(async () => null);

    await saveMediaFile(makeMedia('missing.jpg'), dir, { get }, logger);

    const exists = await readFile(path.join(dir, 'missing.jpg')).then(
      () => true,
      () => false,
    );
    expect(exists).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('R2 object not found for missing.jpg'));
  });

  it('returns without touching R2 for an unpopulated relationship (number id)', async () => {
    const logger = makeLogger();
    const get = vi.fn(async () => null);

    await saveMediaFile(42, dir, { get }, logger);

    expect(get).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
