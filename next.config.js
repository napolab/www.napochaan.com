import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const withVanillaExtract = createVanillaExtractPlugin();

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200].flatMap((size) => [size, size * 2]),
    remotePatterns: [
      {
        hostname: "imagedelivery.net",
      },
    ],
  },
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

    return config;
  },
};

export default withVanillaExtract(nextConfig);
