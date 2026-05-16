# Popsprice Source Coverage Matrix

**Updated:** 2026-05-16

## MVP Sources

| Source | Coverage role | Collection method | Notes |
| --- | --- | --- | --- |
| eBay | Broad live-listing coverage and fast day-one liquidity | Official Browse API through `scripts/collect-ebay.ts`; `hendt/ebay-api` is the GitHub client fallback | Use Marketplace Insights only if sold-data access is approved |
| Chrono24 | Watch-specific asking prices | Apify/Bright Data scraper first; our HTML parser as fallback | Strong signal for dealer asks and watch-market premium |
| OLX | Portugal/local-market listings | OLX developer access if granted; Apify OLX actor or our scraper otherwise | Keep Portugal first, add OLX Poland only for additional day-one liquidity |
| StockX | Lowest ask, last sale, and bid/ask market data | Apify StockX product/details actor; our product-page scraper fallback | Product URLs by reference avoid noisy keyword search |

## Deferred Sources

Wallapop, WatchCharts, Catawiki, Carousell, Vinted, Facebook Marketplace, and forums are useful later, but they are not part of this MVP iteration.
