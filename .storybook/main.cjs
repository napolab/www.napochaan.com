const path = require("path");
const { loadConfigFromFile, mergeConfig } = require("vite");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "storybook-dark-mode", "@storybook/addon-a11y"],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-vite",
  },
  features: {
    storyStoreV7: true,
  },
  async viteFinal(config) {
    /** @type {{ config: import("vite").UserConfig }} */
    const { config: userConfig } = await loadConfigFromFile(path.resolve(__dirname, "../vite.config.ts"));

    return mergeConfig(config, {
      ...userConfig,
    });
  },
};
