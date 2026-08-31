import type { Metadata } from "next";
import SubscribePageClient from "./page-client";

export const metadata: Metadata = {
  title: "सदस्यता — नागरिक वाच संरक्षक बन्नुहोस्",
  description:
    "मासिक रु. ३०० देखि — प्रिमियम रिपोर्टिङ, विज्ञापन-न्यून अनुभव र साँझ ब्रिफिङ। मुख्य समाचार, विपद् जानकारी र तथ्य जाँच सधैं निःशुल्क।",
  alternates: { canonical: "/subscribe" },
};

export default function SubscribePage() {
  return <SubscribePageClient />;
}
