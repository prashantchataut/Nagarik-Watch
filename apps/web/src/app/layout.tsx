import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    template: "%s · नागरिक वाच",
  },
  description:
    "नागरिक वाच: नेपाली भाषाको डिजिटल समाचार पत्रिका — राजनीति, समाज, बजार, खेलकुद, विचार र प्रदेशका समाचार, पात्रो, नेप्से र उपयोगी उपकरणसहित।",
  keywords: [
    "नागरिक वाच",
    "Nagarik Watch",
    "नेपाल समाचार",
    "Nepali news",
    "नेपाली समाचार",
    "Kathmandu news",
  ],
  authors: [{ name: "नागरिक वाच" }],
  metadataBase: new URL("https://nagarikwatch.com"),
  openGraph: {
    title: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    description:
      "राजनीति, समाज, बजार, खेलकुद र विचार — Devanagari-first newsroom।",
    siteName: "नागरिक वाच",
    type: "website",
    locale: "ne_NP",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "नागरिक वाच — नागरिक सरोकारको पहरा",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "नागरिक वाच — समाचार, विचार र नागरिक सरोकार",
    description: "नेपाली भाषाको स्वतन्त्र डिजिटल समाचार पत्रिका।",
    images: ["/og-image.jpg"],
  },
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
