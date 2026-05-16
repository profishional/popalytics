import { describe, expect, test } from "vitest";

import {
  buildModelComparisonSeries,
  buildModelMarketSummary,
  buildPriceSeries,
  matchRoyalPopModel,
  normalizeListing,
  ROYAL_POP_MODELS,
} from "./pricing";

describe("Royal Pop pricing utilities", () => {
  test("includes official image URLs for every model", () => {
    expect(ROYAL_POP_MODELS).toHaveLength(8);
    expect(
      ROYAL_POP_MODELS.every(
        (model) =>
          model.imageUrl.startsWith("https://static.swatch.com/images/product/") &&
          model.imageUrl.includes(model.reference) &&
          model.faceCrop.scale >= 2.4 &&
          model.faceCrop.xPercent >= 45 &&
          model.faceCrop.yPercent >= 42,
      ),
    ).toBe(true);
  });

  test("matches listings to exact Royal Pop model references and names", () => {
    expect(matchRoyalPopModel("Swatch x AP Royal Pop LAN BA SSX03L100N full set")).toBe(
      "lan-ba",
    );
    expect(matchRoyalPopModel("AP x Swatch Royal Pop OTG ROZ Savonnette receipt")).toBe(
      "otg-roz",
    );
    expect(matchRoyalPopModel("Audemars Piguet Royal Oak 15500ST")).toBeNull();
  });

  test("normalizes listing prices to EUR and flags suspicious bad matches", () => {
    const listing = normalizeListing({
      source: "ebay",
      title: "Swatch x Audemars Piguet Royal Pop LAN BA",
      priceAmount: 1399,
      priceCurrency: "USD",
      observedAt: "2026-05-16T09:00:00.000Z",
      url: "https://example.com/listing",
    });

    expect(listing.modelId).toBe("lan-ba");
    expect(listing.priceEur).toBe(1203.14);
    expect(listing.confidence).toBeGreaterThanOrEqual(0.8);
    expect(listing.isSuspicious).toBe(false);

    const badListing = normalizeListing({
      source: "chrono24",
      title: "Audemars Piguet Royal Oak chronograph Royal Pop strap",
      priceAmount: 8472,
      priceCurrency: "USD",
      observedAt: "2026-05-16T10:00:00.000Z",
      url: "https://example.com/bad",
    });

    expect(badListing.modelId).toBeNull();
    expect(badListing.isSuspicious).toBe(true);
  });

  test("builds per-model market summary using only trusted listings", () => {
    const summary = buildModelMarketSummary("lan-ba", [
      normalizeListing({
        source: "chrono24",
        title: "Swatch Royal Pop LAN BA",
        priceAmount: 2149,
        priceCurrency: "USD",
        observedAt: "2026-05-16T10:00:00.000Z",
        url: "https://example.com/a",
      }),
      normalizeListing({
        source: "ebay",
        title: "Swatch x Audemars Piguet Royal Pop LAN BA",
        priceAmount: 1399,
        priceCurrency: "USD",
        observedAt: "2026-05-16T11:00:00.000Z",
        url: "https://example.com/b",
      }),
      normalizeListing({
        source: "chrono24",
        title: "Audemars Piguet Royal Oak Royal Pop fake title",
        priceAmount: 8472,
        priceCurrency: "USD",
        observedAt: "2026-05-16T12:00:00.000Z",
        url: "https://example.com/c",
      }),
    ]);

    expect(summary.listingCount).toBe(2);
    expect(summary.lowestAskEur).toBe(1203.14);
    expect(summary.medianAskEur).toBe(1525.64);
    expect(summary.premiumPercent).toBe(281.4);
  });

  test("builds daily historical price series from trusted observations", () => {
    const series = buildPriceSeries("otg-roz", [
      normalizeListing({
        source: "chrono24",
        title: "Royal Pop OTG ROZ",
        priceAmount: 1466,
        priceCurrency: "USD",
        observedAt: "2026-05-15T12:00:00.000Z",
        url: "https://example.com/a",
      }),
      normalizeListing({
        source: "chrono24",
        title: "Royal Pop OTG ROZ Savonnette",
        priceAmount: 2360,
        priceCurrency: "USD",
        observedAt: "2026-05-16T12:00:00.000Z",
        url: "https://example.com/b",
      }),
    ]);

    expect(series).toEqual([
      { date: "2026-05-15", medianAskEur: 1260.76 },
      { date: "2026-05-16", medianAskEur: 2029.6 },
    ]);
  });

  test("builds model comparison series for the chart", () => {
    const comparison = buildModelComparisonSeries(
      [
        {
          id: "lan-ba",
          name: "LAN BA",
          reference: "SSX03L100N",
          style: "Savonnette",
          retailPriceEur: 400,
          imageUrl:
            "https://static.swatch.com/images/product/SSX03L100N/sa200/SSX03L100N_sa200_er006.png",
          faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
        },
        {
          id: "otg-roz",
          name: "OTG ROZ",
          reference: "SSX03J100N",
          style: "Savonnette",
          retailPriceEur: 400,
          imageUrl:
            "https://static.swatch.com/images/product/SSX03J100N/sa200/SSX03J100N_sa200_er006.png",
          faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
        },
      ],
      [
        normalizeListing({
          source: "stockx",
          title: "Swatch Royal Pop LAN BA SSX03L100N",
          priceAmount: 1450,
          priceCurrency: "USD",
          observedAt: "2026-05-15T12:00:00.000Z",
          url: "https://stockx.com/lan-ba",
        }),
        normalizeListing({
          source: "ebay",
          title: "Swatch Royal Pop LAN BA SSX03L100N",
          priceAmount: 1290,
          priceCurrency: "EUR",
          observedAt: "2026-05-16T12:00:00.000Z",
          url: "https://ebay.com/lan-ba",
        }),
        normalizeListing({
          source: "stockx",
          title: "Swatch Royal Pop OTG ROZ SSX03J100N",
          priceAmount: 1503,
          priceCurrency: "USD",
          observedAt: "2026-05-16T12:00:00.000Z",
          url: "https://stockx.com/otg-roz",
        }),
      ],
    );

    expect(comparison).toEqual([
      {
        modelId: "lan-ba",
        modelName: "LAN BA",
        currentMedianEur: 1290,
        points: [
          { date: "2026-05-15", medianAskEur: 1247 },
          { date: "2026-05-16", medianAskEur: 1290 },
        ],
      },
      {
        modelId: "otg-roz",
        modelName: "OTG ROZ",
        currentMedianEur: 1292.58,
        points: [{ date: "2026-05-16", medianAskEur: 1292.58 }],
      },
    ]);
  });
});
