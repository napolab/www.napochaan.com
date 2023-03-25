import { globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { vars } from "./config/base.css";
import { mediaQueries } from "./utils";

import type { StyleRule } from "@vanilla-extract/css";

globalStyle("html, body", {
  scrollBehavior: "smooth",
  overflowX: "hidden",
});
globalStyle("body", {
  color: vars.pallets.text.main,
  backgroundColor: vars.pallets.background.main,
  fontFamily: vars.font.body,
  fontSize: "16px",
  fontWeight: 400,
});

globalStyle("body::-webkit-scrollbar", {
  display: "none",
});
globalStyle("*::selection", {
  color: vars.pallets.black,
  background: vars.pallets.accent1,
});

export const focusRing: StyleRule = {
  outlineStyle: "solid",
  outlineWidth: 2,
  outlineColor: vars.pallets.border.focus,
  outlineOffset: -2,
};

export const link = style({
  display: "inline-block",
  color: vars.pallets.link.main,
  ":hover": { color: vars.pallets.link.hover },
  ":focus-visible": focusRing,
});

export const fillImage = style({
  objectFit: "contain",
  width: "100%",
});

export const textLink = style([link, { color: vars.pallets.text.main }]);

export const anchorLink = style([
  link,
  {
    display: "inline-block",
    color: vars.pallets.text.main,
    textDecoration: "none",
  },
]);

const baseHeadingRoot = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "center",
  fontFamily: vars.font.poppins,
  lineHeight: 1,
  fontSize: vars.typography.body,
});

export const heading = styleVariants(
  {
    h1: {
      fontWeight: 700,
      padding: `${vars.space.sm} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 3),
          letterSpacing: "0.1em",
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 3),
          letterSpacing: "0.1em",
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 2.25),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
      },
    },
    h2: {
      fontWeight: 600,
      padding: `${vars.space.sm} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 1.75),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
      },
    },
    h3: {
      fontWeight: 500,
      padding: `${vars.space.xs} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 1.25),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 1),
        },
      },
    },
    h4: {
      fontWeight: 400,
      padding: `${vars.space.xs} 0`,
      letterSpacing: "0.03em",
    },
    h5: {
      fontWeight: 400,
      padding: `${vars.space.xs} 0`,
      letterSpacing: "0.03em",
    },
    h6: {
      fontWeight: 400,
      padding: `${vars.space.xs} 0`,
      letterSpacing: "0.03em",
    },
  },
  (override) => [baseHeadingRoot, override],
);
