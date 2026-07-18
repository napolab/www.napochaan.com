import { codeBlockConverters } from './code';
import { headingConverter } from './heading';
import { hrConverter } from './hr';
import { imageRowBlockConverters } from './image-row';
import { linkConverter } from './link';
import { listConverter } from './list';
import { paragraphConverter } from './paragraph';
import { quoteConverter } from './quote';
import { tableConverter } from './table';
import { textConverter } from './text';
import { uploadConverter } from './upload';
import { youtubeEmbedBlockConverters } from './youtube-embed';

import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

/**
 * Combined JSX converters for rendering Payload Lexical rich text.
 *
 * Spreads Payload's `defaultConverters` first, then overrides with project-specific
 * styled converters. Each converter folder owns one concern (heading/text/list/…).
 */
export const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...paragraphConverter,
  ...headingConverter,
  ...textConverter,
  ...linkConverter,
  ...listConverter,
  ...quoteConverter,
  ...tableConverter,
  ...uploadConverter,
  ...hrConverter,
  blocks: { ...imageRowBlockConverters, ...codeBlockConverters, ...youtubeEmbedBlockConverters },
});
