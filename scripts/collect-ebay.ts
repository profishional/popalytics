import { buildEbayBrowseUrl, buildSearchQuerySet } from "../src/lib/royal-pop/collectors";
import {
  normalizeListing,
  ROYAL_POP_MODELS,
  type RawListing,
} from "../src/lib/royal-pop/pricing";

interface EbayItemSummary {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  price?: {
    value?: string;
    currency?: string;
  };
  itemLocation?: {
    country?: string;
  };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
}

const SUPPORTED_CURRENCIES = new Set<RawListing["priceCurrency"]>([
  "EUR",
  "USD",
  "GBP",
  "PLN",
  "SGD",
]);

async function main() {
  const accessToken = process.env.EBAY_ACCESS_TOKEN;
  const marketplaceId = process.env.EBAY_MARKETPLACE_ID ?? "EBAY_DE";
  const collectorPlan = ROYAL_POP_MODELS.map((model) => {
    const primaryQuery = buildSearchQuerySet(model)[0];

    return {
      modelId: model.id,
      reference: model.reference,
      query: primaryQuery,
      url: buildEbayBrowseUrl(model, primaryQuery, marketplaceId).toString(),
      marketplaceId,
    };
  });

  if (!accessToken) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "plan-only",
          message: "Set EBAY_ACCESS_TOKEN to fetch live Browse API results.",
          jobs: collectorPlan,
        },
        null,
        2,
      ),
    );
    return;
  }

  const listings: RawListing[] = [];

  for (const job of collectorPlan) {
    const response = await fetch(job.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      },
    });

    if (!response.ok) {
      throw new Error(`eBay ${response.status} while fetching ${job.query}`);
    }

    const payload = (await response.json()) as EbaySearchResponse;

    for (const item of payload.itemSummaries ?? []) {
      const currency = item.price?.currency;
      const price = Number(item.price?.value);

      if (
        !item.title ||
        !item.itemWebUrl ||
        !Number.isFinite(price) ||
        !SUPPORTED_CURRENCIES.has(currency as RawListing["priceCurrency"])
      ) {
        continue;
      }

      listings.push({
        source: "ebay",
        sourceListingId: item.itemId,
        title: item.title,
        priceAmount: price,
        priceCurrency: currency as RawListing["priceCurrency"],
        observedAt: new Date().toISOString(),
        url: item.itemWebUrl,
        country: item.itemLocation?.country,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "live",
        source: "ebay",
        marketplaceId,
        observedAt: new Date().toISOString(),
        listings: listings.map(normalizeListing),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown collector error";
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exitCode = 1;
});
