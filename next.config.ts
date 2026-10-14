import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Hide the floating dev-tools badge so it never overlaps app UI (footer)
  devIndicators: false,
};

export default nextConfig;
