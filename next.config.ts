import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/textures/:path*.pmtiles",
      headers: [
        { key: "Content-Type", value: "application/x-protomaps" },
        { key: "Accept-Ranges", value: "bytes" },
      ],
    },
  ],
};

export default nextConfig;
