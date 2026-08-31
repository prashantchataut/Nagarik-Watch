import type { Metadata } from "next";
import { SavedView } from "@/components/nagarik/SavedSearch";

export const metadata: Metadata = {
  title: "सेभ गरिएका समाचार",
  description: "तपाईंले सेभ गर्नुभएका समाचारहरू — यन्त्रमा मात्र वा खातासँग सिन्क।",
  alternates: { canonical: "/saved" },
};

export default function SavedPage() {
  return <SavedView />;
}
