import type { Metadata } from "next";
import NepseView from "@/components/nagarik/NepseView";

export const metadata: Metadata = {
  title: "बजार — NEPSE, विदेशी मुद्रा, लगानी मूल्य",
  description:
    "नेप्से सूचकांक, सुन-चाँदी, नेपाल राष्ट्र बैंकको विदेशी मुद्रा दर र इन्धन मूल्य — लाइभ वा स्पष्ट रूपमा चिन्हित स्न्यापसट।",
  alternates: { canonical: "/nepse" },
};

export default function NepsePage() {
  return <NepseView />;
}
