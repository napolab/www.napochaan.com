// Clip a selected passage for sharing: trim, cap at 100 chars with an ellipsis.
const MAX_QUOTE_LEN = 100;

export const truncateQuote = (text: string): string => {
  const trimmed = text.trim();
  return trimmed.length > MAX_QUOTE_LEN ? `${trimmed.slice(0, MAX_QUOTE_LEN)}…` : trimmed;
};
