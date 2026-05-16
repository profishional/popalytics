import type { MarketplaceSource, RoyalPopModel, RoyalPopModelId } from "./pricing";

export type CollectorAccess = "api" | "html" | "managed-scraper";
export type CollectorMethod = "github-cli" | "apify" | "webscrape";

export interface CollectorJob {
  source: MarketplaceSource;
  modelId: RoyalPopModelId;
  access: CollectorAccess;
  method: CollectorMethod;
  cadenceMinutes: number;
  priority: "mvp" | "phase-2";
  url: string;
  queries: string[];
  notes: string;
}

interface CollectorBlueprint {
  source: MarketplaceSource;
  access: CollectorAccess;
  method: CollectorMethod;
  cadenceMinutes: number;
  priority: "mvp" | "phase-2";
  buildUrl: (model: RoyalPopModel, primaryQuery: string) => string;
  notes: string;
}

const COLLECTOR_BLUEPRINTS: CollectorBlueprint[] = [
  {
    source: "ebay",
    access: "api",
    method: "github-cli",
    cadenceMinutes: 120,
    priority: "mvp",
    buildUrl: (model, primaryQuery) =>
      buildEbayBrowseUrl(model, primaryQuery, "EBAY_DE").toString(),
    notes:
      "Official Browse API through our CLI or hendt/ebay-api. Add Marketplace Insights after approval for sold comps.",
  },
  {
    source: "chrono24",
    access: "html",
    method: "apify",
    cadenceMinutes: 360,
    priority: "mvp",
    buildUrl: (_model, primaryQuery) =>
      `https://www.chrono24.com/search/index.htm?query=${encodeURIComponent(primaryQuery)}`,
    notes:
      "Watch-specific liquidity. Prefer Apify/Bright Data first, then persist raw HTML for parser audits.",
  },
  {
    source: "olx",
    access: "api",
    method: "webscrape",
    cadenceMinutes: 180,
    priority: "mvp",
    buildUrl: (_model, primaryQuery) =>
      `https://www.olx.pt/items/q-${encodeURIComponent(primaryQuery).replaceAll("%20", "-")}/`,
    notes: "Portugal-first source. Prefer OLX developer API; HTML fallback if access blocks launch.",
  },
  {
    source: "stockx",
    access: "managed-scraper",
    method: "apify",
    cadenceMinutes: 360,
    priority: "mvp",
    buildUrl: (_model, primaryQuery) =>
      `https://stockx.com/search?s=${encodeURIComponent(primaryQuery)}`,
    notes:
      "Use Apify StockX product/details actors first; fallback to our product-page scraper for Next data.",
  },
];

export function buildSearchQuerySet(model: RoyalPopModel): string[] {
  return [
    `swatch royal pop ${model.name}`,
    `audemars piguet swatch ${model.name}`,
    `swatch ap ${model.reference}`,
    model.reference,
  ];
}

export function buildEbayBrowseUrl(
  _model: RoyalPopModel,
  query: string,
  marketplace = "EBAY_DE",
): URL {
  // eBay marketplace selection is sent as the X-EBAY-C-MARKETPLACE-ID header.
  void marketplace;

  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "50");
  url.searchParams.set("filter", "conditions:{NEW|USED}");
  url.searchParams.set("fieldgroups", "EXTENDED");

  return url;
}

export function buildCollectorJobs(models: RoyalPopModel[]): CollectorJob[] {
  return models.flatMap((model) => {
    const queries = buildSearchQuerySet(model);
    const primaryQuery = queries[0];

    return COLLECTOR_BLUEPRINTS.map((blueprint) => ({
      source: blueprint.source,
      modelId: model.id,
      access: blueprint.access,
      method: blueprint.method,
      cadenceMinutes: blueprint.cadenceMinutes,
      priority: blueprint.priority,
      url: blueprint.buildUrl(model, primaryQuery),
      queries,
      notes: blueprint.notes,
    }));
  });
}
