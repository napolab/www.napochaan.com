import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';

import { clsx } from '@utils/clsx';

import { createJsxConverters } from './converters';
import * as styles from './styles.css';

import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

import type { NodeTypes } from './converters/types';

type Props = {
  readonly data: SerializedEditorState;
  readonly className?: string;
  readonly converters?: JSXConvertersFunction<NodeTypes>;
};

// Plain converters for rich text with no software-download wiring (e.g. the terms body
// rendered inside the download dialog, which never contains a software-download block).
// Callers that render a software-download block build their own converters via
// `createJsxConverters` — passing the releases map, the Turnstile site key, and the
// `issueDownloadURL` server action directly — and hand them in via `converters`.
const plainConverters = createJsxConverters({
  softwareDownloads: new Map(),
  turnstileSiteKey: '',
  issueDownloadURL: () => Promise.resolve({ error: 'ダウンロードは利用できません。' }),
});

export const RichText = ({ data, className, converters = plainConverters }: Props) => {
  return <PayloadRichText data={data} converters={converters} className={clsx(styles.root, className)} />;
};
