import { css } from '@styled/css';

// The wrapper exists only to host the click-capture handler — `contents`
// removes its box so demo layout is untouched.
export const root = css({ display: 'contents' });
