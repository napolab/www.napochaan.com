// Format a selected passage as a quote for the tweet body: trim, clip to keep the
// tweet within limits (the URL eats characters too), wrap in Japanese corner brackets.
const MAX_QUOTE_LEN = 100;

export const truncateQuote = (text: string): string => {
  const trimmed = text.trim();
  const body = trimmed.length > MAX_QUOTE_LEN ? `${trimmed.slice(0, MAX_QUOTE_LEN)}…` : trimmed;
  return `「${body}」`;
};
