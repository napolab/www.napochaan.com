// Accept header negotiation for the Markdown twin of a page (RFC 9110 §12.5.1).
// Only an explicit `text/markdown` range opts in: browsers and curl send `*/*` / `text/*`
// and must keep getting HTML. Markdown wins when its q is > 0 and >= HTML's q, so
// `Accept: text/markdown, text/html` (an agent naming both) gets Markdown.

type MediaRange = { type: string; subtype: string; q: number };

const DEFAULT_QUALITY = 1;

// A q outside 0..1 or not a number is read as absent (lenient, like most servers).
const parseQuality = (value: string): number => {
  const q = parseFloat(value);
  if (Number.isNaN(q) || q < 0 || q > 1) return DEFAULT_QUALITY;

  return q;
};

const qualityOfParams = (params: readonly string[]): number => {
  const qParam = params.map((param) => param.trim().toLowerCase()).find((param) => param.startsWith('q='));
  if (qParam === undefined) return DEFAULT_QUALITY;

  return parseQuality(qParam.slice(2));
};

const parseMediaRange = (range: string): MediaRange | undefined => {
  const [mediaType = '', ...params] = range.split(';');
  const [type, subtype] = mediaType.trim().toLowerCase().split('/');
  if (type === undefined || subtype === undefined || type === '' || subtype === '') return undefined;

  return { type, subtype, q: qualityOfParams(params) };
};

const parseAccept = (accept: string): readonly MediaRange[] =>
  accept.split(',').flatMap((range) => {
    const parsed = parseMediaRange(range);
    return parsed === undefined ? [] : [parsed];
  });

const exactly =
  (type: string, subtype: string) =>
  (range: MediaRange): boolean =>
    range.type === type && range.subtype === subtype;

const anySubtypeOf =
  (type: string) =>
  (range: MediaRange): boolean =>
    range.type === type && range.subtype === '*';

const anyType = (range: MediaRange): boolean => range.type === '*' && range.subtype === '*';

// The most specific matching range decides the quality; no match means not acceptable.
const qualityFor = (ranges: readonly MediaRange[], type: string, subtype: string): number => {
  const match = ranges.find(exactly(type, subtype)) ?? ranges.find(anySubtypeOf(type)) ?? ranges.find(anyType);

  return match?.q ?? 0;
};

export const acceptsMarkdown = (accept: string | null | undefined): boolean => {
  if (accept === null || accept === undefined || accept === '') return false;
  const ranges = parseAccept(accept);
  const markdown = ranges.find(exactly('text', 'markdown'));
  if (markdown === undefined || markdown.q === 0) return false;

  return markdown.q >= qualityFor(ranges, 'text', 'html');
};
