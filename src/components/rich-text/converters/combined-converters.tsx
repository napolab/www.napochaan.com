import { codeConverter } from './code-converter';
import { headingConverter } from './heading-converter';
import { hrConverter } from './hr-converter';
import { linkConverter } from './link-converter';
import { listConverter } from './list-converter';
import { paragraphConverter } from './paragraph-converter';
import { quoteConverter } from './quote-converter';
import { tableConverter } from './table-converter';
import { textConverter } from './text-converter';
import { uploadConverter } from './upload-converter';

import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

/**
 * Combined JSX converters for rendering Payload Lexical rich text.
 *
 * Spreads Payload's `defaultConverters` first, then overrides with project-specific
 * styled converters. Each converter file owns one concern (heading/text/list/…).
 */
export const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...paragraphConverter,
  ...headingConverter,
  ...textConverter,
  ...linkConverter,
  ...listConverter,
  ...quoteConverter,
  ...codeConverter,
  ...tableConverter,
  ...uploadConverter,
  ...hrConverter,
});
