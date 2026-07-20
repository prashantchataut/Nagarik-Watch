import type { HomepageData, HomepageSection, StoryCardData } from '@nagarikwatch/db'

/**
 * Remove duplicate stories across homepage modules (lead, breaking, secondary,
 * section leads/items). Stable article IDs are the dedup key.
 */
export function dedupeHomepage(homepage: HomepageData): HomepageData {
  const used = new Set<string>([homepage.lead.id])

  function takeUnique(stories: StoryCardData[]): StoryCardData[] {
    const out: StoryCardData[] = []
    for (const story of stories) {
      if (used.has(story.id)) continue
      used.add(story.id)
      out.push(story)
    }
    return out
  }

  const secondary = takeUnique(homepage.secondary)
  const breaking = takeUnique(homepage.breaking)

  const sections: HomepageSection[] = homepage.sections.map((section) => {
    let lead = section.lead
    if (lead) {
      if (used.has(lead.id)) lead = undefined
      else used.add(lead.id)
    }
    return {
      ...section,
      lead,
      items: takeUnique(section.items),
    }
  })

  return {
    ...homepage,
    secondary,
    breaking,
    sections,
  }
}
