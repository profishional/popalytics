import { RoyalPopDashboard } from "@/components/RoyalPopDashboard";
import {
  marketplaceStrategies,
  normalizedListings,
  royalPopModels,
} from "@/lib/royal-pop/sample-data";

export default function Home() {
  return (
    <RoyalPopDashboard
      listings={normalizedListings}
      models={royalPopModels}
      strategies={marketplaceStrategies}
    />
  );
}
