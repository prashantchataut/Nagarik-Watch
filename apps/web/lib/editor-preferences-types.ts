export type EditorDensity = 'comfortable' | 'compact'
export type EditorLocalePref = 'ne' | 'en' | 'follow'

export type EditorPreferences = {
  userId: string
  defaultCategorySlug: string
  autosaveSeconds: number
  density: EditorDensity
  showFormattingHints: boolean
  preferredLocale: EditorLocalePref
  updatedAt: string
}

export const EDITOR_PREFERENCE_DEFAULTS: Omit<EditorPreferences, 'userId' | 'updatedAt'> = {
  defaultCategorySlug: '',
  autosaveSeconds: 30,
  density: 'comfortable',
  showFormattingHints: true,
  preferredLocale: 'follow',
}
