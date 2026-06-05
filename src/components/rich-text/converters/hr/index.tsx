import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

/**
 * Renders Lexical horizontal rule nodes as a styled `<hr>`.
 */
export const hrConverter: Partial<JSXConverters<NodeTypes>> = {
  horizontalrule: <hr className={styles.hr} />,
};
