/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["zustand"],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

module.exports = nextConfig;
