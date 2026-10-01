import type { Metadata } from "next";
import { NocturneDashboard } from "@/components/nocturne/NocturneDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Peak Process Partners",
};

export default function DashboardPage() {
  return <NocturneDashboard />;
}
