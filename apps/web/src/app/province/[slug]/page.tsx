import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProvincePage } from "@/components/nagarik/ProvinceView";
import { provinces, provinceBySlug } from "@/lib/news/data";

export function generateStaticParams() {
  return provinces.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const province = provinceBySlug.get(slug)
  if (!province) return { title: "प्रदेश भेटिएन" }
  return {
    title: `${province.nameNe} — प्रदेश समाचार`,
    description: `${province.nameNe}का समाचार र अद्यावधिक।`,
    alternates: { canonical: `/province/${slug}` },
  }
}

export default async function ProvinceRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!provinceBySlug.has(slug)) notFound()
  return <ProvincePage slug={slug} />
}
