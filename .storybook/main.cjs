const path = require("path");
const { loadConfigFromFile, mergeConfig } = require("vite");
const baseURL = process.env.STORYBOOK_BASE ?? "/"

/** @type {import("@storybook/react/types").StorybookConfig} */
const config = {
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
      base: baseURL,
    });
  },
  managerHead(head) {
    console.log(head, baseURL)

    return `
      ${head}
      <link rel="icon" href="${baseURL}/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="${baseURL}/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="${baseURL}/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="${baseURL}/favicon-16x16.png" />
      <link rel="manifest" href="${baseURL}/site.webmanifest" />
    `
  }
};

module.exports = config;
