import { css } from '@styled/css';

// <wbr> (inserted by PhrasedText at every 文節 boundary) marks where lines may
// break; `keep-all` stops the browser from breaking anywhere else, so phrases
// stay intact and the <wbr> become the only break points. `overflow-wrap:
// anywhere` is the safety valve for a single chunk longer than the line.
export const root = css({
  wordBreak: 'keep-all',
  overflowWrap: 'anywhere',
});
