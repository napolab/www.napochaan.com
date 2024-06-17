import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars, fillImage } from "@theme/css";
export { anchorLink, textLink, fillImage, link } from "@theme/css";

const characterLayer = createVar();
const fixedLayer = createVar();

/**
 * @package
 */
export const pageRoot = style({
  vars: {
    [characterLayer]: "2",
    [fixedLayer]: "10",
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
export const switchTheme = style({
  position: "fixed",
  zIndex: fixedLayer,

  "@media": {
    [mediaQueries.xl]: {
      right: calc.divide(
        calc.subtract("100%", `min(1440px, ${calc.subtract("100vw", calc.multiply(vars.space.lg, 2))})`),
        2,
      ),
      bottom: vars.space.md,
    },
    [mediaQueries.lg]: {
      right: vars.space.lg,
      bottom: vars.space.md,
    },
    [mediaQueries.md]: {
      right: vars.space.lg,
      bottom: vars.space.md,
    },
    [mediaQueries.sm]: {
      right: vars.space.md,
      bottom: vars.space.md,
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
      borderRadius: vars.borderRadius.lg,
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
  fillImage,
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
export const section1 = style({
  "@media": {
    [mediaQueries.sm]: {
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.md, 1)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.md, 1)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const section2 = style({
  "@media": {
    [mediaQueries.xl]: {
      marginTop: vars.space.xl,
    },
    [mediaQueries.lg]: {
      marginTop: vars.space.xl,
    },
    [mediaQueries.md]: {
      marginTop: vars.space.lg,
    },
    [mediaQueries.sm]: {
      marginTop: vars.space.lg,
    },
  },
});

/**
 * @package
 */
export const section3 = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,

  "@media": {
    [mediaQueries.md]: {
      gap: vars.space.xs,
    },
    [mediaQueries.sm]: {
      gap: vars.space.xs,
    },
  },
});

export const tile = style({
  "@media": {
    [mediaQueries.xl]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.main})`,
      boxShadow: `0px ${vars.space.xs} ${vars.space.md} 0px ${vars.pallets.background.secondary}`,
    },
    [mediaQueries.lg]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.lg,
    },
    [mediaQueries.md]: {
      padding: calc.multiply(vars.space.md, 1.5),
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
    [mediaQueries.sm]: {
      padding: `${vars.space.sm} ${vars.space.md}`,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
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

/**
 * @package
 */
export const worksWrapper = style([
  section2,
  {
    position: "relative",
    zIndex: calc.subtract(characterLayer, 1),
  },
]);

/**
 * @package
 */
export const worksRoot = style([
  tile,
  {
    "@media": {
      [mediaQueries.xl]: {
        width: "58.875rem",
        borderRadius: `0px ${vars.space.md} ${vars.space.md} 0px`,
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
      },
      [mediaQueries.lg]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.md]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
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
export const contactWrapper = style([
  section2,
  {
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
  },
]);

/**
 * @package
 */
export const contactRoot = style([
  tile,
  {
    "@media": {
      [mediaQueries.xl]: {
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      },
      [mediaQueries.lg]: {
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "41.5rem",
      },
      [mediaQueries.md]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
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
export const contactItem = style({
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

/**
 * @package
 */
export const dialogContent = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: vars.space.md,
});

/**
 * @package
 */
export const dialogHeroImage = style({
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: vars.borderRadius.sm,
  overflow: "hidden",
  background: vars.pallets.background.main,
  boxShadow: vars.pallets.shadow,
  cursor: "pointer",
});

/**
 * @package
 */
export const description = style({
  width: "100%",
  lineHeight: 1.8,
  letterSpacing: 1.2,
  whiteSpace: "pre-wrap",
});
