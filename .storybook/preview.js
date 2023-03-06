import { themeDecorator } from "./decorators/theme-decorator";
import { headingLevelDecorator } from "./decorators/heading-level-decorator";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [themeDecorator, headingLevelDecorator];
