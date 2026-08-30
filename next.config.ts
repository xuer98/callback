import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The preview-runtime route bundles React for the sandboxed preview iframe
  // with esbuild; its platform binary must stay a runtime require.
  serverExternalPackages: ["esbuild"],
  async redirects() {
    // /questions merged into /problems; query strings carry over unchanged.
    return [
      { source: "/questions", destination: "/problems", permanent: true },
    ];
  },
};

export default nextConfig;
