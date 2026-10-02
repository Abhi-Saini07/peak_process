import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPublicJobById } from "@/lib/server/jobRepository";
import { employmentTypeLabel, workModeLabel } from "@/lib/recruitment/constants";
import { ORGANIZATION_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `Open role at ${ORGANIZATION_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Nocturne dark tokens from app/globals.css (ImageResponse can't read CSS variables).
const C = {
  bg: "#0e1320",
  card: "#151b2b",
  border: "#232c42",
  ink: "#e8ecf5",
  muted: "#9aa5bd",
  accent: "#8fa2ff",
  accentText: "#a9b7ff",
  accentTint: "#1e2748",
};

const fontDir = join(process.cwd(), "assets/fonts");

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, sora, jakarta, jakartaBold] = await Promise.all([
    getPublicJobById(id),
    readFile(join(fontDir, "Sora-SemiBold.ttf")),
    readFile(join(fontDir, "PlusJakartaSans-Medium.ttf")),
    readFile(join(fontDir, "PlusJakartaSans-Bold.ttf")),
  ]);

  const title = job?.title ?? "Careers";
  const eyebrow = job?.department ?? "Open role";
  const tags = job
    ? [job.location, workModeLabel(job.workMode), employmentTypeLabel(job.employmentType)].filter(
        (t): t is string => Boolean(t),
      )
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `radial-gradient(circle at 85% 0%, rgba(143,162,255,0.26), ${C.bg} 55%)`,
          color: C.ink,
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: C.accent,
              color: C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Sora",
              fontSize: 24,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{ORGANIZATION_NAME}</div>
          <div style={{ fontSize: 26, color: C.muted }}>· Careers</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: C.accentText, textTransform: "uppercase" }}>
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "Sora",
              fontSize: title.length > 40 ? 64 : 80,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: C.ink,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: C.card,
                border: `1px solid ${C.border}`,
                fontSize: 26,
                color: C.ink,
              }}
            >
              {tag}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              padding: "12px 28px",
              borderRadius: 12,
              background: C.accentTint,
              color: C.accentText,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Apply now →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Sora", data: sora, weight: 600, style: "normal" },
        { name: "Plus Jakarta Sans", data: jakarta, weight: 500, style: "normal" },
        { name: "Plus Jakarta Sans", data: jakartaBold, weight: 700, style: "normal" },
      ],
    },
  );
}
