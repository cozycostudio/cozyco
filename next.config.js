/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/discord",
        destination: "https://discord.gg/DgPwWzA7kF",
        permanent: true,
        basePath: false,
      },
      {
        source: "/twitter",
        destination: "https://twitter.com/quiltsonchain",
        permanent: true,
        basePath: false,
      },
      {
        source: "/opensea",
        destination: "https://opensea.io/collection/quilts-on-chain",
        permanent: true,
        basePath: false,
      },
      {
        source: "/contract",
        destination: `https://etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`,
        permanent: true,
        basePath: false,
      },
      {
        source: "/poetry",
        destination: "/community",
        permanent: true,
      },
    ];
  },
};
