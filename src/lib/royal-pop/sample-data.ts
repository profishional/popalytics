import {
  normalizeListing,
  ROYAL_POP_MODELS,
  type MarketplaceSource,
  type NormalizedListing,
  type RawListing,
  type RoyalPopModelId,
} from "./pricing";

export interface MarketplaceStrategy {
  source: string;
  priority: "MVP";
  access: string;
  region: string;
  cadence: string;
  reliability: "High" | "Medium";
  notes: string;
  url: string;
  exampleListingUrl: string;
  scrapingMethods: string[];
}

const STOCKX_URLS: Record<RoyalPopModelId, string> = {
  "otto-rosso":
    "https://stockx.com/en-gb/swatch-x-audemars-piguet-bioceramic-royal-pop-otto-rosso-ssx03r100n-pink",
  "huit-blanc":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-huit-blanc-ssx03w100n-white",
  "green-eight":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-green-eight-ssx03g100n-green",
  "blaue-acht":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-blaue-acht-ssx03l101n-lime-green",
  "lan-ba":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-savonnette-lan-ba-ssx03l100n-blue",
  "otg-roz":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-savonnette-otg-roz-ssx03j100n-blue",
  "ocho-negro":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-ocho-negro-ssx03w101n-black",
  "orenji-hachi":
    "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-orenji-hachi-ssx03l103n-black",
};

const EBAY_URLS: Record<RoyalPopModelId, string> = {
  "otto-rosso": "https://www.ebay.it/p/5093999759?iid=336585812007",
  "huit-blanc": "https://www.ebay.it/p/5093999759?iid=336585812007",
  "green-eight": "https://www.ebay.it/p/5093999759?iid=336585812007",
  "blaue-acht": "https://www.ebay.it/p/5093999759?iid=336585812007",
  "lan-ba": "https://www.ebay.it/p/17090904676?iid=406929469458",
  "otg-roz": "https://www.ebay.it/p/5093999759?iid=336585812007",
  "ocho-negro": "https://www.ebay.it/itm/157908569194",
  "orenji-hachi": "https://www.ebay.it/p/5093999759?iid=336585812007",
};

const OLX_URLS: Record<RoyalPopModelId, string> = {
  "otto-rosso":
    "https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic",
  "huit-blanc":
    "https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic",
  "green-eight":
    "https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic",
  "blaue-acht":
    "https://www.olx.pt/d/anuncio/audemars-piguet-x-swatch-IDJoMwJ.html?search_reason=search%7Corganic",
  "lan-ba":
    "https://www.olx.pl/d/oferta/swatch-x-audemars-piguet-royal-pop-nowosc-16-05-model-do-wyboru-CID87-ID1aDUyv.html",
  "otg-roz":
    "https://www.olx.pl/d/oferta/audemars-piguet-x-swatch-royal-pop-royal-pop-CID87-ID1aBSu4.html",
  "ocho-negro":
    "https://www.olx.pl/d/oferta/swatch-x-ap-royal-pop-new-presale-16th-may-2026-black-colour-ocho-negro-CID4042-ID1aCaS2.html",
  "orenji-hachi":
    "https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic",
};

const CHRONO24_URLS: Record<RoyalPopModelId, string> = {
  "otto-rosso": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "huit-blanc": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "green-eight": "https://www.chrono24.com/swatch/pocket-watch-swatch-royal-pop--id46233608.htm",
  "blaue-acht": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "lan-ba": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "otg-roz": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "ocho-negro": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
  "orenji-hachi": "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
};

const CURRENT_ASK_EUR: Record<RoyalPopModelId, number> = {
  "otto-rosso": 1288,
  "huit-blanc": 1055,
  "green-eight": 1115,
  "blaue-acht": 1276,
  "lan-ba": 1290,
  "otg-roz": 1293,
  "ocho-negro": 1040,
  "orenji-hachi": 1231,
};

const DATE_MULTIPLIERS = [
  ["2026-05-13T09:00:00.000Z", 1.18],
  ["2026-05-14T09:00:00.000Z", 1.07],
  ["2026-05-15T09:00:00.000Z", 0.98],
  ["2026-05-16T09:00:00.000Z", 1],
] as const;

const SOURCE_FEEDS: Array<{
  source: Extract<MarketplaceSource, "chrono24" | "olx" | "stockx" | "ebay">;
  priceMultiplier: number;
  currency: RawListing["priceCurrency"];
  urlForModel: (modelId: RoyalPopModelId) => string;
  country: string;
}> = [
  {
    source: "stockx",
    priceMultiplier: 1.01,
    currency: "USD",
    urlForModel: (modelId) => STOCKX_URLS[modelId],
    country: "US",
  },
  {
    source: "ebay",
    priceMultiplier: 0.96,
    currency: "EUR",
    urlForModel: (modelId) => EBAY_URLS[modelId],
    country: "IT",
  },
  {
    source: "chrono24",
    priceMultiplier: 1.16,
    currency: "EUR",
    urlForModel: (modelId) => CHRONO24_URLS[modelId],
    country: "FR",
  },
  {
    source: "olx",
    priceMultiplier: 0.82,
    currency: "EUR",
    urlForModel: (modelId) => OLX_URLS[modelId],
    country: "PT",
  },
];

const RAW_LISTINGS: RawListing[] = ROYAL_POP_MODELS.flatMap((model) =>
  DATE_MULTIPLIERS.flatMap(([observedAt, dateMultiplier]) =>
    SOURCE_FEEDS.map((feed) => {
      const eurPrice = CURRENT_ASK_EUR[model.id] * dateMultiplier * feed.priceMultiplier;
      const priceAmount =
        feed.currency === "USD" ? Math.round(eurPrice / 0.86) : Math.round(eurPrice);

      return {
        source: feed.source,
        sourceListingId: `${feed.source}-${model.reference}-${observedAt.slice(0, 10)}`,
        title: `Swatch x Audemars Piguet Royal Pop ${model.name} ${model.reference}`,
        priceAmount,
        priceCurrency: feed.currency,
        observedAt,
        url: feed.urlForModel(model.id),
        country: feed.country,
        condition: "New",
      };
    }),
  ),
);

export const normalizedListings: NormalizedListing[] = RAW_LISTINGS.map(normalizeListing);

export const marketplaceStrategies: MarketplaceStrategy[] = [
  {
    source: "Chrono24",
    priority: "MVP",
    access: "Apify or controlled HTML scraper",
    region: "Global watch marketplace",
    cadence: "Every 3h",
    reliability: "Medium",
    notes:
      "Strong watch-specific liquidity. Start with Apify/Bright Data if blocking appears; keep a local parser for listing-page JSON and HTML.",
    url: "https://www.chrono24.com/swatch/royal-pop--mod3331.htm",
    exampleListingUrl:
      "https://www.chrono24.com/swatch/pocket-watch-swatch-royal-pop--id46233608.htm",
    scrapingMethods: [
      "Apify Chrono24 actor or Bright Data scraper API",
      "Our Playwright/curl_cffi scraper with rate limits",
    ],
  },
  {
    source: "OLX",
    priority: "MVP",
    access: "OLX API request plus scraper fallback",
    region: "Portugal and Poland",
    cadence: "Every 2h",
    reliability: "Medium",
    notes:
      "Portugal is required for local signal. Use official OLX developer access when approved; otherwise scrape public listing/search pages conservatively.",
    url: "https://www.olx.pt/",
    exampleListingUrl:
      "https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic",
    scrapingMethods: [
      "Official OLX developer API when access is granted",
      "Apify OLX actor",
      "Our HTTP/Playwright scraper for public listing pages",
    ],
  },
  {
    source: "StockX",
    priority: "MVP",
    access: "Apify actor or product-page scraper",
    region: "Global resale marketplace",
    cadence: "Every 1h",
    reliability: "Medium",
    notes:
      "Best source for lowest ask, last sale, bid/ask spread, and sales-count signals. Use product URLs by reference to avoid noisy keyword search.",
    url: "https://stockx.com/dp/swatch-x-audemars-piguet-royal-pop",
    exampleListingUrl:
      "https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-savonnette-lan-ba-ssx03l100n-blue",
    scrapingMethods: [
      "Apify StockX product/details actor",
      "Our Next-data/product-page scraper with residential proxy only when needed",
    ],
  },
  {
    source: "eBay",
    priority: "MVP",
    access: "Official API plus GitHub client",
    region: "EU and global",
    cadence: "Every 1h",
    reliability: "High",
    notes:
      "Use the official Browse API first for live listings; add Marketplace Insights if sold-listing access is approved.",
    url: "https://developer.ebay.com/api-docs/buy/api-browse.html",
    exampleListingUrl: "https://www.ebay.it/p/17090904676?iid=406929469458",
    scrapingMethods: [
      "Official eBay Browse API",
      "GitHub CLI/library: hendt/ebay-api",
      "Apify eBay actor as fallback for search/listing pages",
    ],
  },
];

export const royalPopModels = ROYAL_POP_MODELS;
