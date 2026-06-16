import { codeConverter } from './code';
import { headingConverter } from './heading';
import { hrConverter } from './hr';
import { imageRowBlockConverters } from './image-row';
import { linkConverter } from './link';
import { listConverter } from './list';
import { paragraphConverter } from './paragraph';
import { quoteConverter } from './quote';
import { createSoftwareDownloadBlockConverters } from './software-download';
import { tableConverter } from './table';
import { textConverter } from './text';
import { uploadConverter } from './upload';

import type { SoftwareDownload } from '@lib/payload/software';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

export type ConverterContext = { softwareDownloads: ReadonlyMap<string, SoftwareDownload>; turnstileSiteKey: string };

export const createJsxConverters =
  (context: ConverterContext): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => ({
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
    blocks: { ...imageRowBlockConverters, ...createSoftwareDownloadBlockConverters(context) },
  });
