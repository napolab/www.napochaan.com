// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose
const UNSAFE_FILENAME = /[/\\\u0000-\u001f\u007f]/;

// With `/` and `\` already rejected, a name is a single path segment, so the only
// traversal-capable names are the dot segments themselves. `a..png` is a normal name.
const DOT_SEGMENTS: ReadonlySet<string> = new Set(['.', '..']);

// @payloadcms/storage-r2 is configured with `media: true` and no prefix, so the
// object key is the bare filename. Anything that could escape that flat
// namespace is rejected rather than sanitized.
export const toMediaKey = (filename: string): string | undefined => {
  if (filename === '') return undefined;
  if (DOT_SEGMENTS.has(filename)) return undefined;
  if (UNSAFE_FILENAME.test(filename)) return undefined;

  return filename;
};
