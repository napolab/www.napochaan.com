import { createContainer, createVar, globalStyle, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, link as commonLink, mediaQueries, vars } from "@theme/css";

const characterLayer = createVar();
const firstViewContainer = createContainer();

/**
 * @package
 */
export const link = style([
  commonLink,
  {
    color: vars.pallets.text.main,
  },
]);

/**
 * @package
 */
export const characterImage = style({
  objectFit: "contain",
  width: "100%",
});

/**
 * @package
 */
export const pageRoot = style({
  vars: {
    [characterLayer]: "2",
  },
  position: "relative",
  isolation: "isolate",

  "@media": {
    [mediaQueries.xl]: {
      maxWidth: 1440,
      margin: "0 auto",
      background: vars.pallets.background.tertiary,
      borderRadius: vars.borderRadius.lg,
      paddingBottom: vars.space.xl,
    },
  },
});

/**
 * @package
 */
export const decorationRoot = style({
  position: "absolute",
  top: calc.multiply(vars.space.lg, -2),
  left: calc.multiply(vars.space.lg, -2),
  margin: vars.space.lg,
  width: calc.add("100%", calc.multiply(vars.space.lg, 2)),
  height: calc.add("100%", calc.multiply(vars.space.lg, 2)),
  zIndex: -1,
  overflow: "hidden",

  "@media": {
    [mediaQueries.xl]: {
      margin: "auto",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },
    [mediaQueries.sm]: {
      top: calc.multiply(vars.space.md, -2),
      left: calc.multiply(vars.space.md, -2),
      margin: vars.space.md,
      width: calc.add("100%", calc.multiply(vars.space.md, 2)),
      height: calc.add("100%", calc.multiply(vars.space.md, 2)),
    },
  },
});

/**
 * @package
 */
export const decoration1 = style({
  position: "absolute",
  height: "32.8rem",
  width: "10000px",
  background: vars.pallets.accent1,
  transform: "rotate(-50deg)",
  transformOrigin: "top left",

  "@media": {
    [mediaQueries.xl]: {
      top: 700,
      left: -515,
      transform: "rotate(-42deg)",
    },
    [mediaQueries.lg]: {
      top: 2079,
      left: -515,
      transform: "rotate(-50deg)",
    },
    [mediaQueries.md]: {
      top: 1859,
      left: -565,
      transform: "rotate(-50deg)",
    },
    [mediaQueries.sm]: {
      top: 1826,
      left: -533,
      height: "12.8125rem",
      transform: "rotate(-53deg)",
    },
  },
});
/**
 * @package
 */
export const decoration2 = style({
  position: "absolute",
  "@media": {
    [mediaQueries.xl]: {
      top: 2865,
      left: 2360,
      height: "32.8rem",
      width: "10000px",
      background: vars.pallets.accent1,
      transform: "rotate(-147deg)",
      transformOrigin: "top left",
    },
    [mediaQueries.lg]: {
      display: "none",
    },
    [mediaQueries.md]: {
      display: "none",
    },
    [mediaQueries.sm]: {
      display: "none",
    },
  },
});

/**
 * @package
 */
export const decorationImageRoot = style({
  position: "absolute",
  zIndex: 0,
  userSelect: "none",
  pointerEvents: "none",

  "@media": {
    [mediaQueries.xl]: {
      bottom: 195,
      right: -540,
      width: "56.25rem",
    },
    [mediaQueries.lg]: {
      left: 18,
      bottom: -516,
      width: "68.25rem",
    },
    [mediaQueries.md]: {
      left: 40,
      bottom: -417,
      width: "72.25rem",
    },
    [mediaQueries.sm]: {
      left: -32,
      bottom: -147,
      width: "54.75rem",
    },
  },
});
/**
 * @package
 */
export const decorationImage = style([
  characterImage,
  {
    "@media": {
      [mediaQueries.xl]: {
        transform: "rotate(-144deg)",
      },
      [mediaQueries.lg]: {
        transform: "rotate(-97deg)",
      },
      [mediaQueries.md]: {
        transform: "rotate(-97deg)",
      },
      [mediaQueries.sm]: {
        transform: "rotate(-128deg)",
      },
    },
  },
]);

/**
 * @package
 */
export const characterImageRoot = style({
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
  containerName: firstViewContainer,
  containerType: "inline-size",
  position: "relative",
  width: "100%",
  isolation: "isolate",

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
export const heading1 = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),

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
export const anchorLink = style([
  commonLink,
  {
    display: "inline-block",
    color: vars.pallets.text.main,
  },
]);

globalStyle(`${anchorLink} > *`, {
  display: "inline-flex",
});

/**
 * @package
 */
export const section1 = style({
  "@media": {
    [mediaQueries.sm]: {
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.md, 2)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.md, 2)),
        },
      },
    },
  },
});

export const tileRoot = style({
  "@media": {
    [mediaQueries.xl]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.main})`,
      boxShadow: `0px ${vars.space.sx} ${vars.space.md} 0px ${vars.pallets.background.secondary}`,
    },
    [mediaQueries.lg]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.lg,
    },
    [mediaQueries.md]: {
      padding: calc.multiply(vars.space.md, 1.5),
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
    [mediaQueries.sm]: {
      padding: `${vars.space.sm} ${vars.space.md}`,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
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
  tileRoot,
  {
    position: "relative",
    zIndex: calc.add(characterLayer, 1),

    "@media": {
      [mediaQueries.xl]: {
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      },
      [mediaQueries.lg]: {
        marginTop: "23.75rem",
        width: "36.5625rem",
        borderRadius: vars.borderRadius.md,
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
      marginTop: calc.multiply(vars.space.md, 1.5),
      gap: vars.space.md,
    },
    [mediaQueries.lg]: {
      marginTop: calc.multiply(vars.space.md, 1.5),
      gap: vars.space.md,
    },
    [mediaQueries.md]: {
      marginTop: vars.space.md,
      gap: vars.space.sm,
    },
    [mediaQueries.sm]: {
      marginTop: vars.space.md,
      gap: vars.space.sm,
    },
  },
});

/**
 * @package
 */
export const worksWrapper = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),
});

/**
 * @package
 */
export const worksRoot = style([
  tileRoot,
  {
    "@media": {
      [mediaQueries.xl]: {
        marginTop: vars.space.xl,
        width: "58.875rem",
        borderRadius: `0px ${vars.space.md} ${vars.space.md} 0px`,
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
      },
      [mediaQueries.lg]: {
        marginTop: vars.space.xl,
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.md]: {
        marginTop: vars.space.lg,
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
        marginTop: vars.space.lg,
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
    },
  },
]);

/**
 * @package
 */
export const scrollArea = style([
  {
    overflowX: "scroll",
    display: "flex",

    scrollbarWidth: "none",
    "::-webkit-scrollbar": {
      display: "none",
    },
    ":focus-visible": focusRing,

    "@media": {
      [mediaQueries.xl]: {
        width: calc.add("100%", calc.multiply(vars.space.lg, 2)),
        margin: `0 ${calc.multiply(vars.space.lg, -1)}`,
        padding: `0 ${vars.space.lg}`,
        gap: vars.space.md,
        marginTop: vars.space.md,
      },
      [mediaQueries.lg]: {
        width: calc.add("100%", calc.multiply(vars.space.lg, 2)),
        margin: `0 ${calc.multiply(vars.space.lg, -1)}`,
        padding: `0 ${vars.space.lg}`,
        gap: vars.space.md,
        marginTop: vars.space.md,
      },
      [mediaQueries.md]: {
        width: calc.add("100%", calc.multiply(vars.space.md, 3)),
        margin: `0 ${calc.multiply(vars.space.md, -1.5)}`,
        padding: `0 ${calc.multiply(vars.space.md, 1.5)}`,
        gap: vars.space.md,
        marginTop: vars.space.md,
      },
      [mediaQueries.sm]: {
        width: calc.add("100%", calc.multiply(vars.space.sm, 2)),
        margin: `0 ${calc.multiply(vars.space.sm, -1)}`,
        padding: `0 ${calc.multiply(vars.space.sm, 1)}`,
        gap: vars.space.sm,
        marginTop: vars.space.md,
      },
    },
  },
]);

globalStyle(`${scrollArea} > *`, {
  flexShrink: 0,
});

/**
 * @package
 */
export const contactWrapper = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),

  "@media": {
    [mediaQueries.xl]: {
      display: "flex",
      justifyContent: "flex-end",
    },
    [mediaQueries.lg]: {
      display: "flex",
      justifyContent: "flex-end",
    },
  },
});

/**
 * @package
 */
export const contactRoot = style([
  tileRoot,
  {
    "@media": {
      [mediaQueries.xl]: {
        marginTop: vars.space.xl,
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      },
      [mediaQueries.lg]: {
        marginTop: vars.space.xl,
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "41.5rem",
      },
      [mediaQueries.md]: {
        marginTop: vars.space.lg,
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
        marginTop: vars.space.lg,
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
    },
  },
]);

/**
 * @package
 */
export const contactList = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: calc.multiply(vars.space.md, 1.5),
});

/**
 * @package
 */
export const icon = style({
  "@media": {
    [mediaQueries.xl]: {
      width: 44,
      height: 44,
    },
    [mediaQueries.lg]: {
      width: 44,
      height: 44,
    },
    [mediaQueries.md]: {
      width: 36,
      height: 36,
    },
    [mediaQueries.sm]: {
      width: 36,
      height: 36,
    },
  },
});
