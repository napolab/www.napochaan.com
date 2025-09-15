import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import path from "path";

import images from "./next-image.config.js";

const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  images,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
          },
        },
      ],
    });

    // Add path alias resolution for vanilla-extract
    config.resolve.alias = {
      ...config.resolve.alias,
      "@theme": path.resolve("./src/theme"),
      "@assets": path.resolve("./src/assets"),
      "@hooks": path.resolve("./src/hooks"),
      "@components": path.resolve("./src/components"),
      "@utils": path.resolve("./src/utils"),
      "@adapters": path.resolve("./src/adapters"),
    };

    return config;
  },
};

export default withVanillaExtract(nextConfig);
void initOpenNextCloudflareForDev();
