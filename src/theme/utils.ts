import type { Theme } from "./provider";

export const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const easing = {
  easeInOutCirc: "cubic-bezier(0.79,0.14,0.15,0.86)",
};
