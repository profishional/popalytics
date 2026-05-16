# Popsprice

Royal Pop secondary-market price tracker for the Audemars Piguet x Swatch launch.

## What Ships In This MVP

- Chart-first Next.js dashboard for the eight Royal Pop models/colors.
- Multi-series daily median price chart, selected-model metrics, and listing audit table.
- Official Swatch product images used as watch-face markers at the end of each time series.
- Source strategy view focused on Chrono24, OLX, StockX, and eBay with listing links.
- Tested TypeScript domain layer for model matching, EUR normalization, suspicious listing detection, summaries, and price series.
- Tested collector-planning layer plus an executable eBay Browse API collector.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm test
npm run lint
npm run build
```

## eBay Collector

Without credentials, the command prints the API job plan for all eight models:

```bash
npm run collect:ebay
```

To fetch live eBay Browse API results:

```bash
EBAY_ACCESS_TOKEN=... EBAY_MARKETPLACE_ID=EBAY_DE npm run collect:ebay
```

The collector writes normalized listing JSON to stdout. Pipe it into a file or scheduled job until the Postgres/Supabase persistence layer is added.

## Key Files

- `src/components/RoyalPopDashboard.tsx` - user-facing dashboard and chart.
- `src/lib/royal-pop/pricing.ts` - model metadata, matching, normalization, summaries, series.
- `src/lib/royal-pop/collectors.ts` - collector job planning and API URL builders.
- `scripts/collect-ebay.ts` - executable eBay Browse API collector.
- `docs/data-sources.md` - source strategy and normalized listing contract.
- `docs/superpowers/specs/2026-05-16-royal-pop-tracker-design.md` - architecture/design spec.
