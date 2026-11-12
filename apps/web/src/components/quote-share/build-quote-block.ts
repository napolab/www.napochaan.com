import { truncateQuote } from './truncate-quote';

// The shareable quote block — copied verbatim and used as the X tweet body:
//   > {quote (clipped)}
//   {title} | {url}
export const buildQuoteBlock = (quote: string, title: string, url: string): string => `> ${truncateQuote(quote)}\n${title} | ${url}`;
