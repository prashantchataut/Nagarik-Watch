import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalView from "@/components/nagarik/LegalView";
import { INFO_PAGES } from "@/lib/news/info-pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = INFO_PAGES["advertise"]
  if (!page) return { title: "पृष्ठ भेटिएन" }
  return {
    title: page.title,
    description: page.sections[0]?.paras[0]?.slice(0, 150),
    alternates: { canonical: "/advertise" },
  }
}

export default function LegalRoutePage() {
  const page = INFO_PAGES["advertise"]
  if (!page) notFound()
  return <LegalView slug="advertise" />
}
