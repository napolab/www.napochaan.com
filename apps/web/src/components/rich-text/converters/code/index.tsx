import { CodeBlock } from './code-block';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders the premade `Code` lexical block (`src/blocks/code`, blockType
 * 'Code'): the raw `code` field is highlighted server-side by the Shiki
 * pipeline in ./code-block. An unknown / missing `language` falls back to
 * plain text inside the component, so it never throws.
 */
export const codeBlockConverters: NonNullable<JSXConverters<NodeTypes>['blocks']> = {
  Code: ({ node }) => {
    const { code, language } = node.fields;

    return <CodeBlock code={code ?? ''} lang={language} />;
  },
};
