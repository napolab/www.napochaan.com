// Build the X (Twitter) web intent URL. Stateless GET — prefills the compose
// window with the article title as text and the canonical URL.
export const buildTweetUrl = (title: string, url: string): string => {
  const text = encodeURIComponent(title);
  const target = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${target}`;
};
