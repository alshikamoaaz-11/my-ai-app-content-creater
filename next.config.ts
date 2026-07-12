import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // style_dna.md is read at runtime (src/lib/styleDna.ts) via process.cwd().
  // Ensure it is traced into the serverless bundles for the generation routes,
  // otherwise production silently falls back to the short inline DNA.
  outputFileTracingIncludes: {
    "/api/**": ["./style_dna.md"],
  },
};

export default nextConfig;
