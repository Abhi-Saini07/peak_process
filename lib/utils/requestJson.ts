/** fetch + JSON for the admin hooks: the parsed body on success, else a readable error. */
export async function requestJson(
  url: string,
  method: "POST" | "PATCH" | "PUT",
  body?: unknown,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: typeof data.error === "string" ? data.error : "Something went wrong. Try again." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
}
