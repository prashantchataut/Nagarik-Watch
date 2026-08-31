import type { Metadata } from "next";
import { ProvinceHub } from "@/components/nagarik/ProvinceView";

export const metadata: Metadata = {
  title: "सातै प्रदेश",
  description: "कोशीदेखि सुदूरपश्चिमसम्म — प्रदेशअनुसार समाचार।",
  alternates: { canonical: "/province" },
};

export default function ProvinceIndexPage() {
  return <ProvinceHub />;
}
