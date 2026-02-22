/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com", // <-- change to your actual domain
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/yellocricket2025/**',
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      
    ],
  },
};

module.exports = nextConfig;