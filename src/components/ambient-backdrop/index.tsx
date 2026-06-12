import * as styles from './styles.css';

import type { CSSProperties } from 'react';

type Props = {
  src: string;
};

// The thumb url is handed to CSS as a custom property so the fixed backdrop layer
// (styles.root) can paint it; the `style` prop is allowed for CSS variables only.
const thumbStyle = (src: string): CSSProperties => ({ '--thumb': `url(${src})` }) as CSSProperties;

// A per-page ambient backdrop: a fixed, heavily-blurred, white-veiled wash of a
// thumbnail, sunk behind all content (zIndex.hide) so the site's 方眼 grid keeps
// showing through. Shared by the works and blog detail heroes. Decorative only —
// aria-hidden, no pointer events. Pure presentational component.
export const AmbientBackdrop = ({ src }: Props) => {
  return <span className={styles.root} aria-hidden="true" style={thumbStyle(src)} />;
};
