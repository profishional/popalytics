"use client";

import { useMemo, useState } from "react";

import {
  buildModelComparisonSeries,
  buildModelMarketSummary,
  type MarketplaceSource,
  type ModelComparisonSeries,
  type NormalizedListing,
  type RoyalPopModel,
  type RoyalPopModelId,
} from "@/lib/royal-pop/pricing";
import type { MarketplaceStrategy } from "@/lib/royal-pop/sample-data";

interface RoyalPopDashboardProps {
  models: RoyalPopModel[];
  listings: NormalizedListing[];
  strategies: MarketplaceStrategy[];
}

const modelPalette: Record<RoyalPopModelId, { line: string; fill: string; ink: string }> = {
  "otto-rosso": { line: "#d92d20", fill: "#fee4e2", ink: "#7a271a" },
  "huit-blanc": { line: "#7f7364", fill: "#f3eee7", ink: "#332d26" },
  "green-eight": { line: "#168a53", fill: "#dcf7e8", ink: "#064e30" },
  "blaue-acht": { line: "#1570ef", fill: "#d8e9ff", ink: "#0b3b75" },
  "lan-ba": { line: "#d6a100", fill: "#fff3c4", ink: "#5c4200" },
  "otg-roz": { line: "#c23b72", fill: "#fbe0eb", ink: "#761842" },
  "ocho-negro": { line: "#101828", fill: "#e4e7ec", ink: "#101828" },
  "orenji-hachi": { line: "#f97316", fill: "#ffedd5", ink: "#7c2d12" },
};

const sourceLabels: Record<MarketplaceSource, string> = {
  swatch: "Swatch",
  chrono24: "Chrono24",
  ebay: "eBay",
  olx: "OLX",
  wallapop: "Wallapop",
  watchcharts: "WatchCharts",
  catawiki: "Catawiki",
  stockx: "StockX",
  carousell: "Carousell",
  vinted: "Vinted",
  facebook: "Facebook",
};

const eurFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function RoyalPopDashboard({
  models,
  listings,
  strategies,
}: RoyalPopDashboardProps) {
  const [selectedModelId, setSelectedModelId] = useState<RoyalPopModelId>("lan-ba");

  const selectedModel = models.find((model) => model.id === selectedModelId) ?? models[0];
  const comparisonSeries = useMemo(
    () => buildModelComparisonSeries(models, listings),
    [listings, models],
  );
  const summaryByModel = useMemo(
    () =>
      Object.fromEntries(
        models.map((model) => [
          model.id,
          buildModelMarketSummary(model.id, listings),
        ]),
      ) as Record<RoyalPopModelId, ReturnType<typeof buildModelMarketSummary>>,
    [listings, models],
  );
  const selectedSummary = summaryByModel[selectedModel.id];
  const trustedListings = useMemo(
    () =>
      listings
        .filter((listing) => !listing.isSuspicious && listing.modelId === selectedModel.id)
        .sort((left, right) => right.observedAt.localeCompare(left.observedAt)),
    [listings, selectedModel.id],
  );
  const latestBySource = getLatestListingsBySource(trustedListings);
  const activeSources = new Set(
    listings.filter((listing) => !listing.isSuspicious).map((listing) => listing.source),
  );
  const latestObservation = [...listings].sort((left, right) =>
    right.observedAt.localeCompare(left.observedAt),
  )[0]?.observedAt;

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#111827]">
      <section className="border-b border-[#d7dde6] bg-[#fbfcfe]">
        <div className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8">
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-[#b42318]">
                  Royal Pop market monitor
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828] sm:text-4xl">
                  Price history by model and source-backed listings
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#516070]">
                Eight model series share one chart. Every price shown is backed by a marketplace
                URL from Chrono24, OLX, StockX, or eBay.
              </p>
            </div>
            <MultiSeriesChart
              models={models}
              onSelectModel={setSelectedModelId}
              selectedModelId={selectedModel.id}
              series={comparisonSeries}
            />
          </div>

          <aside className="grid content-start gap-3">
            <div className="rounded-lg border border-[#d7dde6] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-[#b42318]">
                Selected model
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold text-[#111827]">{selectedModel.name}</h2>
                  <p className="mt-1 text-sm text-[#667085]">{selectedModel.reference}</p>
                </div>
                <WatchToken model={selectedModel} />
              </div>
              <div className="mt-5 grid gap-2">
                <StatRow label="Retail" value={eurFormatter.format(selectedModel.retailPriceEur)} />
                <StatRow
                  label="Median ask"
                  value={
                    selectedSummary.medianAskEur === null
                      ? "No data"
                      : eurFormatter.format(selectedSummary.medianAskEur)
                  }
                />
                <StatRow
                  label="Premium"
                  value={
                    selectedSummary.premiumPercent === null
                      ? "No data"
                      : `${selectedSummary.premiumPercent > 0 ? "+" : ""}${
                          selectedSummary.premiumPercent
                        }%`
                  }
                />
                <StatRow label="Trusted listings" value={String(selectedSummary.listingCount)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Metric label="Sources" value={String(activeSources.size)} detail="MVP feeds" />
              <Metric
                label="Chart points"
                value={String(
                  comparisonSeries.reduce(
                    (total, modelSeries) => total + modelSeries.points.length,
                    0,
                  ),
                )}
                detail="Daily medians"
              />
              <Metric
                label="Last scrape"
                value={latestObservation ? formatDate(latestObservation) : "n/a"}
                detail="Seed data timestamp"
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-[#b42318]">
                Listing evidence
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#101828]">
                {selectedModel.name} source links
              </h2>
            </div>
            <p className="w-full max-w-xl text-sm text-[#667085] sm:w-auto sm:text-right">
              Showing latest observation per marketplace for the selected model.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {latestBySource.map((listing) => (
              <a
                className="block rounded-lg border border-[#d0d5dd] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#101828]"
                href={listing.url}
                key={`${listing.source}-${listing.url}`}
                rel="noreferrer"
                target="_blank"
              >
                <span className="text-xs font-semibold uppercase text-[#667085]">
                  {sourceLabels[listing.source]}
                </span>
                <span className="mt-3 block text-2xl font-semibold text-[#101828]">
                  {eurFormatter.format(listing.priceEur)}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm leading-5 text-[#475467]">
                  {listing.title}
                </span>
                <span className="mt-3 block text-xs font-semibold text-[#b42318]">
                  Open listing
                </span>
              </a>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-[#d0d5dd] bg-white">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="bg-[#f2f4f7] text-xs uppercase text-[#667085]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Listing</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Observed</th>
                  <th className="px-4 py-3 font-semibold">EUR ask</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {trustedListings.slice(0, 16).map((listing) => (
                  <tr
                    className="border-t border-[#eaecf0]"
                    key={`${listing.sourceListingId}-${listing.source}-${listing.observedAt}`}
                  >
                    <td className="px-4 py-3 font-semibold text-[#101828]">
                      {sourceLabels[listing.source]}
                    </td>
                    <td className="max-w-sm px-4 py-3 text-[#475467]">
                      <a
                        className="underline decoration-[#98a2b3] underline-offset-4 hover:text-[#101828]"
                        href={listing.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {listing.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-[#475467]">{listing.country ?? "-"}</td>
                    <td className="px-4 py-3 text-[#475467]">
                      {listing.observedAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#101828]">
                      {eurFormatter.format(listing.priceEur)}
                    </td>
                    <td className="px-4 py-3 text-[#475467]">
                      {Math.round(listing.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid min-w-0 content-start gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-[#b42318]">Collection</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#101828]">
              Scraping methods by source
            </h2>
          </div>
          {strategies.map((strategy) => (
            <article
              className="rounded-lg border border-[#d0d5dd] bg-white p-4 shadow-sm"
              key={strategy.source}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">{strategy.source}</h3>
                  <p className="mt-1 text-xs uppercase text-[#667085]">{strategy.region}</p>
                </div>
                <span className="rounded-md bg-[#dcfae6] px-2 py-1 text-xs font-semibold text-[#067647]">
                  {strategy.reliability}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <SourceDetail label="Access" value={strategy.access} />
                <SourceDetail label="Cadence" value={strategy.cadence} />
              </dl>
              <p className="mt-4 text-sm leading-6 text-[#475467]">{strategy.notes}</p>
              <ul className="mt-4 grid gap-2 text-sm text-[#344054]">
                {strategy.scrapingMethods.map((method) => (
                  <li className="rounded-md bg-[#f2f4f7] px-3 py-2" key={method}>
                    {method}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <a
                  className="text-[#b42318] underline decoration-[#fecdca] underline-offset-4 hover:decoration-[#b42318]"
                  href={strategy.exampleListingUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Example listing
                </a>
                <a
                  className="text-[#344054] underline decoration-[#98a2b3] underline-offset-4 hover:decoration-[#344054]"
                  href={strategy.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source/API
                </a>
              </div>
            </article>
          ))}
        </aside>
      </section>

      <footer className="border-t border-[#d7dde6] bg-white px-4 py-5 text-sm text-[#667085] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-wrap justify-between gap-3">
          <span>Royal Pop price tracker MVP</span>
          <span>Independent tracker; transactions happen on third-party marketplaces.</span>
        </div>
      </footer>
    </main>
  );
}

function MultiSeriesChart({
  models,
  onSelectModel,
  selectedModelId,
  series,
}: {
  models: RoyalPopModel[];
  onSelectModel: (modelId: RoyalPopModelId) => void;
  selectedModelId: RoyalPopModelId;
  series: ModelComparisonSeries[];
}) {
  const width = 1120;
  const height = 560;
  const padding = { top: 42, right: 150, bottom: 70, left: 76 };
  const dates = Array.from(
    new Set(series.flatMap((modelSeries) => modelSeries.points.map((point) => point.date))),
  ).sort();
  const values = series.flatMap((modelSeries) =>
    modelSeries.points.map((point) => point.medianAskEur),
  );
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.07;
  const valueRange = maxValue - minValue || 1;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xForDate = (date: string) => {
    const index = dates.indexOf(date);
    const step = dates.length > 1 ? chartWidth / (dates.length - 1) : 0;

    return padding.left + step * index;
  };
  const yForValue = (value: number) =>
    padding.top + (1 - (value - minValue) / valueRange) * chartHeight;
  const yTicks = [maxValue, (maxValue + minValue) / 2, minValue];
  const modelById = new Map(models.map((model) => [model.id, model]));
  const endpointMarkers = adjustEndpointMarkers(
    series
      .map((modelSeries) => {
        const latestPoint = modelSeries.points[modelSeries.points.length - 1];
        const model = modelById.get(modelSeries.modelId);

        if (!latestPoint || !model) {
          return null;
        }

        return {
          model,
          series: modelSeries,
          lineX: xForDate(latestPoint.date),
          lineY: yForValue(latestPoint.medianAskEur),
        };
      })
      .filter((marker): marker is EndpointMarkerInput => marker !== null),
    padding.top + 24,
    height - padding.bottom - 24,
  );

  return (
    <div className="rounded-lg border border-[#d7dde6] bg-white p-3 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[#b42318]">
            Main chart
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#111827]">
            Daily median ask by Royal Pop model
          </h2>
        </div>
        <p className="text-sm text-[#667085]">
          {dates[0]} to {dates[dates.length - 1]}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e4e7ec] bg-white">
        <svg
          aria-label="Daily median ask by Royal Pop model"
          className="h-auto w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect fill="#ffffff" height={height} width={width} />
          <rect
            fill="#fbfcfe"
            height={height - padding.top - padding.bottom}
            rx="10"
            width={width - padding.left - padding.right}
            x={padding.left}
            y={padding.top}
          />
          {yTicks.map((tick) => {
            const y = yForValue(tick);

            return (
              <g key={tick}>
                <line
                  stroke="#e4e7ec"
                  strokeWidth="1"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#667085"
                  fontSize="13"
                  textAnchor="end"
                  x={padding.left - 12}
                  y={y + 4}
                >
                  {eurFormatter.format(tick)}
                </text>
              </g>
            );
          })}

          {dates.map((date) => {
            const x = xForDate(date);

            return (
              <g key={date}>
                <line
                  stroke="#f2f4f7"
                  strokeWidth="1"
                  x1={x}
                  x2={x}
                  y1={padding.top}
                  y2={height - padding.bottom}
                />
                <text
                  fill="#667085"
                  fontSize="13"
                  textAnchor="middle"
                  x={x}
                  y={height - padding.bottom + 34}
                >
                  {date.slice(5)}
                </text>
              </g>
            );
          })}

          {series.map((modelSeries) => {
            const palette = modelPalette[modelSeries.modelId];
            const isSelected = modelSeries.modelId === selectedModelId;
            const pathPoints = modelSeries.points
              .map((point) => `${xForDate(point.date)},${yForValue(point.medianAskEur)}`)
              .join(" ");
            return (
              <g key={modelSeries.modelId}>
                <polyline
                  fill="none"
                  opacity={isSelected ? 1 : 0.42}
                  points={pathPoints}
                  stroke={palette.line}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isSelected ? 5 : 2.5}
                />
                {modelSeries.points.map((point) => (
                  <circle
                    cx={xForDate(point.date)}
                    cy={yForValue(point.medianAskEur)}
                    fill={isSelected ? "#ffffff" : palette.line}
                    key={`${modelSeries.modelId}-${point.date}`}
                    opacity={isSelected ? 1 : 0.55}
                    r={isSelected ? 5 : 3}
                    stroke={palette.line}
                    strokeWidth={isSelected ? 3 : 1}
                  />
                ))}
              </g>
            );
          })}

          {endpointMarkers.map((marker) => {
            const palette = modelPalette[marker.series.modelId];
            const markerX = width - padding.right + 44;
            const clipId = `watch-face-${marker.series.modelId}`;
            const imageSize = 42;
            const faceImage = getFaceImagePlacement(marker.model, markerX, marker.y, imageSize);

            return (
              <g key={`endpoint-${marker.series.modelId}`}>
                <defs>
                  <clipPath id={clipId}>
                    <circle cx={markerX} cy={marker.y} r={imageSize / 2} />
                  </clipPath>
                </defs>
                <line
                  stroke={palette.line}
                  strokeOpacity="0.65"
                  strokeWidth="1.5"
                  x1={marker.lineX}
                  x2={markerX - imageSize / 2}
                  y1={marker.lineY}
                  y2={marker.y}
                />
                <circle
                  cx={markerX}
                  cy={marker.y}
                  fill="#ffffff"
                  r={imageSize / 2 + 3}
                  stroke={palette.line}
                  strokeWidth={marker.series.modelId === selectedModelId ? 3 : 1.5}
                />
                <image
                  clipPath={`url(#${clipId})`}
                  height={faceImage.height}
                  href={marker.model.imageUrl}
                  preserveAspectRatio="xMidYMid meet"
                  width={faceImage.width}
                  x={faceImage.x}
                  y={faceImage.y}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model) => {
          const modelSeries = series.find((candidate) => candidate.modelId === model.id);
          const isSelected = selectedModelId === model.id;
          const palette = modelPalette[model.id];

          return (
            <button
              className={`flex min-h-20 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                isSelected
                  ? "border-[#111827] bg-[#f8fafc] text-[#101828]"
                  : "border-[#d7dde6] bg-white text-[#111827] hover:border-[#98a2b3]"
              }`}
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              type="button"
            >
              <span>
                <span className="block text-sm font-semibold">{model.name}</span>
                <span className="text-xs text-[#667085]">
                  {model.reference}
                </span>
              </span>
              <span
                className="rounded-md px-2 py-1 text-sm font-semibold"
                style={{ backgroundColor: palette.fill, color: palette.ink }}
              >
                {modelSeries?.currentMedianEur === null || modelSeries?.currentMedianEur === undefined
                  ? "n/a"
                  : formatCompactEur(modelSeries.currentMedianEur)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[#d0d5dd] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-[#667085]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#101828]">{value}</p>
      <p className="mt-1 text-sm text-[#667085]">{detail}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e4e7ec] bg-[#f8fafc] px-3 py-2">
      <span className="text-sm text-[#667085]">{label}</span>
      <span className="text-base font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function SourceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#667085]">{label}</dt>
      <dd className="text-right font-semibold text-[#101828]">{value}</dd>
    </div>
  );
}

function WatchToken({ model }: { model: RoyalPopModel }) {
  const palette = modelPalette[model.id];

  return (
    <span
      aria-label={`${model.name} color token`}
      className="block h-20 w-20 shrink-0 rounded-full border-[3px] bg-white bg-contain bg-center bg-no-repeat shadow-sm"
      style={{
        backgroundImage: `url(${model.imageUrl})`,
        backgroundPosition: `${model.faceCrop.xPercent}% ${model.faceCrop.yPercent}%`,
        backgroundSize: `${model.faceCrop.scale * 100}%`,
        borderColor: palette.line,
      }}
    />
  );
}

function getFaceImagePlacement(
  model: RoyalPopModel,
  centerX: number,
  centerY: number,
  cropDiameter: number,
) {
  const width = cropDiameter * model.faceCrop.scale;
  const height = width * (380 / 360);

  return {
    height,
    width,
    x: centerX - width * (model.faceCrop.xPercent / 100),
    y: centerY - height * (model.faceCrop.yPercent / 100),
  };
}

interface EndpointMarkerInput {
  model: RoyalPopModel;
  series: ModelComparisonSeries;
  lineX: number;
  lineY: number;
}

interface EndpointMarker extends EndpointMarkerInput {
  y: number;
}

function adjustEndpointMarkers(
  markers: EndpointMarkerInput[],
  minY: number,
  maxY: number,
): EndpointMarker[] {
  const minGap = 46;
  const sortedMarkers = [...markers].sort((left, right) => left.lineY - right.lineY);
  const forwardPass: EndpointMarker[] = [];

  for (const marker of sortedMarkers) {
    const previous = forwardPass[forwardPass.length - 1];
    const previousY = previous ? previous.y : minY - minGap;
    const y = Math.min(Math.max(marker.lineY, previousY + minGap), maxY);

    forwardPass.push({ ...marker, y });
  }

  for (let index = forwardPass.length - 2; index >= 0; index -= 1) {
    const next = forwardPass[index + 1];
    forwardPass[index] = {
      ...forwardPass[index],
      y: Math.min(forwardPass[index].y, next.y - minGap),
    };
  }

  return forwardPass.map((marker) => ({
    ...marker,
    y: Math.max(minY, Math.min(marker.y, maxY)),
  }));
}

function getLatestListingsBySource(listings: NormalizedListing[]): NormalizedListing[] {
  const latestBySource = new Map<MarketplaceSource, NormalizedListing>();

  for (const listing of listings) {
    const current = latestBySource.get(listing.source);

    if (!current || listing.observedAt > current.observedAt) {
      latestBySource.set(listing.source, listing);
    }
  }

  return Array.from(latestBySource.values()).sort((left, right) =>
    sourceLabels[left.source].localeCompare(sourceLabels[right.source]),
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCompactEur(value: number): string {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`;
  }

  return eurFormatter.format(value);
}
