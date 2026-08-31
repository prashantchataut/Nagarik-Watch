import type { Metadata } from "next";
import RashifalView from "@/components/nagarik/RashifalView";

export const metadata: Metadata = {
  title: "राशिफल",
  description: "बाह्र राशिको दैनिक राशिफल।",
  alternates: { canonical: "/rashifal" },
};

export default function RashifalPage() {
  return <RashifalView />;
}
