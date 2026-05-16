DROP INDEX IF EXISTS marketplace_listings_source_url_observed_at_idx;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listings_source_url_observed_at_title_idx
  ON marketplace_listings (source, url, observed_at, title);
