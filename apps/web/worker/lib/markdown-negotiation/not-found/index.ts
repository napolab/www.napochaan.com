type MarkdownNotFoundArgs = { baseURL: string; pathname: string };

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const buildBody = ({ baseURL, pathname }: MarkdownNotFoundArgs): string => {
  const base = stripTrailingSlash(baseURL);

  return [
    '# 404 Not Found',
    '',
    `\`${pathname}\` は見つかりませんでした。The page you requested does not exist.`,
    '',
    '## Try',
    '',
    `- [Home](${base}/)`,
    `- [Blog](${base}/blog)`,
    `- [Sitemap](${base}/sitemap.xml)`,
    `- [llms.txt](${base}/llms.txt): site index for agents`,
    '',
  ].join('\n');
};

// Answer for a markdown-preferring request whose page has neither a `.md` twin nor an
// HTML route. The Astro handler's error policy makes it `no-store`.
export const markdownNotFoundResponse = (args: MarkdownNotFoundArgs): Response => new Response(buildBody(args), { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
