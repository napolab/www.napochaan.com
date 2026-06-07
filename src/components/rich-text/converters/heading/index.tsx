import { Heading } from '@components/heading';

import { headingText, slugifyHeading } from '../../toc';
import * as styles from './styles.css';

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
 * Renders Lexical heading nodes using the project's `Heading` primitive.
 * Each heading gets a slug `id` derived from its text content for TOC deep-linking.
 */
export const headingConverter: Partial<JSXConverters<NodeTypes>> = {
  heading: ({ node, nodesToJSX }) => {
    const level = tagToLevel(node.tag);
    const slug = slugifyHeading(headingText(node));
    return (
      <Heading level={level} id={slug !== '' ? slug : undefined} className={styles.heading}>
        {nodesToJSX({ nodes: node.children })}
      </Heading>
    );
  },
};
