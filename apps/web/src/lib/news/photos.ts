/**
 * Photo desk assignments — real photographs for the photo-forward surfaces
 * (lead, support pair, sports/entertainment desks), per DESIGN.md.
 * Stories not listed here fall back to their desk's editorial illustration
 * (public/photos/desks/*.jpg) instead of a plain SVG placeholder.
 */

export const photoAssignments: Record<string, string> = {
  // Sports desk (photo desk)
  'womens-football-pathway-nepal': '/photos/cricket-2.jpg',
  'kathmandu-road-race-community-sport': '/photos/street-1.jpg',
  'svc-nepal-domestic-cricket-structure': '/photos/cricket-1.jpg',
  'svc-football-transfer-windows-clubs': '/photos/cricket-3.jpg',

  // Entertainment desk (photo desk)
  'folk-music-revival-stages': '/photos/culture-2.jpg',
  'kathmandu-theatre-season': '/photos/culture-3.jpg',
  'heritage-cultural-events-calendar': '/photos/patan-3.jpg',
  'streaming-vs-cinema-debate': '/photos/patan-1.jpg',

  // Society + feature ambience
  'urban-waste-management-pressure': '/photos/street-3.jpg',
  'women-public-safety-transit': '/photos/street-1.jpg',

  // World / international desk
  'south-asia-monsoon-regional-picture': '/photos/himalaya-2.jpg',
  'climate-summit-prep-reader-brief': '/photos/himalaya-3.jpg',
  'remittance-corridors-global-context': '/photos/himalaya-1.jpg',

  // Education
  'digital-classrooms-equity': '/photos/street-3.jpg',
}

export function heroFor(slug: string, fallback: string, desk?: string): string {
  const assigned = photoAssignments[slug]
  if (assigned) return assigned
  // real photograph (from the newsroom archive) beats a generic desk card
  if (!fallback.startsWith('data:')) return fallback
  return deskHeroes[desk ?? 'politics'] ?? deskHeroes.politics!
}

/** Editorial illustration per desk — the default preview image. */
export const deskHeroes: Record<string, string> = {
  politics: '/photos/desks/politics.jpg',
  society: '/photos/desks/society.jpg',
  business: '/photos/desks/business.jpg',
  sports: '/photos/desks/sports.jpg',
  entertainment: '/photos/desks/entertainment.jpg',
  world: '/photos/desks/world.jpg',
  opinion: '/photos/desks/opinion.jpg',
  literature: '/photos/desks/literature.jpg',
  technology: '/photos/desks/technology.jpg',
  health: '/photos/desks/health.jpg',
  education: '/photos/desks/education.jpg',
  interview: '/photos/desks/interview.jpg',
  'photo-story': '/photos/desks/photo-story.jpg',
  video: '/photos/desks/video.jpg',
  diaspora: '/photos/desks/diaspora.jpg',
}
