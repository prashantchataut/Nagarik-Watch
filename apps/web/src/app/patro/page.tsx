import type { Metadata } from "next";
import PatroView from "@/components/nagarik/PatroView";

export const metadata: Metadata = {
  title: "पात्रो — वि.सं. मिति, चाडपर्व र पञ्चाङ्ग",
  description:
    "विक्रम संवत् पात्रो: मिति, तिथि, नक्षत्र, चाडबाड र सार्वजनिक बिदा — खगोल गणनामा आधारित सटीक नेपाली पात्रो।",
  alternates: { canonical: "/patro" },
};

export default function PatroPage() {
  return <PatroView />;
}
