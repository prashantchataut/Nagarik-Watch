import type { Metadata } from "next";
import FeedView from "@/components/nagarik/FeedView";

export const metadata: Metadata = {
  title: "सबै समाचार — ताजा फिड",
  description:
    "नागरिक वाचका सबै समाचार एकै धारमा — डेस्क फिल्टर, पढाइ-गणना र तपाईंका लागि सिफारिससहित।",
  alternates: { canonical: "/feed" },
};

export default function FeedPage() {
  return <FeedView />;
}
