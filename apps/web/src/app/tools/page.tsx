import type { Metadata } from "next";
import { ToolsHub } from "@/components/nagarik/ToolsView";

export const metadata: Metadata = {
  title: "उपकरणहरू",
  description: "प्रिती कन्भर्टर, मिति कन्भर्टर र अन्य उपयोगी उपकरण।",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return <ToolsHub />;
}
