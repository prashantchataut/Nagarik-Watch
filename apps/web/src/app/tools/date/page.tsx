import type { Metadata } from "next";
import { DateConverterTool } from "@/components/nagarik/ToolsView";

export const metadata: Metadata = {
  title: "मिति कन्भर्टर (वि.सं. ⇄ ई.सं.)",
  description: "विक्रम संवत् र ईस्वी संवत् बीच मिति बदल्नुहोस्।",
  alternates: { canonical: "/tools/date" },
};

export default function DatePage() {
  return <DateConverterTool />;
}
