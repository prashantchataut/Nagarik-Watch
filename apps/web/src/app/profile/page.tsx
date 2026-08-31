import type { Metadata } from "next";
import ProfilePageClient from "./page-client";

export const metadata: Metadata = {
  title: "प्रोफाइल",
  description: "तपाईंको पाठक खाता — सदस्यता, सेभ, पढाइ-इतिहास र कुकी छनोट।",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
