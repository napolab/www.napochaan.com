import { createGlobalTheme, createGlobalThemeContract } from "@vanilla-extract/css";

export const vars = createGlobalThemeContract(
  {
    pallets: {
      text: {
        primary: null,
      },

      background: {
        primary: null,
      },
    },
    space: {
      small: null,
      medium: null,
      large: null,
    },
  },
  (_, path) => path.join("-"),
);

createGlobalTheme(":host", vars.space, {
  small: "0.25rem",
  medium: "0.25rem",
  large: "0.75rem",
});
