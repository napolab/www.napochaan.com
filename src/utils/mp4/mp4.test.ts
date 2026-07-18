import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseMP4Meta } from './index';

const fixturePath = (name: string): string => path.join(import.meta.dirname, 'fixtures', name);

const readFixture = async (name: string): Promise<Uint8Array> => {
  const buffer = await readFile(fixturePath(name));
  return new Uint8Array(buffer);
};

// ===== synthetic ISOBMFF box builders (for hand-crafted byte-level tests) =====

const u32 = (value: number): readonly number[] => [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];

// `low` must fit in 32 bits — these tests never need the high word to be
// non-zero (the parser bails to `undefined` in that case anyway).
const u64 = (low: number): readonly number[] => [...u32(0), ...u32(low)];

const fourCC = (type: string): readonly number[] => Array.from(type).map((char) => char.charCodeAt(0));

describe('parseMP4Meta', () => {
  it('reports fastStart true and reads duration/dimensions when moov precedes mdat', async () => {
    const bytes = await readFixture('faststart.mp4');

    const meta = parseMP4Meta(bytes);

    expect(meta.fastStart).toBe(true);
    expect(meta.duration).toBeCloseTo(2, 1);
    expect(meta.width).toBe(64);
    expect(meta.height).toBe(48);
  });

  it('reports fastStart false when mdat precedes moov, while still reading duration/dimensions', async () => {
    const bytes = await readFixture('regular.mp4');

    const meta = parseMP4Meta(bytes);

    expect(meta.fastStart).toBe(false);
    expect(meta.duration).toBeCloseTo(2, 1);
    expect(meta.width).toBe(64);
    expect(meta.height).toBe(48);
  });

  it('returns a safe empty result for empty input', () => {
    const meta = parseMP4Meta(new Uint8Array(0));

    expect(meta).toEqual({ fastStart: false, duration: undefined, width: undefined, height: undefined });
  });

  it('returns a safe empty result for garbage bytes that never form a valid box', () => {
    const meta = parseMP4Meta(new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02, 0x03]));

    expect(meta).toEqual({ fastStart: false, duration: undefined, width: undefined, height: undefined });
  });

  it('returns a safe empty result for a box whose declared size overruns the buffer (truncated file)', () => {
    // A box header claiming a 'moov' type with a huge declared size, but the
    // buffer is cut off right after the header — never throw, just bail out.
    const bytes = new Uint8Array([0x7f, 0xff, 0xff, 0xff, 0x6d, 0x6f, 0x6f, 0x76, 0x00, 0x00]);

    const meta = parseMP4Meta(bytes);

    expect(meta).toEqual({ fastStart: false, duration: undefined, width: undefined, height: undefined });
  });

  it('never throws for a random short byte sequence', () => {
    const bytes = new Uint8Array([0x01]);

    expect(() => parseMP4Meta(bytes)).not.toThrow();
  });

  it('returns fastStart false with all metadata undefined when moov is missing entirely', async () => {
    const bytes = await readFixture('regular.mp4');
    // Strip everything from moov onward (moov starts at byte 2614 per the
    // fixture's known top-level layout) so only ftyp + free + mdat remain.
    const withoutMoov = bytes.slice(0, 2614);

    const meta = parseMP4Meta(withoutMoov);

    expect(meta).toEqual({ fastStart: false, duration: undefined, width: undefined, height: undefined });
  });

  it('never throws and returns a safe empty result for ~10,000 minimal 8-byte sibling boxes (adversarial many-box input)', () => {
    const BOX_COUNT = 10_000;
    // Each box is the minimal 8-byte header with no body: size32=8, type='free'.
    const oneBox = [...u32(8), ...fourCC('free')];
    const bytes = new Uint8Array(Array.from({ length: BOX_COUNT }, () => oneBox).flat());

    expect(() => parseMP4Meta(bytes)).not.toThrow();
    const meta = parseMP4Meta(bytes);
    expect(meta).toEqual({ fastStart: false, duration: undefined, width: undefined, height: undefined });
  });

  it('parses a top-level box using the size===1 largesize header (moov -> mvhd v0)', () => {
    // mvhd v0 body: version+flags(4) creation(4) modification(4) timescale(4) duration(4)
    const mvhdBytes = [...u32(28), ...fourCC('mvhd'), ...u32(0), ...u32(0), ...u32(0), ...u32(1000), ...u32(2000)];
    // moov header via largesize: size32=1, type, largesize(8) covering header(16) + body
    const moovLargesize = 16 + mvhdBytes.length;
    const moovBytes = [...u32(1), ...fourCC('moov'), ...u64(moovLargesize), ...mvhdBytes];
    const bytes = new Uint8Array(moovBytes);

    const meta = parseMP4Meta(bytes);

    expect(meta.fastStart).toBe(true);
    expect(meta.duration).toBeCloseTo(2, 5);
    expect(meta.width).toBeUndefined();
    expect(meta.height).toBeUndefined();
  });

  it('parses mvhd version 1 (64-bit duration field) for movie duration', () => {
    // mvhd v1 body: version+flags(4) creation(8) modification(8) timescale(4) duration(8)
    const mvhdV1Bytes = [
      ...u32(40),
      ...fourCC('mvhd'),
      1,
      0,
      0,
      0, // version=1, flags=0
      ...u32(0),
      ...u32(0), // creation (8 bytes)
      ...u32(0),
      ...u32(0), // modification (8 bytes)
      ...u32(3000), // timescale
      ...u64(6000), // duration (8 bytes)
    ];
    const moovBytes = [...u32(8 + mvhdV1Bytes.length), ...fourCC('moov'), ...mvhdV1Bytes];
    const bytes = new Uint8Array(moovBytes);

    const meta = parseMP4Meta(bytes);

    expect(meta.fastStart).toBe(true);
    expect(meta.duration).toBeCloseTo(2, 5);
  });
});
