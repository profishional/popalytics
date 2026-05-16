CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS royal_pop_models (
  id text PRIMARY KEY,
  sort_order integer NOT NULL,
  name text NOT NULL,
  reference text NOT NULL UNIQUE,
  style text NOT NULL CHECK (style IN ('Lepine', 'Savonnette')),
  retail_price_eur numeric(10, 2) NOT NULL,
  image_url text NOT NULL,
  face_crop jsonb NOT NULL,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplaces (
  id text PRIMARY KEY,
  sort_order integer NOT NULL,
  display_name text NOT NULL,
  priority text NOT NULL,
  access text NOT NULL,
  region text NOT NULL,
  cadence text NOT NULL,
  reliability text NOT NULL,
  notes text NOT NULL,
  url text NOT NULL,
  example_listing_url text NOT NULL,
  scraping_methods text[] NOT NULL,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_source_payloads (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  source_listing_id text,
  source_url text NOT NULL,
  captured_at timestamptz NOT NULL,
  payload_kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_listing_id, captured_at, payload_kind)
);

CREATE TABLE IF NOT EXISTS collector_runs (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  request_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id bigserial PRIMARY KEY,
  source text NOT NULL REFERENCES marketplaces(id),
  source_listing_id text,
  url text NOT NULL,
  title text NOT NULL,
  price_amount numeric(12, 2) NOT NULL,
  price_currency text NOT NULL,
  shipping_amount numeric(12, 2),
  country text,
  condition text,
  observed_at timestamptz NOT NULL,
  model_id text REFERENCES royal_pop_models(id),
  price_eur numeric(12, 2) NOT NULL,
  confidence numeric(5, 4) NOT NULL,
  is_suspicious boolean NOT NULL,
  raw_payload jsonb NOT NULL,
  raw_source_payload_id bigint REFERENCES raw_source_payloads(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_listing_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listings_source_url_observed_at_title_idx
  ON marketplace_listings (source, url, observed_at, title);

CREATE INDEX IF NOT EXISTS marketplace_listings_model_observed_idx
  ON marketplace_listings (model_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_listings_source_observed_idx
  ON marketplace_listings (source, observed_at DESC);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id bigserial PRIMARY KEY,
  model_id text NOT NULL REFERENCES royal_pop_models(id),
  snapshot_date date NOT NULL,
  listing_count integer NOT NULL,
  lowest_ask_eur numeric(12, 2) NOT NULL,
  median_ask_eur numeric(12, 2) NOT NULL,
  highest_ask_eur numeric(12, 2) NOT NULL,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS price_snapshots_model_date_idx
  ON price_snapshots (model_id, snapshot_date);
