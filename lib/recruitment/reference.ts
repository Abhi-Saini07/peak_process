/**
 * A human-friendly application reference derived straight from the
 * application's own UUID — no separate `reference` column needed (unlike
 * onboarding's independently-generated `submission_reference`), since it's
 * always reproducible from the id and inherits its uniqueness for free.
 */
export function applicationReferenceFromId(id: string): string {
  return `APP-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}
