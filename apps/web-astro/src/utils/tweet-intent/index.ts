// Build the X (Twitter) web intent URL. Stateless GET — prefills the compose
// window with `text` and `url`. Shared by ShareBar (whole-article share) and
// QuoteShare (selected-quote share).
export const buildTweetUrl = (title: string, url: string): string => {
  const text = encodeURIComponent(title);
  const target = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${target}`;
};
