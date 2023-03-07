import type { Theme } from "./provider";

export const getSystemTheme = (fallback: Theme): Theme => {
  if (typeof window === "undefined") return fallback;

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const easing = {
  easeInOutCirc: "cubic-bezier(0.79,0.14,0.15,0.86)",
};
