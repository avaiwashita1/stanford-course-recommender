import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: we intentionally leave Next.js's newer "Cache Components" mode off.
  // Almost every page here depends on the signed-in user, so plain dynamic
  // rendering is simpler to reason about.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
