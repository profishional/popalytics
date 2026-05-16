export type RoyalPopModelId =
  | "otto-rosso"
  | "huit-blanc"
  | "green-eight"
  | "blaue-acht"
  | "lan-ba"
  | "otg-roz"
  | "ocho-negro"
  | "orenji-hachi";

export type MarketplaceSource =
  | "swatch"
  | "chrono24"
  | "ebay"
  | "olx"
  | "wallapop"
  | "watchcharts"
  | "catawiki"
  | "stockx"
  | "carousell"
  | "vinted"
  | "facebook";

export interface RawListing {
  source: MarketplaceSource;
  title: string;
  priceAmount: number;
  priceCurrency: "EUR" | "USD" | "GBP" | "PLN" | "SGD";
  observedAt: string;
  url: string;
  sourceListingId?: string;
  shippingAmount?: number;
  country?: string;
  condition?: string;
}

export interface NormalizedListing extends RawListing {
  modelId: RoyalPopModelId | null;
  priceEur: number;
  confidence: number;
  isSuspicious: boolean;
}

export interface RoyalPopModel {
  id: RoyalPopModelId;
  name: string;
  reference: string;
  style: "Lepine" | "Savonnette";
  retailPriceEur: number;
  imageUrl: string;
  faceCrop: {
    scale: number;
    xPercent: number;
    yPercent: number;
  };
}

export interface ModelMarketSummary {
  modelId: RoyalPopModelId;
  listingCount: number;
  lowestAskEur: number | null;
  medianAskEur: number | null;
  premiumPercent: number | null;
}

export interface PricePoint {
  date: string;
  medianAskEur: number;
}

export interface ModelComparisonSeries {
  modelId: RoyalPopModelId;
  modelName: string;
  currentMedianEur: number | null;
  points: PricePoint[];
}

const USD_TO_EUR = 0.86;
const GBP_TO_EUR = 1.15;
const PLN_TO_EUR = 0.23;
const SGD_TO_EUR = 0.68;

const CURRENCY_TO_EUR: Record<RawListing["priceCurrency"], number> = {
  EUR: 1,
  USD: USD_TO_EUR,
  GBP: GBP_TO_EUR,
  PLN: PLN_TO_EUR,
  SGD: SGD_TO_EUR,
};

export const ROYAL_POP_MODELS: RoyalPopModel[] = [
  {
    id: "otto-rosso",
    name: "OTTO ROSSO",
    reference: "SSX03R100N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03R100N/sa200/SSX03R100N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
  {
    id: "huit-blanc",
    name: "HUIT BLANC",
    reference: "SSX03W100N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03W100N/sa200/SSX03W100N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
  {
    id: "green-eight",
    name: "GREEN EIGHT",
    reference: "SSX03G100N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03G100N/sa200/SSX03G100N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
  {
    id: "blaue-acht",
    name: "BLAUE ACHT",
    reference: "SSX03L101N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03L101N/sa200/SSX03L101N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
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
  {
    id: "ocho-negro",
    name: "OCHO NEGRO",
    reference: "SSX03W101N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03W101N/sa200/SSX03W101N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
  {
    id: "orenji-hachi",
    name: "ORENJI HACHI",
    reference: "SSX03L103N",
    style: "Lepine",
    retailPriceEur: 385,
    imageUrl:
      "https://static.swatch.com/images/product/SSX03L103N/sa200/SSX03L103N_sa200_er006.png",
    faceCrop: { scale: 2.7, xPercent: 50, yPercent: 47 },
  },
];

export function matchRoyalPopModel(title: string): RoyalPopModelId | null {
  const normalizedTitle = normalizeText(title);

  for (const model of ROYAL_POP_MODELS) {
    if (normalizedTitle.includes(model.reference.toLowerCase())) {
      return model.id;
    }
  }

  for (const model of ROYAL_POP_MODELS) {
    if (normalizedTitle.includes(normalizeText(model.name))) {
      return model.id;
    }
  }

  return null;
}

export function normalizeListing(listing: RawListing): NormalizedListing {
  const modelId = matchRoyalPopModel(listing.title);
  const priceEur = roundMoney(
    (listing.priceAmount + (listing.shippingAmount ?? 0)) *
      CURRENCY_TO_EUR[listing.priceCurrency],
  );
  const confidence = calculateConfidence(listing.title, modelId);
  const isSuspicious = confidence < 0.65 || looksLikeWrongWatch(listing.title, priceEur);

  return {
    ...listing,
    modelId,
    priceEur,
    confidence,
    isSuspicious,
  };
}

export function buildModelMarketSummary(
  modelId: RoyalPopModelId,
  listings: NormalizedListing[],
): ModelMarketSummary {
  const trustedPrices = trustedModelListings(modelId, listings).map(
    (listing) => listing.priceEur,
  );
  const medianAskEur = median(trustedPrices);
  const model = ROYAL_POP_MODELS.find((candidate) => candidate.id === modelId);

  return {
    modelId,
    listingCount: trustedPrices.length,
    lowestAskEur: trustedPrices.length > 0 ? Math.min(...trustedPrices) : null,
    medianAskEur,
    premiumPercent:
      medianAskEur !== null && model
        ? roundOneDecimal(((medianAskEur - model.retailPriceEur) / model.retailPriceEur) * 100)
        : null,
  };
}

export function buildPriceSeries(
  modelId: RoyalPopModelId,
  listings: NormalizedListing[],
): PricePoint[] {
  const pricesByDate = trustedModelListings(modelId, listings).reduce<
    Record<string, number[]>
  >((groups, listing) => {
    const date = listing.observedAt.slice(0, 10);

    return {
      ...groups,
      [date]: [...(groups[date] ?? []), listing.priceEur],
    };
  }, {});

  return Object.entries(pricesByDate)
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, prices]) => ({
      date,
      medianAskEur: median(prices) ?? 0,
    }));
}

export function buildModelComparisonSeries(
  models: RoyalPopModel[],
  listings: NormalizedListing[],
): ModelComparisonSeries[] {
  return models.map((model) => {
    const points = buildPriceSeries(model.id, listings);
    const currentMedianEur =
      points.length > 0 ? points[points.length - 1].medianAskEur : null;

    return {
      modelId: model.id,
      modelName: model.name,
      currentMedianEur,
      points,
    };
  });
}

function trustedModelListings(
  modelId: RoyalPopModelId,
  listings: NormalizedListing[],
): NormalizedListing[] {
  return listings.filter(
    (listing) =>
      listing.modelId === modelId && !listing.isSuspicious && listing.confidence >= 0.75,
  );
}

function calculateConfidence(title: string, modelId: RoyalPopModelId | null): number {
  const normalizedTitle = normalizeText(title);
  const hasCollectionTerms =
    normalizedTitle.includes("royal pop") &&
    (normalizedTitle.includes("swatch") || normalizedTitle.includes("ap"));

  if (!modelId) {
    return hasCollectionTerms ? 0.5 : 0.15;
  }

  const model = ROYAL_POP_MODELS.find((candidate) => candidate.id === modelId);
  const hasReference = model
    ? normalizedTitle.includes(model.reference.toLowerCase())
    : false;

  if (hasReference && hasCollectionTerms) {
    return 0.96;
  }

  if (hasReference) {
    return 0.9;
  }

  if (hasCollectionTerms) {
    return 0.85;
  }

  if (normalizedTitle.includes("royal pop")) {
    return 0.78;
  }

  return 0.72;
}

function looksLikeWrongWatch(title: string, priceEur: number): boolean {
  const normalizedTitle = normalizeText(title);
  const hasWrongWatchTerms =
    normalizedTitle.includes("royal oak") ||
    normalizedTitle.includes("chronograph") ||
    normalizedTitle.includes("wristwatch");

  return hasWrongWatchTerms || priceEur > 4500;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex];
  }

  return roundMoney((sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
