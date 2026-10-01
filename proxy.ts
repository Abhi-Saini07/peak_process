import { clerkMiddleware } from "@clerk/nextjs/server";

// Runs Clerk on the HR admin routes only, so `auth()` works there. Who counts
// as an admin is decided in lib/server/adminSession.ts (ADMIN_EMAILS), which the
// admin layout and every /api/admin route already call.
export default clerkMiddleware();

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
