import { parseMP4Meta } from '@utils/mp4';

// ISOBMFF-container video mimetypes this module knows how to parse a
// moov/mdat ordering out of. Other `video/*` mimetypes (e.g. webm, an EBML
// container) pass through unvalidated — raw progressive playback still works
// for them via Range requests, this module just has no faststart concept for
// a non-ISOBMFF container.
const ISOBMFF_VIDEO_MIME_TYPES: readonly string[] = ['video/mp4', 'video/quicktime'];

export const isISOBMFFVideoMimeType = (mimetype: string): boolean => ISOBMFF_VIDEO_MIME_TYPES.some((type) => type === mimetype);

export const FASTSTART_REQUIRED_MESSAGE =
  'この動画は moov atom がファイル末尾にあるため、ストリーミング再生できません。ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4 で再エンコードしてからアップロードしてください。';

export type VideoMetaPatch = {
  duration: number | undefined;
  width: number | undefined;
  height: number | undefined;
};

export type VideoUploadOutcome = { kind: 'skip' } | { kind: 'clear' } | { kind: 'reject'; message: string } | { kind: 'patch'; patch: VideoMetaPatch };

// The subset of Payload's upload `File` this module needs — deliberately
// narrow so it stays testable without importing any Payload runtime type.
export type UploadedFile = {
  mimetype: string;
  data: Uint8Array;
};

// Pure decision function: given the file payload Payload's upload pipeline
// hands the collection hook (or `undefined` when no file is being uploaded),
// decide whether to skip validation, clear stale video metadata, reject the
// upload, or patch duration/width/height metadata onto the document data. No
// Payload runtime dependency — testable in isolation with the real MP4
// fixtures.
//
// `skip` vs `clear` distinction: when there's no file at all (a metadata-only
// update, e.g. editing `alt`), we must leave `duration` untouched — that's
// `skip`. When a file IS present but isn't an ISOBMFF video (an image, PDF,
// or webm), Payload's `generateFileData` self-heals width/height/filesize/
// mimeType for the new file, but it has no concept of our custom `duration`
// field — so a stale `duration` from a *previous* video file would otherwise
// linger on the doc. `clear` tells the hook to explicitly null it out.
export const resolveVideoUploadOutcome = (file: UploadedFile | undefined): VideoUploadOutcome => {
  if (file === undefined) return { kind: 'skip' };
  if (!isISOBMFFVideoMimeType(file.mimetype)) return { kind: 'clear' };

  const meta = parseMP4Meta(file.data);
  if (!meta.fastStart) return { kind: 'reject', message: FASTSTART_REQUIRED_MESSAGE };

  return { kind: 'patch', patch: { duration: meta.duration, width: meta.width, height: meta.height } };
};
