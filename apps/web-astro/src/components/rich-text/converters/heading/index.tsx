import { headingText, slugifyHeading } from '../../toc';
import { AnchoredHeading } from './anchored-heading';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

const tagToLevel = (tag: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  switch (tag) {
    case 'h1':
      return 1;
    case 'h2':
      return 2;
    case 'h3':
      return 3;
    case 'h4':
      return 4;
    case 'h5':
      return 5;
    default:
      return 6;
  }
};

/**
 * Renders Lexical heading nodes through `AnchoredHeading`, a client wrapper that owns
 * the heading DOM node so the gutter copy-anchor can act on it via an injected handler
 * (rather than reaching foreign DOM). Each heading gets a slug `id` for TOC
 * deep-linking. The blog TOC's reading-progress colours attach positionally via a
 * static `view-timeline-name` rule (`:nth-child(N of :is(h2,h3))`, see global-css), so
 * no per-heading markup is needed here. The heading text streams in as `children`.
 */
export const headingConverter: Partial<JSXConverters<NodeTypes>> = {
  heading: ({ node, nodesToJSX }) => {
    const level = tagToLevel(node.tag);
    const slug = slugifyHeading(headingText(node));
    return (
      <AnchoredHeading level={level} slug={slug}>
        {nodesToJSX({ nodes: node.children })}
      </AnchoredHeading>
    );
  },
};
