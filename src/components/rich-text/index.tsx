import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';

import { clsx } from '@utils/clsx';

import { jsxConverters } from './converters/combined-converters';
import * as styles from './styles.css';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Props = {
  readonly data: SerializedEditorState;
  readonly className?: string;
};

/**
 * Renders Payload Lexical rich text using custom JSX converters.
 *
 * Pass a Payload `richText` field's value (`{ root: … }`) as `data`.
 * Converters live in `./converters/` — one file per node type.
 */
export const RichText = ({ data, className }: Props) => {
  return <PayloadRichText data={data} converters={jsxConverters} className={clsx(styles.root, className)} />;
};
