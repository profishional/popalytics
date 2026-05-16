# Royal Pop Data Sources

The MVP source list is deliberately narrow: Chrono24, OLX, StockX, and eBay. Each source must produce listing-level URLs that can be opened from the dashboard.

Official watch imagery comes from Swatch product image URLs under `https://static.swatch.com/images/product/{reference}/...` and is used only for model identification in the chart UI.

## MVP Sources

| Source | Primary method | Fallback method | Listing evidence |
| --- | --- | --- | --- |
| Chrono24 | Apify/Bright Data style scraper for listing pages | Our rate-limited HTML parser with raw payload storage | `https://www.chrono24.com/swatch/royal-pop--mod3331.htm` |
| OLX | OLX developer API request where access is granted | Apify OLX actor or our public listing scraper | `https://www.olx.pt/d/anuncio/royal-pop-swatch-x-audemars-piguet-IDJoVgB.html?search_reason=search%7Corganic` |
| StockX | Apify StockX product/details actor | Our product-page scraper for embedded market data | `https://stockx.com/swatch-x-audemars-piguet-bioceramic-royal-pop-savonnette-lan-ba-ssx03l100n-blue` |
| eBay | Official Browse API through our CLI or `hendt/ebay-api` | Apify eBay actor for search/listing pages | `https://www.ebay.it/p/17090904676?iid=406929469458` |

## Normalized Listing Shape

```ts
{
  source: "chrono24" | "ebay" | "olx" | "stockx";
  sourceListingId?: string;
  url: string;
  title: string;
  priceAmount: number;
  priceCurrency: "EUR" | "USD" | "GBP" | "PLN" | "SGD";
  priceEur: number;
  shippingAmount?: number;
  country?: string;
  condition?: string;
  modelId: string | null;
  confidence: number;
  isSuspicious: boolean;
  observedAt: string;
}
```

## Collector Rules

- Save every raw payload before normalization.
- Deduplicate by source listing ID, canonical URL, and title/price/source fallback.
- Build historical charts from daily model medians, not only the latest active ask.
- Keep one clickable URL per observation so the chart can always be audited.
- Respect marketplace terms, robots guidance, rate limits, account requirements, and local privacy law.
