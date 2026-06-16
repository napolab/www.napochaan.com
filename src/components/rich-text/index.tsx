import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';

import { clsx } from '@utils/clsx';

import { createJsxConverters } from './converters';
import * as styles from './styles.css';

import type { SoftwareDownload } from '@lib/payload/software';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Props = {
  readonly data: SerializedEditorState;
  readonly className?: string;
  readonly softwareDownloads?: ReadonlyMap<string, SoftwareDownload>;
  readonly turnstileSiteKey?: string;
};

const EMPTY: ReadonlyMap<string, SoftwareDownload> = new Map();

export const RichText = ({ data, className, softwareDownloads = EMPTY, turnstileSiteKey = '' }: Props) => {
  const converters = createJsxConverters({ softwareDownloads, turnstileSiteKey });
  return <PayloadRichText data={data} converters={converters} className={clsx(styles.root, className)} />;
};
