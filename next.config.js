/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['s4.anilist.co'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['postcss-loader'],
    });
    return config;
  },
}

module.exports = nextConfig