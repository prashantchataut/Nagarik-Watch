import type { Metadata } from "next";
import JournalistView from "@/components/nagarik/JournalistView";

export const metadata: Metadata = {
  title: "समाचार कक्ष",
  description: "पत्रकार लगइन — पिच, लेख, सम्पादकीय कार्यप्रवाह।",
  alternates: { canonical: "/journalist" },
  robots: { index: false, follow: false },
};

export default function JournalistPage() {
  return <JournalistView />;
}
