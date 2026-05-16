import { describe, expect, test } from "vitest";

import { mapDashboardRows } from "./dashboard-data";
import { buildSeedDataset } from "./seed-data";

describe("dashboard database mapping", () => {
  test("maps stored Postgres rows back to dashboard data shapes", () => {
    const seed = buildSeedDataset();
    const dashboardData = mapDashboardRows({
      models: seed.models.map((model) => ({
        id: model.id,
        name: model.name,
        reference: model.reference,
        style: model.style,
        retail_price_eur: model.retailPriceEur,
        image_url: model.imageUrl,
        face_crop: model.faceCrop,
      })),
      listings: seed.listings.map((listing) => ({
        source: listing.source,
        title: listing.title,
        price_amount: listing.priceAmount,
        price_currency: listing.priceCurrency,
        observed_at: listing.observedAt,
        url: listing.url,
        source_listing_id: listing.sourceListingId ?? null,
        shipping_amount: listing.shippingAmount ?? null,
        country: listing.country ?? null,
        condition: listing.condition ?? null,
        model_id: listing.modelId,
        price_eur: listing.priceEur,
        confidence: listing.confidence,
        is_suspicious: listing.isSuspicious,
      })),
      marketplaces: seed.marketplaces.map((marketplace) => ({
        id: marketplace.id,
        display_name: marketplace.displayName,
        priority: marketplace.priority,
        access: marketplace.access,
        region: marketplace.region,
        cadence: marketplace.cadence,
        reliability: marketplace.reliability,
        notes: marketplace.notes,
        url: marketplace.url,
        example_listing_url: marketplace.exampleListingUrl,
        scraping_methods: marketplace.scrapingMethods,
      })),
    });

    expect(dashboardData.models[0]).toHaveProperty("retailPriceEur");
    expect(dashboardData.listings[0]).toHaveProperty("priceEur");
    expect(dashboardData.strategies[0]).toHaveProperty("exampleListingUrl");
    expect(dashboardData.listings).toHaveLength(128);
  });
});
