export type FrontmatterValue = string | number | undefined;

// Quote + escape a string value: backslashes and double quotes are escaped, and
// newlines collapse to single spaces so the value always stays on one line.
const escapeValue = (value: string): string =>
  `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\s*\r?\n\s*/g, ' ')}"`;

const formatLine = ([key, value]: readonly [string, string | number]): string => (typeof value === 'number' ? `${key}: ${value}` : `${key}: ${escapeValue(value)}`);

/**
 * Renders a `---` fenced YAML frontmatter block for the `.md` endpoints.
 * Keys keep their insertion order; `undefined` values drop the whole line.
 */
export const formatFrontmatter = (fields: Readonly<Record<string, FrontmatterValue>>): string => {
  const lines = Object.entries(fields)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(formatLine);

  return ['---', ...lines, '---'].join('\n');
};
