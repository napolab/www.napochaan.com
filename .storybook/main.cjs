const path = require("path");
const { loadConfigFromFile, mergeConfig } = require("vite");
const baseURL = process.env.STORYBOOK_BASE ?? "/";

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
    return `
      ${head}
      <link rel="icon" href="${baseURL}/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="${baseURL}/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="${baseURL}/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="${baseURL}/favicon-16x16.png" />
      <link rel="manifest" href="${baseURL}/site.webmanifest" />
      <meta name="theme-color" content="#ffffff" />

      <meta property="og:type" content="website" />
      <meta property="og:title" content="napochaan UI catalog website" />
      <meta property="og:url" content="${baseURL}" />
      <meta property="og:image" content="${baseURL}/storybook-ogp.png" />
      <meta property="og:description" content="UI catalog created by @naporin24690." />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="napochaan UI catalog website" />
      <meta name="twitter:image" content="${baseURL}/storybook-ogp.png" />
      <meta name="twitter:description" content="@naporin24690 が作った UI カタログ" />
      <meta name="twitter:site" content="@naporin24690" />
      <meta name="twitter:creator" content="@naporin24690" />
    `;
  },
};

module.exports = config;
