import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

import { characterLayer, section1, section3, tile } from "../../styles.css";
export { anchorLink, textLink, fillImage, link } from "@theme/css";

export { section1, section3 };

/**
 * @package
 */
export const mainVisualRoot = style({
  position: "absolute",
  userSelect: "none",
  pointerEvents: "none",
  zIndex: characterLayer,
  transformOrigin: "top left",

  "@media": {
    [mediaQueries.xl]: {
      top: 108,
      left: -418,
      width: "78.5rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.lg]: {
      top: 208,
      left: -483,
      width: "81.25rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.md]: {
      top: 70,
      left: -376,
      width: "54.25rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.sm]: {
      top: 168,
      left: -251,
      width: "41.5rem",
      transform: `rotate(-19deg)`,
    },
  },
});

const firstViewMinHeight = createVar();
/**
 * @package
 */
export const firstView = style({
  position: "relative",
  width: "100%",
  zIndex: characterLayer,

  "@media": {
    [mediaQueries.xl]: {
      vars: {
        [firstViewMinHeight]: "63.5rem",
      },
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-end",
      aspectRatio: "1376 / 1043", // 1440 x 1080 から padding を引いたもの
      minHeight: firstViewMinHeight,
      maxHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          maxHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
    [mediaQueries.lg]: {
      vars: {
        [firstViewMinHeight]: "79.375rem",
      },
      minHeight: `max(${firstViewMinHeight}, ${calc.subtract("100vh", calc.multiply(vars.space.lg, 2))})`,

      "@supports": {
        "(height: 100svh)": {
          minHeight: `max(${firstViewMinHeight}, ${calc.subtract("100svh", calc.multiply(vars.space.lg, 2))})`,
        },
      },
    },
    [mediaQueries.md]: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const pageTitle = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),
  display: "flex",

  "@media": {
    [mediaQueries.xl]: {
      marginTop: "17.5rem",
      marginRight: "2rem",
    },
    [mediaQueries.lg]: {
      justifyContent: "flex-end",
    },
    [mediaQueries.md]: {
      marginTop: "12rem",
      justifyContent: "flex-end",
    },
    [mediaQueries.sm]: {
      justifyContent: "flex-end",
    },
  },
});

/**
 * @package
 */
export const aboutMeWrapper = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),

  "@media": {
    [mediaQueries.lg]: {
      display: "flex",
      justifyContent: "flex-end",
    },
  },
});

/**
 * @package
 */
export const aboutMeRoot = style([
  tile,
  {
    position: "relative",
    zIndex: calc.add(characterLayer, 1),
    display: "flex",
    flexDirection: "column",

    "@media": {
      [mediaQueries.xl]: {
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
        gap: calc.multiply(vars.space.md, 1.5),
      },
      [mediaQueries.lg]: {
        marginTop: "23.75rem",
        width: "36.5625rem",
        borderRadius: vars.borderRadius.md,
        gap: calc.multiply(vars.space.md, 1.5),
      },
      [mediaQueries.md]: {
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
        gap: vars.space.md,
      },
    },
  },
]);

/**
 * @package
 */
export const aboutMe = style({
  display: "flex",
  flexDirection: "column",
  fontSize: vars.typography.body,

  "@media": {
    [mediaQueries.xl]: {
      gap: vars.space.md,
    },
    [mediaQueries.lg]: {
      gap: vars.space.md,
    },
    [mediaQueries.md]: {
      gap: vars.space.sm,
    },
    [mediaQueries.sm]: {
      gap: vars.space.sm,
    },
  },
});

/**
 * @package
 */
export const tags = style({
  display: "flex",
  gap: `${vars.space.sm} ${vars.space.md}`,
  flexWrap: "wrap",
  "@media": {
    [mediaQueries.sm]: {
      fontSize: 14,
      gap: `${vars.space.xs} ${vars.space.sm}`,
    },
  },
});
