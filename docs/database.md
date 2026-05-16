# Popalytics Database

The app now treats Postgres as the source of truth for dashboard data. Seed TypeScript data still exists because it is useful for tests and initial loading, but the page reads from the database at request time.

## Local Connection

Default connection string:

```bash
postgresql://localhost:5432/popalytics
```

Override with `DATABASE_URL` when needed.

## Setup

```bash
npm run db:setup
```

This creates the `popalytics` database, applies migrations from `db/migrations`, and seeds the current Royal Pop dataset.

## Tables

- `royal_pop_models`: one row per official Royal Pop model. Stores normalized fields plus `raw_payload` JSON containing the full seed object.
- `marketplaces`: one row per MVP source: Chrono24, OLX, StockX, eBay. Stores source strategy plus `raw_payload`.
- `raw_source_payloads`: raw source observations captured before normalization. Future collectors should insert here first.
- `marketplace_listings`: normalized listing observations used by the UI. Each row links back to `raw_source_payloads` when available.
- `price_snapshots`: derived daily model medians/lows/highs. This keeps chart reads cheap as data grows.
- `collector_runs`: execution log for future scheduled collectors, including request/response metadata and raw run payloads.
- `schema_migrations`: applied migration tracking.

## Data Flow

1. Collector captures source output and inserts the raw JSON into `raw_source_payloads`.
2. Normalization maps raw rows to model, EUR price, confidence, suspicious flag, and audit URL.
3. Normalized rows are upserted into `marketplace_listings`.
4. Daily aggregates are written to `price_snapshots`.
5. The Next.js page queries normalized rows and marketplace strategy from Postgres, then renders the existing dashboard.

## Growth Notes

Keep raw payloads even when normalization changes. When match rules improve, the app can reprocess stored raw observations without scraping marketplaces again.
