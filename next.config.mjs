/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "tripolimedia.com" }],
        destination: "https://tripoli.media/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tripolimedia.com" }],
        destination: "https://tripoli.media/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
