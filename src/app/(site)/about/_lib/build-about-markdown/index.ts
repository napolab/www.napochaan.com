import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { Profile } from '../profile';

/** The about page as markdown (`/about.md`). Pure. */
export const buildAboutMarkdown = (profile: Profile | undefined, baseUrl: string): string => {
  if (profile === undefined) return '# about\n\nProfile is unavailable.\n';

  const url = new URL('/about', baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: profile.name, url });
  const bio = lexicalToMarkdown(profile.bio, { baseUrl });
  const philosophy = lexicalToMarkdown(profile.philosophy, { baseUrl });
  const sections = [frontmatter, `# ${profile.name}`, `**${profile.name}** (${profile.aka})`, `> ${profile.tagline}`, `Now: ${profile.now} / Team: ${profile.team}`, bio, philosophy].filter(
    (section) => section !== '',
  );

  return `${sections.join('\n\n')}\n`;
};
