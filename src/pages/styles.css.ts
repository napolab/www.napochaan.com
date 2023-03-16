import { createContainer, createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

const characterLayer = createVar();
const firstViewContainer = createContainer();

/**
 * @package
 */
export const pageRoot = style({
  vars: {
    [characterLayer]: "2",
  },
  position: "relative",

  // padding: `0 ${vars.space.lg} ${vars.space.xl}`

  "@media": {
    [mediaQueries.pc]: {
      maxWidth: 1920,
      margin: "0 auto",
      background: vars.pallets.background.tertiary,
      borderRadius: vars.borderRadius.lg,
      overflow: "hidden",
    },
  },
});

/**
 * @package
 */
export const firstView = style({
  containerName: firstViewContainer,
  containerType: "inline-size",
  position: "relative",
  width: "100%",
  isolation: "isolate",

  "@media": {
    [mediaQueries.pc]: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-end",
      aspectRatio: "1376 / 1043", // 1440 x 1080 から padding を引いたもの
      maxHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          maxHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const characterImage = style({
  userSelect: "none",
  pointerEvents: "none",
  zIndex: characterLayer,
  "@media": {
    [mediaQueries.pc]: {
      top: -142,
      left: -213,
      position: "absolute",
      width: "80rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.sp]: {
      top: 23,
      left: -123,
      position: "absolute",
      width: "36rem",
      transform: `rotate(-19deg)`,
      maxInlineSize: "none",
    },
  },
});

/**
 * @package
 */
export const titleRoot = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
});

/**
 * @package
 */
export const pcHeading = style({
  marginTop: "16rem",
  "@media": {
    [mediaQueries.sp]: {
      display: "none",
    },
  },
});

/**
 * @package
 */
export const pcLogo = style({
  position: "relative",
  zIndex: 3,
  height: "4.9rem",
  marginRight: vars.space.lg,
});

/**
 * @package
 */
export const spHeading = style({
  "@media": {
    [mediaQueries.pc]: {
      display: "none",
    },
  },
});

export const section1 = style({
  "@media": {
    [mediaQueries.sp]: {
      height: calc.subtract("100vh", vars.space.md),
      "@supports": {
        "(height: 100svh)": {
          height: calc.subtract("100svh", vars.space.md),
        },
      },
    },
  },
});

/**
 * @package
 */
export const aboutMeRoot = style({
  "@media": {
    [mediaQueries.pc]: {
      padding: vars.space.lg,
      width: "40rem",
      background: `rgba(${vars.pallets.rgb.background.main})`,
      boxShadow: `0px ${vars.space.sx} ${vars.space.md} 0px ${vars.pallets.background.secondary}`,
      borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      zIndex: calc.add(characterLayer, 1),
    },
    [mediaQueries.sp]: {
      padding: vars.space.md,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      borderRadius: vars.borderRadius.md,
    },
  },
});

/**
 * @package
 */
export const aboutMe = style({
  display: "flex",
  flexDirection: "column",
  fontSize: vars.typography.body,
  "@media": {
    [mediaQueries.pc]: {
      marginTop: "1.5rem",
      gap: vars.space.md,
    },
    [mediaQueries.sp]: {
      marginTop: "1rem",
      gap: vars.space.sm,
    },
  },
});
