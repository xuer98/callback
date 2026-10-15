import type { NextConfig } from "next";
import { MOVED_TO_LEETCODE } from "./src/lib/seed-company-questions";
import { leetcodeUrl } from "./src/lib/types";

const nextConfig: NextConfig = {
  // The preview-runtime route bundles React for the sandboxed preview iframe
  // with esbuild; its platform binary must stay a runtime require.
  serverExternalPackages: ["esbuild"],
  async redirects() {
    // /questions merged into /problems; query strings carry over unchanged.
    return [
      { source: "/questions", destination: "/problems", permanent: true },
      // Duplicate problems folded into their survivors (MERGED_SLUGS in
      // src/db/seed.ts).
      {
        source: "/problems/conflict-with-colleague-or-stakeholder",
        destination: "/problems/conflict-with-teammate",
        permanent: true,
      },
      {
        source: "/problems/run-length-compress",
        destination: "/problems/run-length-encode-decode",
        permanent: true,
      },
      // Authored copies of LeetCode questions that moved into the listings
      // (MOVED_TO_LEETCODE in src/lib/seed-company-questions.ts). Temporary,
      // so a slug can come back to the bank without a cached redirect.
      ...Object.entries(MOVED_TO_LEETCODE).map(([from, to]) => ({
        source: `/problems/${from}`,
        destination: leetcodeUrl(to),
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
