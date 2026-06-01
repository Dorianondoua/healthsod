import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.154.1"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
