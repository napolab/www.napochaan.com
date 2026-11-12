import { loadDefaultJapaneseParser } from 'budoux';

// One shared parser holding BudouX's default Japanese model. The model loads
// once at module scope; parse() is pure and deterministic, so it is safe to run
// during SSR — PhrasedText renders identical markup on server and client.
const parser = loadDefaultJapaneseParser();

// Segment Japanese prose into 文節 (phrase) chunks. PhrasedText joins the chunks
// with <wbr> so lines break between phrases on every browser — the cross-browser
// equivalent of Chromium-only `word-break: auto-phrase` (ignored on iOS Safari).
export const phrase = (text: string): string[] => {
  if (text === '') return [];

  return parser.parse(text);
};
