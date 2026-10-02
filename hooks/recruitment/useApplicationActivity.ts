"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { averageRating, buildActivityTimeline, noteInputSchema } from "@/lib/recruitment/notes";
import type { ApplicationDetail } from "@/types/recruitment";

/** Activity timeline items plus the note composer's state. Posting a note
 *  validates with the same Zod schema as the API, then refreshes the page. */
export function useApplicationActivity(application: Pick<ApplicationDetail, "id" | "history" | "notes">) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const items = useMemo(
    () => buildActivityTimeline(application.history, application.notes),
    [application.history, application.notes],
  );
  const average = useMemo(() => averageRating(application.notes), [application.notes]);
  const ratedCount = application.notes.filter((n) => n.rating != null).length;

  async function submit() {
    const parsed = noteInputSchema.safeParse({ body, rating });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the note.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save the note.");
        return;
      }
      setBody("");
      setRating(null);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    items,
    average,
    ratedCount,
    composer: {
      body,
      setBody: (value: string) => {
        setBody(value);
        setError(null);
      },
      rating,
      setRating,
      error,
      isSaving,
      submit,
    },
  };
}

export type ApplicationActivity = ReturnType<typeof useApplicationActivity>;
