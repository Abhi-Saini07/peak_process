import type { Metadata } from "next";
import { plusJakartaSans, sora } from "./fonts";
import { OnboardingHydrator } from "@/lib/store/OnboardingHydrator";
import { themeInitScript } from "@/lib/design/themeScript";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "New Hire Onboarding | Peak Process Partners",
  description:
    "Complete your onboarding with Peak Process Partners — personal information, references, benefits, and required documents in one guided flow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plusJakartaSans.variable}`}
      // The inline script below sets data-theme (light/dark) before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-nocturne-bg font-nocturne-ui text-nocturne-ink antialiased">
        <OnboardingHydrator />
        {children}
      </body>
    </html>
  );
}
