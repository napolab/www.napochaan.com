import { Link } from '@components/link';

import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// Allow only safe URL schemes. `node.fields.url` is author-controlled (CMS),
// and React does not sanitize the href scheme, so an authored `javascript:`/`data:`
// link would execute on click — block those by falling back to '#'.
const SAFE_HREF = /^(?:https?:|mailto:|tel:|\/|#)/i;
const safeHref = (url: string | undefined): string => {
  const raw = url ?? '';
  return SAFE_HREF.test(raw) ? raw : '#';
};

const externalAttrs = (newTab: boolean | null | undefined): { target?: '_blank'; rel?: string } => (newTab === true ? { target: '_blank', rel: 'noopener noreferrer' } : {});

/**
 * Overrides Payload's default `link` / `autolink` converters so authored links
 * (and auto-linked emails/URLs) render through the shared `Link` (accent +
 * underline) plus a local `fillHover` — body links do not scramble, so the
 * saturated hover wash is their affordance. Internal links fall back to '#'.
 */
export const linkConverter: Partial<JSXConverters<NodeTypes>> = {
  autolink: ({ node, nodesToJSX }) => (
    <Link className={styles.fillHover} href={safeHref(node.fields.url ?? undefined)} {...externalAttrs(node.fields.newTab)}>
      {nodesToJSX({ nodes: node.children })}
    </Link>
  ),
  link: ({ node, nodesToJSX }) => {
    const href = node.fields.linkType === 'internal' ? '#' : safeHref(node.fields.url ?? undefined);
    return (
      <Link className={styles.fillHover} href={href} {...externalAttrs(node.fields.newTab)}>
        {nodesToJSX({ nodes: node.children })}
      </Link>
    );
  },
};
