/** @type {Exclude<import('next').NextConfig["images"], undefined>} */
const config = {
  remotePatterns: [
    {
      hostname: "res.cloudinary.com",
    },
    {
      hostname: "static.sizu.me",
    },
  ],
  deviceSizes: [320, 420, 768, 800, 1024, 1200].flatMap((size) => [size, size * 2]),
};

export default config;
