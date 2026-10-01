"use client";

import { useClerk } from "@clerk/nextjs";

/** Signs the HR admin out of Clerk and returns them to the admin sign-in page. */
export function useAdminSignOut() {
  const { signOut } = useClerk();
  return () => signOut({ redirectUrl: "/admin/login" });
}
