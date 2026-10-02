/** Public base URL of the site, for canonical links, sitemaps and JSON-LD.
 *  Set NEXT_PUBLIC_SITE_URL in production (e.g. https://careers.example.com). */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const ORGANIZATION_NAME = "Peak Process Partners";
