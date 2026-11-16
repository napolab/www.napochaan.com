import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { PrivacyBlock, PrivacyContent, PrivacySection, PrivacyServiceColumns, PrivacyServiceRow } from '../../content';

const COLUMN_KEYS = ['service', 'purpose', 'data'] as const satisfies readonly (keyof PrivacyServiceRow)[];

// A `|` inside a cell would end it early in a GFM table.
const escapeCell = (value: string): string => value.replaceAll('|', '\\|');

const tableRow = (cells: readonly string[]): string => `| ${cells.map(escapeCell).join(' | ')} |`;

const serviceTable = (caption: string, columns: PrivacyServiceColumns, rows: readonly PrivacyServiceRow[]): string =>
  [caption, '', tableRow(COLUMN_KEYS.map((key) => columns[key])), `|${COLUMN_KEYS.map(() => ' --- ').join('|')}|`, ...rows.map((row) => tableRow(COLUMN_KEYS.map((key) => row[key])))].join('\n');

const renderBlock = (block: PrivacyBlock): string => {
  switch (block.kind) {
    case 'paragraph':
      return block.text;
    case 'list':
      return block.items.map((item) => `- ${item}`).join('\n');
    case 'table':
      return serviceTable(block.caption, block.columns, block.rows);
    case 'mail':
      return `${block.before}[${block.address}](mailto:${block.address})${block.after}`;
  }
};

// `## heading` + the `// …?` subtitle + every block. Mirrors the page's SectionHeading.
const renderSection = (section: PrivacySection): string => [`## ${section.heading}`, section.question, ...section.blocks.map(renderBlock)].join('\n\n');

/** The privacy page as markdown (`/privacy.md`). Pure. */
export const buildPrivacyMarkdown = (content: PrivacyContent, baseUrl: string): string => {
  const url = new URL('/privacy', baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: content.title, url, updated: content.lastUpdated });
  const sections = [frontmatter, `# ${content.title}`, `> ${content.lead}`, ...content.sections.map(renderSection), `${content.lastUpdatedLabel}: ${content.lastUpdated}`];

  return `${sections.join('\n\n')}\n`;
};
