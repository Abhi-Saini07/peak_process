import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the "N" dev badge. Compile and runtime errors are still shown in development.
  devIndicators: false,
};

export default nextConfig;
