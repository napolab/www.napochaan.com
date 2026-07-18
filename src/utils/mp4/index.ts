// Minimal ISOBMFF ("box") reader for MP4 metadata a Payload upload hook needs
// before accepting a video: whether the `moov` box (index) precedes the
// `mdat` box (media data) — i.e. the file is "faststart" and streams without
// a full download — plus duration and pixel dimensions from the video track.
//
// Deliberately shallow: only the boxes required for that decision are parsed
// (top-level scan, moov -> mvhd / moov -> trak -> tkhd). Every read is bounds-
// checked against the buffer and the enclosing box, so garbage or truncated
// input can only ever bottom out in `undefined` fields — never a thrown
// exception.

export type MP4Meta = {
  fastStart: boolean;
  duration: number | undefined;
  width: number | undefined;
  height: number | undefined;
};

const EMPTY_META: Readonly<MP4Meta> = { fastStart: false, duration: undefined, width: undefined, height: undefined };

// Every call site that "returns EMPTY_META" returns a fresh copy instead of
// the shared singleton by reference — `MP4Meta` fields aren't readonly, so a
// caller mutating one bail-out result must never affect any other.
const emptyMeta = (): MP4Meta => ({ ...EMPTY_META });

// ===== primitive reads (all bounds-checked, all return undefined instead of throwing) =====

const readUint32BE = (bytes: Uint8Array, offset: number): number | undefined => {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
  return view.getUint32(0, false);
};

// Used both for 64-bit box sizes ("largesize") and for the mvhd version-1
// duration field. Box sizes >4GiB and durations that overflow 32 bits only
// appear far beyond anything this parser needs to handle. Reading the high
// 32 bits and rejecting non-zero avoids pulling in BigInt<->Number
// conversion for a case this parser's callers never hit — for a version-1
// mvhd with a duration that large, this simply reports `undefined` rather
// than the true value.
const readUint64BE = (bytes: Uint8Array, offset: number): number | undefined => {
  const high = readUint32BE(bytes, offset);
  const low = readUint32BE(bytes, offset + 4);
  if (high === undefined || low === undefined) return undefined;
  if (high !== 0) return undefined;
  return low;
};

const readFourCC = (bytes: Uint8Array, offset: number): string | undefined => {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
};

// ===== box scanning =====

type BoxHeader = {
  type: string;
  start: number;
  bodyStart: number;
  end: number;
};

const readBoxHeader = (bytes: Uint8Array, start: number, rangeEnd: number): BoxHeader | undefined => {
  const size32 = readUint32BE(bytes, start);
  const type = readFourCC(bytes, start + 4);
  if (size32 === undefined || type === undefined) return undefined;

  if (size32 === 0) return { type, start, bodyStart: start + 8, end: rangeEnd };

  if (size32 === 1) {
    const largesize = readUint64BE(bytes, start + 8);
    if (largesize === undefined) return undefined;
    const bodyStart = start + 16;
    const end = start + largesize;
    // `end === bodyStart` is a valid zero-length box body — only reject when
    // the declared size doesn't even cover its own header.
    if (end < bodyStart || end > rangeEnd) return undefined;
    return { type, start, bodyStart, end };
  }

  const bodyStart = start + 8;
  const end = start + size32;
  if (end < bodyStart || end > rangeEnd) return undefined;
  return { type, start, bodyStart, end };
};

// Real MP4s have single-digit top-level (and child) box counts. This caps
// recursion depth in `step` below so an adversarial file packed with many
// minimal 8-byte boxes (e.g. ~10,000 of them) cannot exhaust the call stack
// — far beyond any legitimate file, but safely bounded under any runtime's
// stack limit (Workers included).
const MAX_BOXES = 512;

// Lists sibling boxes within [rangeStart, rangeEnd). Stops (without throwing)
// at the first box it cannot parse — either malformed or truncated — so a
// corrupt tail never prevents reporting boxes already found.
const listBoxes = (bytes: Uint8Array, rangeStart: number, rangeEnd: number): readonly BoxHeader[] => {
  const step = (offset: number, acc: readonly BoxHeader[]): readonly BoxHeader[] => {
    if (acc.length >= MAX_BOXES) return acc;
    if (offset >= rangeEnd) return acc;
    const header = readBoxHeader(bytes, offset, rangeEnd);
    if (header === undefined) return acc;
    return step(header.end, [...acc, header]);
  };
  return step(rangeStart, []);
};

const findBoxByType = (boxes: readonly BoxHeader[], type: string): BoxHeader | undefined => boxes.find((box) => box.type === type);

// ===== moov / mdat ordering =====

// fastStart: top-level `moov` appears before top-level `mdat`. Caller has
// already confirmed `moov` exists; a missing `mdat` still counts as fastStart
// (nothing to be "after").
const resolveFastStart = (topBoxes: readonly BoxHeader[], moov: BoxHeader): boolean => {
  const mdat = findBoxByType(topBoxes, 'mdat');
  if (mdat === undefined) return true;
  return moov.start < mdat.start;
};

// ===== mvhd (movie header) -> duration in seconds =====

type FullBoxHeader = { version: number; bodyStart: number };

const readFullBoxHeader = (bytes: Uint8Array, box: BoxHeader): FullBoxHeader | undefined => {
  if (box.bodyStart + 4 > box.end) return undefined;
  const version = bytes[box.bodyStart];
  if (version === undefined) return undefined;
  return { version, bodyStart: box.bodyStart + 4 };
};

const toDurationSeconds = (timescale: number | undefined, duration: number | undefined): number | undefined => {
  if (timescale === undefined || duration === undefined || timescale === 0) return undefined;
  return duration / timescale;
};

// version 0: creation(4) modification(4) timescale(4) duration(4)
const parseMvhdV0 = (bytes: Uint8Array, bodyStart: number, boxEnd: number): number | undefined => {
  if (bodyStart + 16 > boxEnd) return undefined;
  const timescale = readUint32BE(bytes, bodyStart + 8);
  const duration = readUint32BE(bytes, bodyStart + 12);
  return toDurationSeconds(timescale, duration);
};

// version 1: creation(8) modification(8) timescale(4) duration(8)
const parseMvhdV1 = (bytes: Uint8Array, bodyStart: number, boxEnd: number): number | undefined => {
  if (bodyStart + 28 > boxEnd) return undefined;
  const timescale = readUint32BE(bytes, bodyStart + 16);
  const duration = readUint64BE(bytes, bodyStart + 20);
  return toDurationSeconds(timescale, duration);
};

const parseMvhdDuration = (bytes: Uint8Array, mvhd: BoxHeader): number | undefined => {
  const full = readFullBoxHeader(bytes, mvhd);
  if (full === undefined) return undefined;
  if (full.version === 1) return parseMvhdV1(bytes, full.bodyStart, mvhd.end);
  return parseMvhdV0(bytes, full.bodyStart, mvhd.end);
};

// ===== tkhd (track header) -> width/height =====

const FIXED_16_16_SCALE = 65536;

type TrackDimensions = { width: number; height: number };

// width/height are the LAST two u32s of the box (16.16 fixed point),
// regardless of tkhd version — reading from box.end sidesteps the version-0
// vs version-1 field-length difference entirely.
const parseTkhdDimensions = (bytes: Uint8Array, tkhd: BoxHeader): TrackDimensions | undefined => {
  const heightOffset = tkhd.end - 4;
  const widthOffset = tkhd.end - 8;
  if (widthOffset < tkhd.bodyStart) return undefined;
  const widthRaw = readUint32BE(bytes, widthOffset);
  const heightRaw = readUint32BE(bytes, heightOffset);
  if (widthRaw === undefined || heightRaw === undefined) return undefined;
  return { width: widthRaw / FIXED_16_16_SCALE, height: heightRaw / FIXED_16_16_SCALE };
};

const findVideoDimensionsInTrak = (bytes: Uint8Array, trak: BoxHeader): TrackDimensions | undefined => {
  const children = listBoxes(bytes, trak.bodyStart, trak.end);
  const tkhd = findBoxByType(children, 'tkhd');
  if (tkhd === undefined) return undefined;
  const dimensions = parseTkhdDimensions(bytes, tkhd);
  if (dimensions === undefined) return undefined;
  // Audio tracks report 0x0 — skip them in favor of the first track that
  // actually has pixels.
  if (dimensions.width === 0 || dimensions.height === 0) return undefined;
  return dimensions;
};

const findFirstVideoTrackDimensions = (bytes: Uint8Array, moov: BoxHeader): TrackDimensions | undefined => {
  const trakBoxes = listBoxes(bytes, moov.bodyStart, moov.end).filter((box) => box.type === 'trak');
  return trakBoxes.reduce<TrackDimensions | undefined>((found, trak) => found ?? findVideoDimensionsInTrak(bytes, trak), undefined);
};

// ===== public API =====

export const parseMP4Meta = (bytes: Uint8Array): MP4Meta => {
  if (bytes.length === 0) return emptyMeta();

  const topBoxes = listBoxes(bytes, 0, bytes.length);
  const moov = findBoxByType(topBoxes, 'moov');
  if (moov === undefined) return emptyMeta();

  const moovChildren = listBoxes(bytes, moov.bodyStart, moov.end);
  const mvhd = findBoxByType(moovChildren, 'mvhd');
  const dimensions = findFirstVideoTrackDimensions(bytes, moov);

  return {
    fastStart: resolveFastStart(topBoxes, moov),
    duration: mvhd !== undefined ? parseMvhdDuration(bytes, mvhd) : undefined,
    width: dimensions?.width,
    height: dimensions?.height,
  };
};
