import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

import { getHighlighter, INK_THEME_NAME } from '../highlighter';
import * as styles from '../styles.css';

import type { Components } from 'hast-util-to-jsx-runtime';
import type { ReactNode } from 'react';

type Props = {
  readonly code: string;
  readonly lang?: string;
};

// Replace Shiki's <pre> (which carries a transparent inline background and the
// `.shiki` class) with the project's dark-terminal container. The inner <code>
// and its token <span>s — carrying `color:var(--code-*)` — are kept verbatim.
const CodePre = ({ children }: { readonly children?: ReactNode }) => <pre className={styles.codeBlock}>{children}</pre>;

const components: Partial<Components> = { pre: CodePre };

/**
 * Async Server Component. Highlights `code` with the singleton Shiki highlighter
 * and renders the resulting hast to React. Unsupported / missing `lang` falls
 * back to `text` (plain, no tokens) so it never throws. Zero client JS.
 */
export const CodeBlock = async ({ code, lang }: Props) => {
  const highlighter = await getHighlighter();
  const resolved = lang !== undefined && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
  const hast = highlighter.codeToHast(code, { lang: resolved, theme: INK_THEME_NAME });

  return toJsxRuntime(hast, { Fragment, jsx, jsxs, components });
};
