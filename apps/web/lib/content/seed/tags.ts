import type { Tag } from '@nagarikwatch/db'

export const tags: Tag[] = []
export const tagById = new Map<string, Tag>()
export const tagBySlug = new Map<string, Tag>()
