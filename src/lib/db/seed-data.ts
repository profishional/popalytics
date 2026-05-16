import {
  marketplaceStrategies,
  rawMarketListings,
  royalPopModels,
} from "../royal-pop/sample-data";
import {
  normalizeListing,
  type MarketplaceSource,
  type NormalizedListing,
  type RawListing,
  type RoyalPopModel,
  type RoyalPopModelId,
} from "../royal-pop/pricing";
import type { MarketplaceStrategy } from "../royal-pop/sample-data";

export interface ModelSeedRow extends RoyalPopModel {
  rawPayload: RoyalPopModel;
}

export interface MarketplaceSeedRow {
  id: Extract<MarketplaceSource, "chrono24" | "olx" | "stockx" | "ebay">;
  displayName: string;
  priority: MarketplaceStrategy["priority"];
  access: string;
  region: string;
  cadence: string;
  reliability: MarketplaceStrategy["reliability"];
  notes: string;
  url: string;
  exampleListingUrl: string;
  scrapingMethods: string[];
  rawPayload: MarketplaceStrategy;
}

export interface ListingSeedRow extends NormalizedListing {
  rawPayload: {
    raw: RawListing;
    normalized: NormalizedListing;
  };
}

export interface RawSourcePayloadSeedRow {
  source: MarketplaceSource;
  sourceListingId: string | null;
  sourceUrl: string;
  capturedAt: string;
  payloadKind: "seed_listing";
  payload: RawListing;
}

export interface PriceSnapshotSeedRow {
  modelId: RoyalPopModelId;
  snapshotDate: string;
  listingCount: number;
  lowestAskEur: number;
  medianAskEur: number;
  highestAskEur: number;
  rawPayload: {
    sourceListingIds: string[];
    pricesEur: number[];
  };
}

export interface SeedDataset {
  models: ModelSeedRow[];
  marketplaces: MarketplaceSeedRow[];
  listings: ListingSeedRow[];
  rawSourcePayloads: RawSourcePayloadSeedRow[];
  priceSnapshots: PriceSnapshotSeedRow[];
}

export function buildSeedDataset(): SeedDataset {
  const listings = rawMarketListings.map((raw) => {
    const normalized = normalizeListing(raw);

    return {
      ...normalized,
      rawPayload: {
        raw,
        normalized,
      },
    };
  });

  return {
    models: royalPopModels.map((model) => ({
      ...model,
      rawPayload: model,
    })),
    marketplaces: marketplaceStrategies.map(toMarketplaceRow),
    listings,
    rawSourcePayloads: rawMarketListings.map((listing) => ({
      source: listing.source,
      sourceListingId: listing.sourceListingId ?? null,
      sourceUrl: listing.url,
      capturedAt: listing.observedAt,
      payloadKind: "seed_listing",
      payload: listing,
    })),
    priceSnapshots: buildPriceSnapshotRows(listings),
  };
}

export function buildPriceSnapshotRows(
  listings: Array<NormalizedListing | ListingSeedRow>,
): PriceSnapshotSeedRow[] {
  const groups = listings.reduce<Record<string, NormalizedListing[]>>((byModelDate, listing) => {
    if (!listing.modelId || listing.isSuspicious || listing.confidence < 0.75) {
      return byModelDate;
    }

    const snapshotDate = listing.observedAt.slice(0, 10);
    const groupKey = `${listing.modelId}:${snapshotDate}`;

    return {
      ...byModelDate,
      [groupKey]: [...(byModelDate[groupKey] ?? []), listing],
    };
  }, {});

  return Object.entries(groups)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([groupKey, groupListings]) => {
      const [modelId, snapshotDate] = groupKey.split(":") as [RoyalPopModelId, string];
      const pricesEur = groupListings.map((listing) => listing.priceEur);
      const sortedPrices = [...pricesEur].sort((left, right) => left - right);

      return {
        modelId,
        snapshotDate,
        listingCount: groupListings.length,
        lowestAskEur: sortedPrices[0],
        medianAskEur: median(sortedPrices),
        highestAskEur: sortedPrices[sortedPrices.length - 1],
        rawPayload: {
          sourceListingIds: groupListings.map((listing) => listing.sourceListingId ?? listing.url),
          pricesEur,
        },
      };
    });
}

function toMarketplaceRow(strategy: MarketplaceStrategy): MarketplaceSeedRow {
  return {
    id: marketplaceIdFor(strategy.source),
    displayName: strategy.source,
    priority: strategy.priority,
    access: strategy.access,
    region: strategy.region,
    cadence: strategy.cadence,
    reliability: strategy.reliability,
    notes: strategy.notes,
    url: strategy.url,
    exampleListingUrl: strategy.exampleListingUrl,
    scrapingMethods: strategy.scrapingMethods,
    rawPayload: strategy,
  };
}

function marketplaceIdFor(
  source: string,
): Extract<MarketplaceSource, "chrono24" | "olx" | "stockx" | "ebay"> {
  const sourceId = source.toLowerCase();

  if (
    sourceId === "chrono24" ||
    sourceId === "olx" ||
    sourceId === "stockx" ||
    sourceId === "ebay"
  ) {
    return sourceId;
  }

  throw new Error(`Unsupported MVP marketplace: ${source}`);
}

function median(sortedValues: number[]): number {
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex];
  }

  return Math.round(((sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2) * 100) / 100;
}
