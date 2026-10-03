import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the "N" dev badge. Compile and runtime errors are still shown in development.
  devIndicators: false,
  // React Email renders with react-dom/server, which refuses to load inside the
  // Server Components bundle that Route Handlers use. Loading these with plain
  // Node require keeps transactional emails working (lib/email/send.ts).
  serverExternalPackages: ["@react-email/components", "@react-email/render"],
  // The job OG image reads these with fs at runtime; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/jobs/[id]/opengraph-image": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
