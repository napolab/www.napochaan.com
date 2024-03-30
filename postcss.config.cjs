module.exports = {
  plugins: [
    "autoprefixer",
    "postcss-flexbugs-fixes",
    "postcss-media-minmax",
    "postcss-gap-properties",
    [
      "postcss-preset-env",
      {
        autoprefixer: {
          flexbox: "no-2009",
        },
        stage: 3,
        features: {
          "custom-properties": false,
        },
      },
    ],
    [
      "postcss-dark-theme-class",
      {
        darkSelector: ".dark",
        lightSelector: ".light",
      },
    ],
  ],
};
