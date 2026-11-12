import { buildQuoteBlock } from './build-quote-block';

// X (Twitter) web intent for the quote block. The block (URL included) is the tweet
// `text`; no separate `url` param, so `title | url` renders on one line.
export const buildQuoteTweetUrl = (quote: string, title: string, url: string): string => `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildQuoteBlock(quote, title, url))}`;
