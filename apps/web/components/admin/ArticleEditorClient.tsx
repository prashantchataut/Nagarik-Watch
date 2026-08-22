'use client'

import dynamic from 'next/dynamic'
import type { JSX } from 'react'
import type { Author, Category, Tag } from '@nagarikwatch/db'
import type { NewsroomRole } from '@/lib/admin-roles'
import type { HeroMediaLibraryItem } from '@/components/admin/HeroMediaField'

type EditorProps = {
  initial?: Record<string, unknown> & { id?: string }
  categories: Category[]
  tags: Tag[]
  authors?: Author[]
  role: NewsroomRole
  isNew: boolean
  mediaLibrary?: HeroMediaLibraryItem[]
}

const ArticleEditorLazy = dynamic(
  () => import('@/components/admin/ArticleEditor').then((m) => m.ArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="grid min-h-[28rem] animate-pulse gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]"
        aria-busy="true"
        aria-label="सम्पादक लोड हुँदै"
      >
        <div className="space-y-3">
          <div className="h-12 rounded-sm bg-rule/50" />
          <div className="h-10 rounded-sm bg-rule/40" />
          <div className="h-64 rounded-sm border border-rule bg-surface-raised" />
        </div>
        <div className="h-80 rounded-sm border border-rule bg-surface-raised" />
      </div>
    ),
  },
)

/** Code-splits the large desk editor so new/edit pages paint faster. */
export function ArticleEditorClient(props: EditorProps) {
  const Lazy = ArticleEditorLazy as unknown as (p: EditorProps) => JSX.Element
  return <Lazy {...props} />
}
