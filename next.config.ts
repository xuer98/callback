import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The preview-runtime route bundles React for the sandboxed preview iframe
  // with esbuild; its platform binary must stay a runtime require.
  serverExternalPackages: ["esbuild"],
};

export default nextConfig;
