import { connection } from "next/server";

import { RoyalPopDashboard } from "@/components/RoyalPopDashboard";
import { getDashboardData } from "@/lib/db/dashboard-data";

export default async function Home() {
  await connection();

  const dashboardData = await getDashboardData();

  return <RoyalPopDashboard {...dashboardData} />;
}
