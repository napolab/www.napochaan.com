import * as styles from '../styles.css';

import type { ReactNode } from 'react';
import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

// Standard Lexical text-format bitmasks
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;
const IS_SUBSCRIPT = 32;
const IS_SUPERSCRIPT = 64;

// Matches an http(s) URL (group 1) or bare email address (group 2). URLs tried
// first so a URL containing "@" isn't misread as email. URL body restricted to
// RFC 3986 chars so a URL directly followed by Japanese text stops at the first
// non-URL char rather than swallowing prose.
const LINK_RE = /(https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

// Punctuation that commonly trails a URL in prose but isn't part of it.
const TRAILING_PUNCTUATION = /[.,;:!?。、）)」』】>]+$/;

type LinkPart = {
  readonly node: ReactNode;
  readonly consumed: number;
};

const renderMatch = (match: RegExpMatchArray, index: number): LinkPart => {
  const url = match[1];
  if (url !== undefined) {
    const href = url.replace(TRAILING_PUNCTUATION, '');
    return {
      node: (
        <a key={`url-${index}`} className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
          {href}
        </a>
      ),
      consumed: href.length,
    };
  }

  const email = match[0];
  return {
    node: (
      <a key={`mail-${index}`} className={styles.link} href={`mailto:${email}`}>
        {email}
      </a>
    ),
    consumed: email.length,
  };
};

/**
 * Splits a plain text run into segments, auto-linking email addresses and http(s) URLs.
 * Returns the original string untouched when there is nothing to link.
 */
const linkify = (text: string): ReactNode => {
  const matches = [...text.matchAll(LINK_RE)];
  if (matches.length === 0) return text;

  const { parts, last } = matches.reduce<{ parts: ReactNode[]; last: number }>(
    (acc, match, index) => {
      const start = match.index ?? 0;
      if (start < acc.last) return acc;
      const before = text.slice(acc.last, start);
      const lead = before === '' ? [] : [before];
      const { node, consumed } = renderMatch(match, index);
      return { parts: [...acc.parts, ...lead, node], last: start + consumed };
    },
    { parts: [], last: 0 },
  );

  const tail = text.slice(last);
  return tail === '' ? parts : [...parts, tail];
};

// Format flag → wrapper. Applied in ascending bitmask order.
const FORMATTERS: readonly [number, (content: ReactNode) => ReactNode][] = [
  [IS_BOLD, (content) => <strong className={styles.strong}>{content}</strong>],
  [IS_ITALIC, (content) => <em>{content}</em>],
  [IS_STRIKETHROUGH, (content) => <s className={styles.strike}>{content}</s>],
  [IS_UNDERLINE, (content) => <u>{content}</u>],
  [IS_CODE, (content) => <code className={styles.inlineCode}>{content}</code>],
  [IS_SUBSCRIPT, (content) => <sub>{content}</sub>],
  [IS_SUPERSCRIPT, (content) => <sup>{content}</sup>],
];

const applyFormat = (format: number, content: ReactNode): ReactNode => FORMATTERS.reduce((acc, [bit, wrap]) => ((format & bit) === 0 ? acc : wrap(acc)), content);

/**
 * Overrides Payload's default `text` converter.
 * Auto-links bare emails / http(s) URLs and applies Panda-styled inline formatting
 * (bold → accent, strikethrough → danger, code → terminal-style).
 */
export const textConverter: Partial<JSXConverters<NodeTypes>> = {
  text: ({ node }) => {
    const isCode = (node.format & IS_CODE) !== 0;
    const content = isCode ? node.text : linkify(node.text);
    return applyFormat(node.format, content);
  },
};
