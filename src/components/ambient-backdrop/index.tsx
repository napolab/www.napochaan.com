import { formatBlurURL } from '@components/image/helper';

import * as styles from './styles.css';

import type { CSSProperties } from 'react';

type Props = {
  src: string;
};

// The thumb url is handed to CSS as a custom property so the fixed backdrop layer
// (styles.root) can paint it; the `style` prop is allowed for CSS variables only.
// Routed through formatBlurURL so the request hits the worker's /_next/image
// transformer — this full-viewport wash is blurred 40px under an 82% white veil at
// half opacity, so a tiny downscaled copy is visually indistinguishable from the
// original while avoiding a full-resolution download. Mirrors the Figure cover backdrop.
const thumbStyle = (src: string): CSSProperties => ({ '--thumb': `url(${formatBlurURL(src, { blur: 40, width: 96, quality: 40 })})` }) as CSSProperties;

// A per-page ambient backdrop: a fixed, heavily-blurred, white-veiled wash of a
// thumbnail, sunk behind all content (zIndex.hide) so the site's 方眼 grid keeps
// showing through. Shared by the works and blog detail heroes. Decorative only —
// aria-hidden, no pointer events. Pure presentational component.
export const AmbientBackdrop = ({ src }: Props) => {
  return <span className={styles.root} aria-hidden="true" style={thumbStyle(src)} />;
};
