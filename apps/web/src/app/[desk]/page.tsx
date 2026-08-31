import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DeskPage from "@/components/nagarik/DeskPage";
import { deskBySlug, desks, stories } from "@/lib/news/data";
import { jsonLdItemList, articlePath } from "@/lib/news/seo";

export function generateStaticParams() {
  // disaster + fact-check have their own hub routes; the rest are desk pages.
  return desks
    .filter((d) => d.slug !== "disaster" && d.slug !== "fact-check")
    .map((d) => ({ desk: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ desk: string }>
}): Promise<Metadata> {
  const { desk } = await params
  const info = deskBySlug.get(desk)
  if (!info) return { title: "डेस्क भेटिएन" }
  return {
    title: `${info.nameNe} — ${info.nameEn} समाचार`,
    description: info.descriptionNe,
    alternates: { canonical: `/${desk}` },
    openGraph: {
      title: `${info.nameNe} — नागरिक वाच`,
      description: info.descriptionNe,
      url: `/${desk}`,
    },
  }
}

export default async function DeskRoutePage({
  params,
}: {
  params: Promise<{ desk: string }>
}) {
  const { desk } = await params
  const info = deskBySlug.get(desk)
  if (!info || desk === "disaster" || desk === "fact-check") notFound()
  const deskStories = stories.filter((s) => s.desk === desk).slice(0, 20)
  const jsonLd = jsonLdItemList(`${info.nameNe} समाचार`, deskStories, `/${desk}`)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <DeskPage desk={desk} />
    </>
  )
}

// keep the import honest even if unused at runtime by some toolchains
void articlePath
