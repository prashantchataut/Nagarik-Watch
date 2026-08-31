import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SiteShell from "@/components/nagarik/SiteShell";
import { SITE, jsonLdOrganization, jsonLdWebSite } from "@/lib/news/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    template: "%s — नागरिक वाच",
  },
  description:
    "नागरिक वाच: नेपाली भाषाको डिजिटल समाचार पत्रिका — राजनीति, समाज, बजार, खेलकुद, विपद्, तथ्य जाँच र प्रदेशका समाचार, पात्रो, बजार डाटा र उपयोगी उपकरणसहित।",
  keywords: [
    "नागरिक वाच",
    "Nagarik Watch",
    "नेपाल समाचार",
    "Nepali news",
    "नेपाली समाचार",
    "Kathmandu news",
    "नेपाल बाढी",
    "Nepal flood",
    "तथ्य जाँच",
    "नेपाल पात्रो",
  ],
  authors: [{ name: "नागरिक वाच" }],
  alternates: {
    canonical: "/",
    languages: { "ne-NP": "/", "en-US": "/en" },
  },
  openGraph: {
    title: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    description: "राजनीति, समाज, बजार, खेलकुद, विपद् र विचार — Devanagari-first newsroom।",
    siteName: "नागरिक वाच",
    type: "website",
    locale: "ne_NP",
    url: SITE.url,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: "नागरिक वाच — नागरिक सरोकारको पहरा" }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    description: "नेपाली भाषाको स्वतन्त्र डिजिटल समाचार पत्रिका।",
    images: [SITE.ogImage],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#C02A2A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLdOrganization(), jsonLdWebSite()]).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <SiteShell>{children}</SiteShell>
        <Toaster />
      </body>
    </html>
  );
}
