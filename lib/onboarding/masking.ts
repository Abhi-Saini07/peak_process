/** "•••• •••• 1234": only the last 4 characters of a government ID, or null
 *  when there's nothing on file. Safe to send to the browser. */
export function maskGovernmentId(value: string | null | undefined): string | null {
  const clean = (value ?? "").replace(/\s/g, "");
  if (!clean) return null;
  const visible = clean.slice(-4);
  const groups = Math.max(1, Math.ceil((clean.length - 4) / 4));
  return `${"•••• ".repeat(groups)}${visible}`;
}
