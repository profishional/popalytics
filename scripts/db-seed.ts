import { closePool, getPool } from "../src/lib/db/client";
import { buildSeedDataset } from "../src/lib/db/seed-data";

async function main() {
  const pool = getPool();
  const dataset = buildSeedDataset();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [index, model] of dataset.models.entries()) {
      await client.query(
        `
          INSERT INTO royal_pop_models (
            id, sort_order, name, reference, style, retail_price_eur, image_url, face_crop, raw_payload
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            sort_order = EXCLUDED.sort_order,
            name = EXCLUDED.name,
            reference = EXCLUDED.reference,
            style = EXCLUDED.style,
            retail_price_eur = EXCLUDED.retail_price_eur,
            image_url = EXCLUDED.image_url,
            face_crop = EXCLUDED.face_crop,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = now()
        `,
        [
          model.id,
          index + 1,
          model.name,
          model.reference,
          model.style,
          model.retailPriceEur,
          model.imageUrl,
          JSON.stringify(model.faceCrop),
          JSON.stringify(model.rawPayload),
        ],
      );
    }

    for (const [index, marketplace] of dataset.marketplaces.entries()) {
      await client.query(
        `
          INSERT INTO marketplaces (
            id, sort_order, display_name, priority, access, region, cadence, reliability,
            notes, url, example_listing_url, scraping_methods, raw_payload
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            sort_order = EXCLUDED.sort_order,
            display_name = EXCLUDED.display_name,
            priority = EXCLUDED.priority,
            access = EXCLUDED.access,
            region = EXCLUDED.region,
            cadence = EXCLUDED.cadence,
            reliability = EXCLUDED.reliability,
            notes = EXCLUDED.notes,
            url = EXCLUDED.url,
            example_listing_url = EXCLUDED.example_listing_url,
            scraping_methods = EXCLUDED.scraping_methods,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = now()
        `,
        [
          marketplace.id,
          index + 1,
          marketplace.displayName,
          marketplace.priority,
          marketplace.access,
          marketplace.region,
          marketplace.cadence,
          marketplace.reliability,
          marketplace.notes,
          marketplace.url,
          marketplace.exampleListingUrl,
          marketplace.scrapingMethods,
          JSON.stringify(marketplace.rawPayload),
        ],
      );
    }

    const rawPayloadIds = new Map<string, number>();

    for (const payload of dataset.rawSourcePayloads) {
      const result = await client.query<{ id: number }>(
        `
          INSERT INTO raw_source_payloads (
            source, source_listing_id, source_url, captured_at, payload_kind, payload
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (source, source_listing_id, captured_at, payload_kind) DO UPDATE SET
            source_url = EXCLUDED.source_url,
            payload = EXCLUDED.payload
          RETURNING id
        `,
        [
          payload.source,
          payload.sourceListingId,
          payload.sourceUrl,
          payload.capturedAt,
          payload.payloadKind,
          JSON.stringify(payload.payload),
        ],
      );

      rawPayloadIds.set(rawPayloadKey(payload.source, payload.sourceListingId), result.rows[0].id);
    }

    for (const listing of dataset.listings) {
      const rawSourcePayloadId =
        rawPayloadIds.get(rawPayloadKey(listing.source, listing.sourceListingId ?? null)) ?? null;

      await client.query(
        `
          INSERT INTO marketplace_listings (
            source, source_listing_id, url, title, price_amount, price_currency,
            shipping_amount, country, condition, observed_at, model_id, price_eur,
            confidence, is_suspicious, raw_payload, raw_source_payload_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)
          ON CONFLICT (source, source_listing_id) DO UPDATE SET
            url = EXCLUDED.url,
            title = EXCLUDED.title,
            price_amount = EXCLUDED.price_amount,
            price_currency = EXCLUDED.price_currency,
            shipping_amount = EXCLUDED.shipping_amount,
            country = EXCLUDED.country,
            condition = EXCLUDED.condition,
            observed_at = EXCLUDED.observed_at,
            model_id = EXCLUDED.model_id,
            price_eur = EXCLUDED.price_eur,
            confidence = EXCLUDED.confidence,
            is_suspicious = EXCLUDED.is_suspicious,
            raw_payload = EXCLUDED.raw_payload,
            raw_source_payload_id = EXCLUDED.raw_source_payload_id,
            updated_at = now()
        `,
        [
          listing.source,
          listing.sourceListingId ?? null,
          listing.url,
          listing.title,
          listing.priceAmount,
          listing.priceCurrency,
          listing.shippingAmount ?? null,
          listing.country ?? null,
          listing.condition ?? null,
          listing.observedAt,
          listing.modelId,
          listing.priceEur,
          listing.confidence,
          listing.isSuspicious,
          JSON.stringify(listing.rawPayload),
          rawSourcePayloadId,
        ],
      );
    }

    for (const snapshot of dataset.priceSnapshots) {
      await client.query(
        `
          INSERT INTO price_snapshots (
            model_id, snapshot_date, listing_count, lowest_ask_eur,
            median_ask_eur, highest_ask_eur, raw_payload
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
          ON CONFLICT (model_id, snapshot_date) DO UPDATE SET
            listing_count = EXCLUDED.listing_count,
            lowest_ask_eur = EXCLUDED.lowest_ask_eur,
            median_ask_eur = EXCLUDED.median_ask_eur,
            highest_ask_eur = EXCLUDED.highest_ask_eur,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = now()
        `,
        [
          snapshot.modelId,
          snapshot.snapshotDate,
          snapshot.listingCount,
          snapshot.lowestAskEur,
          snapshot.medianAskEur,
          snapshot.highestAskEur,
          JSON.stringify(snapshot.rawPayload),
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${dataset.models.length} models, ${dataset.marketplaces.length} marketplaces, ${dataset.listings.length} listings, ${dataset.rawSourcePayloads.length} raw payloads, and ${dataset.priceSnapshots.length} price snapshots`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function rawPayloadKey(source: string, sourceListingId: string | null): string {
  return `${source}:${sourceListingId ?? ""}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
