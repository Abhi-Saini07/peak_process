import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the "N" dev badge. Compile and runtime errors are still shown in development.
  devIndicators: false,
  // The job OG image reads these with fs at runtime; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/jobs/[id]/opengraph-image": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
