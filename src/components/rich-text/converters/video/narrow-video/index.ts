// A populated media value carries url/mimeType/width/height (+ optional
// duration/filesize once the media collection grows a `duration` field); an
// unpopulated one is a numeric id (or absent). Narrowed structurally — never by
// importing `payload-types.ts` — because `duration`/`filesize` are not part of
// the generated Media type and BlocksFeature-only blocks are not generated at
// all (mirrors `image-row`'s `populatedImageOf`).
export type PopulatedVideo = {
  readonly url: string;
  readonly mimeType: string;
  readonly width: number;
  readonly height: number;
  readonly duration?: number;
  readonly filesize?: number;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const populatedVideoOf = (value: unknown): PopulatedVideo | undefined => {
  if (!isObject(value)) return undefined;

  const { url, mimeType, width, height, duration, filesize } = value;
  if (typeof url !== 'string') return undefined;
  if (typeof mimeType !== 'string') return undefined;
  if (typeof width !== 'number') return undefined;
  if (typeof height !== 'number') return undefined;

  return {
    url,
    mimeType,
    width,
    height,
    duration: typeof duration === 'number' ? duration : undefined,
    filesize: typeof filesize === 'number' ? filesize : undefined,
  };
};

// The `poster` field only ever needs a URL — it may be any populated media doc
// (typically an image), not necessarily one with video-only fields.
export const populatedMediaURLOf = (value: unknown): string | undefined => {
  if (!isObject(value)) return undefined;

  const { url } = value;
  return typeof url === 'string' ? url : undefined;
};
