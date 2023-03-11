import { style } from "@vanilla-extract/css";

/**
 * @package
 */
export const headingRoot = style({
  marginBottom: "1em",

  selectors: {
    "&:where(h1, h2, h3)": {
      fontWeight: 500,
    },
    "&:where(h1)": {
      fontSize: "2rem",
    },
    "&:where(h2)": {
      fontSize: "1.75rem",
    },
    "&:where(h3)": {
      fontSize: "1.5rem",
    },
    "&:where(h4, h5, h6)": {
      fontSize: "1.25rem",
    },
  },
});
