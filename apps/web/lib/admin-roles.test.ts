import { describe, expect, it } from 'vitest'
import { canCreate, canEdit, canPublish, canDelete } from './admin-roles'

describe('newsroom RBAC', () => {
  it('allows journalists to create but not publish', () => {
    expect(canCreate('journalist')).toBe(true)
    expect(canPublish('journalist')).toBe(false)
  })

  it('allows publisher roles to publish', () => {
    expect(canPublish('editor_in_chief')).toBe(true)
    expect(canPublish('publisher')).toBe(true)
  })

  it('restricts hard delete to super admin', () => {
    expect(canDelete('admin')).toBe(false)
    expect(canDelete('super_admin')).toBe(true)
  })

  it('allows editors to edit any article', () => {
    expect(canEdit('section_editor')).toBe(true)
    expect(canEdit('contributor')).toBe(false)
  })
})
