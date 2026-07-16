import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { Profile, ProfileContact, ProfileSkillGroup } from '../profile';

// `## love` + one `- item` bullet per entry. Mirrors AboutContent's
// SectionHeading "love" + TagCloud. undefined when there's nothing to show.
const loveSection = (love: readonly string[]): string | undefined => {
  if (love.length === 0) return undefined;

  return ['## love', '', ...love.map((item) => `- ${item}`)].join('\n');
};

// `## skill` + one `- {category}: {items joined ', '}` line per group.
// Mirrors AboutContent's SectionHeading "skill" + SkillMatrix.
const skillSection = (skillGroups: readonly ProfileSkillGroup[]): string | undefined => {
  if (skillGroups.length === 0) return undefined;

  return ['## skill', '', ...skillGroups.map((group) => `- ${group.category}: ${group.items.join(', ')}`)].join('\n');
};

// `## contact` + one `- {label}: [{handle}]({href})` line per contact.
// Mirrors AboutContent's SectionHeading "contact" + ContactList.
const contactSection = (contacts: readonly ProfileContact[]): string | undefined => {
  if (contacts.length === 0) return undefined;

  return ['## contact', '', ...contacts.map((contact) => `- ${contact.label}: [${contact.handle}](${contact.href})`)].join('\n');
};

/** The about page as markdown (`/about.md`). Pure. */
export const buildAboutMarkdown = (profile: Profile | undefined, baseUrl: string): string => {
  if (profile === undefined) return '# about\n\nProfile is unavailable.\n';

  const url = new URL('/about', baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: profile.name, url });
  const bio = lexicalToMarkdown(profile.bio, { baseUrl });
  const philosophy = lexicalToMarkdown(profile.philosophy, { baseUrl });
  const sections = [
    frontmatter,
    `# ${profile.name}`,
    `**${profile.name}** (${profile.aka})`,
    `> ${profile.tagline}`,
    `Now: ${profile.now} / Team: ${profile.team}`,
    bio,
    philosophy,
    loveSection(profile.love),
    skillSection(profile.skillGroups),
    contactSection(profile.contacts),
  ].filter((section): section is string => section !== undefined && section !== '');

  return `${sections.join('\n\n')}\n`;
};
