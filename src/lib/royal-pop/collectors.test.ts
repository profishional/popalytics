import { describe, expect, test } from "vitest";

import {
  buildCollectorJobs,
  buildEbayBrowseUrl,
  buildSearchQuerySet,
} from "./collectors";
import { ROYAL_POP_MODELS } from "./pricing";

describe("Royal Pop collector planning", () => {
  test("builds focused search queries from model name and reference", () => {
    const model = ROYAL_POP_MODELS.find((candidate) => candidate.id === "lan-ba");

    expect(model).toBeDefined();
    expect(buildSearchQuerySet(model!)).toEqual([
      "swatch royal pop LAN BA",
      "audemars piguet swatch LAN BA",
      "swatch ap SSX03L100N",
      "SSX03L100N",
    ]);
  });

  test("builds eBay Browse API URLs with explicit marketplace and query", () => {
    const model = ROYAL_POP_MODELS.find((candidate) => candidate.id === "otg-roz");

    expect(model).toBeDefined();
    const url = buildEbayBrowseUrl(model!, "swatch royal pop OTG ROZ", "EBAY_DE");

    expect(url.toString()).toBe(
      "https://api.ebay.com/buy/browse/v1/item_summary/search?q=swatch+royal+pop+OTG+ROZ&limit=50&filter=conditions%3A%7BNEW%7CUSED%7D&fieldgroups=EXTENDED",
    );
    expect(url.searchParams.get("q")).toBe("swatch royal pop OTG ROZ");
    expect(url.searchParams.get("fieldgroups")).toBe("EXTENDED");
  });

  test("builds MVP collector jobs for every model and marketplace strategy", () => {
    const jobs = buildCollectorJobs(ROYAL_POP_MODELS.slice(0, 2));

    expect(jobs).toHaveLength(8);
    expect(jobs.map((job) => job.source)).toEqual([
      "ebay",
      "chrono24",
      "olx",
      "stockx",
      "ebay",
      "chrono24",
      "olx",
      "stockx",
    ]);
    expect(jobs[0]).toMatchObject({
      source: "ebay",
      modelId: "otto-rosso",
      access: "api",
      method: "github-cli",
      cadenceMinutes: 120,
    });
    expect(new Set(jobs.map((job) => job.method))).toEqual(
      new Set(["github-cli", "apify", "webscrape"]),
    );
  });
});
