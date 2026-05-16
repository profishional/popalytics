import type { MarketplaceStrategy } from "../royal-pop/sample-data";
import type {
  MarketplaceSource,
  NormalizedListing,
  RawListing,
  RoyalPopModel,
  RoyalPopModelId,
} from "../royal-pop/pricing";
import { queryRows } from "./client";

export interface DashboardData {
  models: RoyalPopModel[];
  listings: NormalizedListing[];
  strategies: MarketplaceStrategy[];
}

interface ModelRow {
  id: string;
  name: string;
  reference: string;
  style: string;
  retail_price_eur: number | string;
  image_url: string;
  face_crop: RoyalPopModel["faceCrop"];
}

interface ListingRow {
  source: string;
  title: string;
  price_amount: number | string;
  price_currency: RawListing["priceCurrency"];
  observed_at: string | Date;
  url: string;
  source_listing_id: string | null;
  shipping_amount: number | string | null;
  country: string | null;
  condition: string | null;
  model_id: string | null;
  price_eur: number | string;
  confidence: number | string;
  is_suspicious: boolean;
}

interface MarketplaceRow {
  id: string;
  display_name: string;
  priority: MarketplaceStrategy["priority"];
  access: string;
  region: string;
  cadence: string;
  reliability: MarketplaceStrategy["reliability"];
  notes: string;
  url: string;
  example_listing_url: string;
  scraping_methods: string[];
}

export interface DashboardRows {
  models: ModelRow[];
  listings: ListingRow[];
  marketplaces: MarketplaceRow[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [models, listings, marketplaces] = await Promise.all([
    queryRows<ModelRow>(`
      SELECT id, name, reference, style, retail_price_eur, image_url, face_crop
      FROM royal_pop_models
      ORDER BY sort_order ASC
    `),
    queryRows<ListingRow>(`
      SELECT
        source,
        title,
        price_amount,
        price_currency,
        observed_at,
        url,
        source_listing_id,
        shipping_amount,
        country,
        condition,
        model_id,
        price_eur,
        confidence,
        is_suspicious
      FROM marketplace_listings
      ORDER BY observed_at ASC, source ASC, source_listing_id ASC
    `),
    queryRows<MarketplaceRow>(`
      SELECT
        id,
        display_name,
        priority,
        access,
        region,
        cadence,
        reliability,
        notes,
        url,
        example_listing_url,
        scraping_methods
      FROM marketplaces
      ORDER BY sort_order ASC
    `),
  ]);

  return mapDashboardRows({ models, listings, marketplaces });
}

export function mapDashboardRows(rows: DashboardRows): DashboardData {
  return {
    models: rows.models.map((row) => ({
      id: row.id as RoyalPopModelId,
      name: row.name,
      reference: row.reference,
      style: row.style as RoyalPopModel["style"],
      retailPriceEur: toNumber(row.retail_price_eur),
      imageUrl: row.image_url,
      faceCrop: row.face_crop,
    })),
    listings: rows.listings.map((row) => ({
      source: row.source as MarketplaceSource,
      title: row.title,
      priceAmount: toNumber(row.price_amount),
      priceCurrency: row.price_currency,
      observedAt: toIsoString(row.observed_at),
      url: row.url,
      ...(row.source_listing_id ? { sourceListingId: row.source_listing_id } : {}),
      ...(row.shipping_amount !== null ? { shippingAmount: toNumber(row.shipping_amount) } : {}),
      ...(row.country ? { country: row.country } : {}),
      ...(row.condition ? { condition: row.condition } : {}),
      modelId: row.model_id as RoyalPopModelId | null,
      priceEur: toNumber(row.price_eur),
      confidence: toNumber(row.confidence),
      isSuspicious: row.is_suspicious,
    })),
    strategies: rows.marketplaces.map((row) => ({
      source: row.display_name,
      priority: row.priority,
      access: row.access,
      region: row.region,
      cadence: row.cadence,
      reliability: row.reliability,
      notes: row.notes,
      url: row.url,
      exampleListingUrl: row.example_listing_url,
      scrapingMethods: row.scraping_methods,
    })),
  };
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
