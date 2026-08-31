import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleView from "@/components/nagarik/ArticleView";
import { db } from "@/lib/db";
import { dbArticleToStory } from "@/lib/news/cms"
import { toPublicArticle } from "@/lib/news/cms";
import { stories, deskBySlug, type Story } from "@/lib/news/data";
import {
  buildArticleTitle,
  buildArticleDescription,
  jsonLdNewsArticle,
  jsonLdBreadcrumb,
  articlePath,
  SITE,
} from "@/lib/news/seo";

export const revalidate = 60

export function generateStaticParams() {
  return stories.map((s) => ({ desk: s.desk, slug: s.slug }))
}

async function resolveStory(desk: string, slug: string): Promise<Story | null> {
  const staticStory = stories.find((s) => s.desk === desk && s.slug === slug)
  if (staticStory) return staticStory

  // Live CMS article (server-side so crawlers see full content).
  try {
    const row = await db.article.findFirst({
      where: { desk, slug, status: "published" },
      include: { author: { select: { name: true } } },
    })
    if (row) return dbArticleToStory(toPublicArticle(row))
  } catch {
    /* DB unavailable at build/preview — static archive still resolves */
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ desk: string; slug: string }>
}): Promise<Metadata> {
  const { desk, slug } = await params
  const story = await resolveStory(desk, slug)
  if (!story) return { title: "समाचार भेटिएन" }
  const deskInfo = deskBySlug.get(desk)
  return {
    title: story.titleNe,
    description: buildArticleDescription(story),
    alternates: { canonical: articlePath(story) },
    openGraph: {
      type: "article",
      title: story.titleNe,
      description: buildArticleDescription(story),
      url: `${SITE.url}${articlePath(story)}`,
      siteName: SITE.nameNe,
      locale: "ne_NP",
      publishedTime: new Date(story.publishedAt).toISOString(),
      modifiedTime: new Date(story.publishedAt).toISOString(),
      authors: [story.author],
      section: deskInfo?.nameNe,
      tags: story.tags,
      images: [{ url: story.hero, width: 1600, height: 900, alt: story.heroCaption || story.titleNe }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.titleNe,
      description: buildArticleDescription(story),
      images: [story.hero],
    },
  }
}

export default async function ArticleRoutePage({
  params,
}: {
  params: Promise<{ desk: string; slug: string }>
}) {
  const { desk, slug } = await params
  const story = await resolveStory(desk, slug)
  if (!story) notFound()
  const deskInfo = deskBySlug.get(desk)

  const jsonLd = [
    jsonLdNewsArticle(story),
    jsonLdBreadcrumb([
      { name: "गृह", path: "/" },
      { name: deskInfo?.nameNe ?? desk, path: `/${desk}` },
      { name: story.titleNe, path: articlePath(story) },
    ]),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ArticleView story={story} />
    </>
  )
}
