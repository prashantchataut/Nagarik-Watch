import type { Metadata } from "next";
import ScoresView from "@/components/nagarik/ScoresView";

export const metadata: Metadata = {
  title: "लाइभ स्कोर",
  description: "क्रिकेट र फुटबलका खेलका लाइभ स्कोर र तालिका।",
  alternates: { canonical: "/scores" },
};

export default function ScoresPage() {
  return <ScoresView />;
}
