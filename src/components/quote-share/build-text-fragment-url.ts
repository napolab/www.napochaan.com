// Scroll-to-Text-Fragment deep link. Naive encode (single-block assumption): drop
// any existing fragment, trim, cap length, percent-encode. Long / multi-block
// selections may not match exactly — accepted tradeoff (see design doc risks).
const MAX_FRAGMENT_LEN = 200;

export const buildTextFragmentUrl = (baseUrl: string, selectedText: string): string => {
  const [base = baseUrl] = baseUrl.split('#');
  const text = selectedText.trim().slice(0, MAX_FRAGMENT_LEN);
  return `${base}#:~:text=${encodeURIComponent(text)}`;
};
