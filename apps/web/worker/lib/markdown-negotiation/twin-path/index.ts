// The Markdown twin of a page path: `/` → `/llms.txt` (the site index for agents),
// otherwise `<path>.md` (`/about` → `/about.md`, `/blog/` → `/blog.md`).
const HOME_TWIN = '/llms.txt';

const stripTrailingSlashes = (pathname: string): string => pathname.replace(/\/+$/, '');

export const resolveMarkdownTwinPath = (pathname: string): string => {
  const base = stripTrailingSlashes(pathname);
  if (base === '') return HOME_TWIN;

  return `${base}.md`;
};
