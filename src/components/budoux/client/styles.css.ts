import { style } from "@vanilla-extract/css";

/**
 * @package
 */
export const clientRoot = style({
  // @ts-expect-error: auto-phrase is not yet supported in TypeScript definitions
  wordBreak: "auto-phrase",
  overflowWrap: "break-word",
});
