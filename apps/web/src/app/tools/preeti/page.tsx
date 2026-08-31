import type { Metadata } from "next";
import { PreetiTool } from "@/components/nagarik/ToolsView";

export const metadata: Metadata = {
  title: "प्रिती कन्भर्टर",
  description: "प्रिती (ASCII) नेपालीलाई युनिकोडमा बदल्नुहोस् — पत्रकार र टाइपिस्टका लागि।",
  alternates: { canonical: "/tools/preeti" },
};

export default function PreetiPage() {
  return <PreetiTool />;
}
