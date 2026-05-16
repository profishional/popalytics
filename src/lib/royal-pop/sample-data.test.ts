import { describe, expect, test } from "vitest";

import { marketplaceStrategies, normalizedListings } from "./sample-data";

describe("Royal Pop source data", () => {
  test("uses the four requested source marketplaces for the MVP", () => {
    expect(marketplaceStrategies.map((strategy) => strategy.source)).toEqual([
      "Chrono24",
      "OLX",
      "StockX",
      "eBay",
    ]);
  });

  test("links source cards and listings to real marketplace URLs", () => {
    for (const strategy of marketplaceStrategies) {
      expect(strategy.url).toMatch(/^https:\/\//);
      expect(strategy.exampleListingUrl).toMatch(/^https:\/\//);
      expect(strategy.scrapingMethods.length).toBeGreaterThanOrEqual(2);
    }

    const sourceSet = new Set(normalizedListings.map((listing) => listing.source));

    expect(sourceSet).toEqual(new Set(["chrono24", "olx", "stockx", "ebay"]));
    expect(
      normalizedListings.every((listing) =>
        /chrono24|olx|stockx|ebay/.test(new URL(listing.url).hostname),
      ),
    ).toBe(true);
  });
});
