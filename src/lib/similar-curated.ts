import type { Problem } from "./types";

// Hand-picked neighbours for the problems the scorer in similar-problems.ts
// cannot place well: the system-design prompts, which share a theme (feeds,
// storage, pipelines, tokens) far more than they share words. Each entry
// lists a problem's closest few, best first; the relation is read both
// ways, so a pair needs writing once. Curated neighbours come before the
// computed ones on the page. The seed refuses a slug that no longer exists,
// a cross-category pair, or a problem listing itself.

// prettier-ignore
export const curatedSimilar: Record<string, string[]> = {
  "design-rate-limiter": ["design-global-quota-system", "design-ad-click-aggregator", "design-acl-check-service"],
  "design-url-shortener": ["design-distributed-kv-store", "design-digit-square-service", "design-web-crawler"],
  "design-news-feed": ["design-pinterest-home-feed", "design-notification-system", "design-photo-sharing-frontend", "design-local-business-reviews"],
  "design-pinterest-home-feed": ["design-news-feed", "design-visual-search", "design-notification-system"],
  "design-notification-system": ["design-news-feed", "design-pinterest-home-feed", "design-ads-event-reporting"],
  "design-search-typeahead": ["design-autocomplete-frontend", "design-visual-search", "design-marketplace-catalog", "design-local-business-reviews"],
  "design-ads-event-reporting": ["design-ad-click-aggregator", "design-distributed-metrics-system", "design-centralized-logging"],
  "design-catalog-update-pipeline": ["design-marketplace-catalog", "design-ticket-to-pull-request-pipeline", "design-cloud-queue-service", "design-distributed-job-scheduler"],
  "design-image-upload-serving": ["design-blob-storage", "design-cloud-photo-sync", "design-video-sharing-platform", "design-photo-sharing-frontend"],
  "design-pins-boards-data-model": ["design-marketplace-catalog", "design-metadata-catalog-schema-registry", "design-distributed-kv-store", "design-local-business-reviews"],
  "design-visual-search": ["design-search-typeahead", "design-ml-evaluation-platform", "design-pinterest-home-feed", "design-media-migration-gpu-pipeline"],
  "design-blob-storage": ["design-cloud-photo-sync", "design-file-sync-service", "design-image-upload-serving", "design-distributed-kv-store", "design-multi-tenant-analytics-platform"],
  "design-media-migration-gpu-pipeline": ["design-blob-storage", "design-ml-evaluation-platform", "design-video-sharing-platform"],
  "design-ml-evaluation-platform": ["design-visual-search", "design-media-migration-gpu-pipeline", "design-query-execution-service"],
  "design-cloud-photo-sync": ["design-file-sync-service", "design-blob-storage", "design-wallpaper-sync", "design-image-upload-serving"],
  "design-centralized-logging": ["design-audit-log-service", "design-distributed-metrics-system", "design-client-logging-library", "design-ads-event-reporting"],
  "design-wallpaper-sync": ["design-cloud-photo-sync", "design-file-sync-service", "design-client-logging-library", "design-music-streaming-frontend"],
  "design-election-voting-apis": ["design-wallet-monolith-migration", "two-phase-commit-explained", "design-rpc-layer-over-rest", "design-audit-log-service"],
  "design-ad-click-aggregator": ["design-ads-event-reporting", "design-rate-limiter", "design-distributed-metrics-system", "design-count-nodes-in-server-tree"],
  "design-file-sync-service": ["design-cloud-photo-sync", "design-blob-storage", "design-wallpaper-sync"],
  "design-disk-based-inventory": ["design-distributed-kv-store", "design-multi-tenant-analytics-platform", "design-blob-storage"],
  "design-digit-square-service": ["design-url-shortener", "design-rate-limiter", "design-token-service-client"],
  "design-video-sharing-platform": ["design-image-upload-serving", "design-music-streaming-frontend", "design-blob-storage", "design-photo-sharing-frontend"],
  "design-marketplace-catalog": ["design-pins-boards-data-model", "design-catalog-update-pipeline", "design-search-typeahead", "design-metadata-catalog-schema-registry"],
  "design-smartwatch-sensor-subsystem": ["design-wallpaper-sync", "design-client-logging-library"],
  "design-local-business-reviews": ["design-news-feed", "design-search-typeahead", "design-marketplace-catalog", "design-pins-boards-data-model"],
  "design-wallet-monolith-migration": ["two-phase-commit-explained", "design-election-voting-apis", "design-cloud-queue-service", "design-global-quota-system"],
  "design-autocomplete-frontend": ["design-search-typeahead", "design-data-table-component", "design-photo-sharing-frontend"],
  "design-music-streaming-frontend": ["design-video-sharing-platform", "design-photo-sharing-frontend", "design-wallpaper-sync", "design-collaborative-spreadsheet"],
  "design-photo-sharing-frontend": ["design-image-upload-serving", "design-news-feed", "design-music-streaming-frontend", "design-data-table-component"],
  "design-distributed-job-scheduler": ["design-cloud-queue-service", "design-ticket-to-pull-request-pipeline", "design-multi-core-startup-scheduler", "design-query-execution-service", "design-cluster-control-plane"],
  "design-distributed-kv-store": ["design-blob-storage", "raft-explained", "design-disk-based-inventory", "design-url-shortener", "design-cluster-control-plane"],
  "design-acl-check-service": ["design-token-service-client", "design-api-with-flaky-identity-provider", "design-rate-limiter", "design-global-quota-system"],
  "design-cloud-queue-service": ["design-distributed-job-scheduler", "design-count-nodes-in-server-tree", "design-ticket-to-pull-request-pipeline", "design-catalog-update-pipeline"],
  "design-cluster-control-plane": ["raft-explained", "design-distributed-job-scheduler", "design-multi-core-startup-scheduler", "design-distributed-kv-store"],
  "design-audit-log-service": ["design-centralized-logging", "design-election-voting-apis", "design-metadata-catalog-schema-registry", "design-distributed-metrics-system"],
  "design-ticket-to-pull-request-pipeline": ["design-query-execution-service", "design-cloud-queue-service", "design-distributed-job-scheduler", "design-catalog-update-pipeline"],
  "design-rpc-layer-over-rest": ["design-token-service-client", "design-api-with-flaky-identity-provider", "design-client-logging-library", "design-count-nodes-in-server-tree"],
  "design-client-logging-library": ["design-centralized-logging", "design-rpc-layer-over-rest", "design-token-service-client", "design-wallpaper-sync"],
  "design-token-service-client": ["design-api-with-flaky-identity-provider", "design-acl-check-service", "design-rpc-layer-over-rest", "design-client-logging-library"],
  "design-global-quota-system": ["design-rate-limiter", "design-acl-check-service", "design-multi-tenant-analytics-platform", "design-ad-click-aggregator"],
  "design-distributed-metrics-system": ["design-centralized-logging", "design-ads-event-reporting", "design-audit-log-service", "design-ad-click-aggregator"],
  "design-web-crawler": ["design-url-shortener", "design-distributed-job-scheduler", "design-cloud-queue-service"],
  "design-count-nodes-in-server-tree": ["design-cloud-queue-service", "design-rpc-layer-over-rest", "design-cluster-control-plane", "design-ad-click-aggregator"],
  "two-phase-commit-explained": ["raft-explained", "design-wallet-monolith-migration", "design-distributed-kv-store", "design-election-voting-apis"],
  "raft-explained": ["two-phase-commit-explained", "design-cluster-control-plane", "design-distributed-kv-store"],
  "design-query-execution-service": ["design-ticket-to-pull-request-pipeline", "design-multi-tenant-analytics-platform", "design-distributed-job-scheduler", "design-ml-evaluation-platform"],
  "design-multi-tenant-analytics-platform": ["design-query-execution-service", "design-metadata-catalog-schema-registry", "design-materialized-view-dag-cache", "design-blob-storage", "design-global-quota-system"],
  "design-metadata-catalog-schema-registry": ["design-multi-tenant-analytics-platform", "design-materialized-view-dag-cache", "design-marketplace-catalog", "design-pins-boards-data-model"],
  "design-materialized-view-dag-cache": ["design-multi-tenant-analytics-platform", "design-metadata-catalog-schema-registry", "design-multi-core-startup-scheduler", "design-query-execution-service"],
  "design-multi-core-startup-scheduler": ["design-distributed-job-scheduler", "design-materialized-view-dag-cache", "design-cluster-control-plane"],
  "design-api-with-flaky-identity-provider": ["design-token-service-client", "design-acl-check-service", "design-rpc-layer-over-rest"],
  "design-collaborative-spreadsheet": ["design-data-table-component", "design-materialized-view-dag-cache", "design-music-streaming-frontend"],
  "design-data-table-component": ["design-collaborative-spreadsheet", "design-autocomplete-frontend", "design-photo-sharing-frontend"],
};

/**
 * A problem's curated neighbours, own list first and then the problems
 * that list it, without repeats. Slugs only; the caller drops any that no
 * longer resolve.
 */
export function curatedNeighbours(slug: string): string[] {
  const out = new Set(curatedSimilar[slug] ?? []);
  for (const [other, list] of Object.entries(curatedSimilar)) {
    if (other !== slug && list.includes(slug)) out.add(other);
  }
  out.delete(slug);
  return [...out];
}

/** Fails the seed on a stale slug, a cross-category pair or a self-reference. */
export function checkCuratedSimilar(problems: readonly Problem[]): void {
  const category = new Map(problems.map((p) => [p.slug, p.category]));
  for (const [slug, list] of Object.entries(curatedSimilar)) {
    const own = category.get(slug);
    if (own === undefined) {
      throw new Error(`similar-curated: no problem has the slug "${slug}"`);
    }
    for (const other of list) {
      if (other === slug) {
        throw new Error(`similar-curated: "${slug}" lists itself`);
      }
      const theirs = category.get(other);
      if (theirs === undefined) {
        throw new Error(
          `similar-curated: "${slug}" lists an unknown problem "${other}"`,
        );
      }
      if (theirs !== own) {
        throw new Error(
          `similar-curated: "${slug}" (${own}) lists "${other}" (${theirs})`,
        );
      }
    }
  }
}
