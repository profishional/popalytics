import { describe, expect, test } from "vitest";

import {
  buildPriceSnapshotRows,
  buildSeedDataset,
} from "./seed-data";

describe("Postgres seed dataset", () => {
  test("keeps normalized dashboard rows and raw payloads for every seed record", () => {
    const dataset = buildSeedDataset();

    expect(dataset.models).toHaveLength(8);
    expect(dataset.marketplaces).toHaveLength(4);
    expect(dataset.listings).toHaveLength(128);
    expect(dataset.rawSourcePayloads).toHaveLength(128);

    expect(dataset.models.every((model) => model.rawPayload.reference === model.reference)).toBe(
      true,
    );
    expect(
      dataset.marketplaces.every((marketplace) =>
        marketplace.rawPayload.scrapingMethods.includes(marketplace.scrapingMethods[0]),
      ),
    ).toBe(true);
    expect(
      dataset.listings.every(
        (listing) =>
          listing.rawPayload.raw.source === listing.source &&
          listing.rawPayload.normalized.priceEur === listing.priceEur,
      ),
    ).toBe(true);
  });

  test("builds daily model snapshots from trusted normalized listings", () => {
    const dataset = buildSeedDataset();
    const snapshots = buildPriceSnapshotRows(dataset.listings);

    expect(snapshots).toHaveLength(32);
    expect(
      snapshots.every(
        (snapshot) =>
          snapshot.rawPayload.sourceListingIds.length === snapshot.listingCount &&
          snapshot.medianAskEur >= snapshot.lowestAskEur &&
          snapshot.highestAskEur >= snapshot.medianAskEur,
      ),
    ).toBe(true);
  });
});
