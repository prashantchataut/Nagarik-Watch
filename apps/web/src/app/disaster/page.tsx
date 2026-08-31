import type { Metadata } from "next";
import DisasterHub from "@/components/nagarik/DisasterHub";
import { SITE } from "@/lib/news/seo";

export const metadata: Metadata = {
  title: "विपद् केन्द्र — बाढी तथा प्रकोप",
  description:
    "भोटेकोशी बाढी (२६ अगस्ट २०२६) र मनसुन विपद्को एकै ठाउँमा तथ्याङ्क: मृत्यु, बेपत्ता, विस्थापित, जिल्लागत असर, आपत्कालीन सम्पर्क, सुरक्षा निर्देशन र ताजा कभरेज।",
  alternates: { canonical: "/disaster" },
  openGraph: {
    title: "विपद् केन्द्र — बाढी तथा प्रकोप",
    description: "बाढी र प्रकोपको तथ्याङ्क, सुरक्षा जानकारी र ताजा कभरेज।",
    url: `${SITE.url}/disaster`,
  },
};

export default function DisasterPage() {
  return <DisasterHub />;
}
