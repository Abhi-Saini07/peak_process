"use client";

import { usePathname } from "next/navigation";
import { NocturneJobDetailSkeleton, NocturneJobsListSkeleton } from "./NocturneCareersSkeletons";

/** Loading state for the public careers routes (app/jobs/** loading.tsx):
 *  the list skeleton on /jobs, the detail/apply skeleton below it. */
export function CareersLoading() {
  const pathname = usePathname();
  return pathname === "/jobs" ? <NocturneJobsListSkeleton /> : <NocturneJobDetailSkeleton />;
}
