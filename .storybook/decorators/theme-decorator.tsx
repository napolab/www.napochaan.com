import React from "react";
import { useDarkMode } from "storybook-dark-mode";
import { ThemeProvider } from "../../src/theme";

export const themeDecorator = (Story) => {
  return (
    <ThemeProvider theme={useDarkMode() ? "dark" : "light"}>
      <Story />
    </ThemeProvider>
  );
};
