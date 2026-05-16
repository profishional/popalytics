# Royal Pop Tracker Design

## Goal

Build a fast, reliable MVP website that tracks AP x Swatch Royal Pop secondary-market prices by model/color, shows historical price movement, and makes the data-source strategy explicit.

## Product Flow

1. Dashboard opens directly to the main multi-series chart instead of a marketing landing page.
2. User compares all eight Royal Pop model/color time series in one chart.
3. User selects a model from the chart legend to inspect retail price, current median ask, resale premium, and source-linked listings.
4. A source strategy section explains exactly how Chrono24, OLX, StockX, and eBay should be collected.

## Architecture

- Next.js App Router frontend, hosted as a lightweight web app.
- Pure TypeScript domain layer for model matching, price normalization, suspicious-listing detection, and time-series aggregation.
- Initial MVP uses seed observations so the dashboard works immediately.
- Production data path should add scheduled collector jobs that write normalized listings and daily snapshots to Postgres/Supabase.
- The UI consumes normalized data only; raw source payloads should be stored separately for audit/debugging.

## Data Model

- `models`: official Royal Pop model metadata, references, style, retail price.
- `marketplaces`: source name, access method, cadence, reliability, region.
- `listings`: normalized marketplace observations with source, URL, title, country, model guess, EUR price, confidence, suspicious flag, observed timestamp.
- `price_snapshots`: derived median/low/high by model/source/date for charting.
- `scrape_runs`: collector status, timestamps, error details, and raw counts.

## Source Strategy

- Chrono24: Apify/Bright Data style listing scraper first; our rate-limited HTML parser fallback.
- OLX: official developer API request where access is granted; Apify OLX actor or our public listing scraper fallback.
- StockX: Apify product/details actor first; our product-page scraper fallback for lowest ask, last sale, and bid/ask data.
- eBay: official Browse API through `scripts/collect-ebay.ts` or GitHub `hendt/ebay-api`; Apify eBay actor fallback.
- Other sources are intentionally deferred until the four-source MVP is stable.

## Matching And Quality

- Match exact model references first.
- Match official model names second.
- Require Royal Pop/Swatch/AP context for high confidence unless the model reference is exact.
- Reject or flag Royal Oak, chronograph, wristwatch, extreme price outliers, and generic keyword-spam listings.
- Show suspicious counts separately rather than silently deleting observations.

## MVP Verification

- Domain tests cover model matching, EUR normalization, suspicious-listing detection, per-model summaries, historical series, multi-model comparison series, source coverage, and collector jobs.
- Build/lint verify the Next.js app compiles.
- Manual browser QA should check the dashboard at desktop and mobile widths before deployment.
