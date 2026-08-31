import type { Metadata } from "next";
import FactCheckView from "@/components/nagarik/FactCheckView";
import { SITE } from "@/lib/news/seo";

export const metadata: Metadata = {
  title: "तथ्य जाँच — भाइरल दाबीहरूको प्रमाणसँग जाँच",
  description:
    "नेपालमा भाइरल हुने दाबीहरू प्रमाणसँग मिलाएर सार्वजनिक निर्णय: सही, मिश्रित, गलत वा सन्दर्भ चाहिन्छ। तपाईंको दाबी पठाउनुहोस्।",
  alternates: { canonical: "/fact-check" },
  openGraph: {
    title: "तथ्य जाँच — नागरिक वाच",
    description: "भाइरल दाबीहरूको प्रमाणसँग जाँच।",
    url: `${SITE.url}/fact-check`,
  },
};

export default function FactCheckPage() {
  return <FactCheckView />;
}
