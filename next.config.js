/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.html$/i,
      loader: "html-loader",
    });

    return config;
  },
  async redirects() {
    return [
      {
        source: "/s/discord",
        destination: "https://discord.gg/DgPwWzA7kF",
        permanent: true,
        basePath: false,
      },
      {
        source: "/s/twitter",
        destination: "https://twitter.com/cozycostudio",
        permanent: true,
        basePath: false,
      },
      {
        source: "/s/quilts",
        destination: "https://quilts.art",
        permanent: true,
        basePath: false,
      },
    ];
  },
};
