import { describe, expect, it } from 'vitest'
import { adminPathOutcome, canCreate, canEdit, canPublish, canDelete } from './admin-roles'

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

describe('adminPathOutcome', () => {
  it('denies a desk the role has no rule for', () => {
    // A moderator runs comments and tips; the user list and the audit log are
    // USER_MANAGER_ROLES -- admin and super_admin only.
    expect(adminPathOutcome('moderator', '/admin/comments')).toBe('allow')
    expect(adminPathOutcome('moderator', '/admin/users')).toBe('deny')
    expect(adminPathOutcome('moderator', '/admin/audit-log')).toBe('deny')
  })

  it('denies nested paths under a restricted prefix, not just the prefix', () => {
    expect(adminPathOutcome('moderator', '/admin/users/invite')).toBe('deny')
  })

  it('sends journalist-desk roles to their own desk rather than a 404', () => {
    // A reporter who follows a stale /admin link belongs on the journalist
    // dashboard. Returning 'deny' here would 404 them out of the product.
    expect(adminPathOutcome('journalist', '/admin/dashboard')).toBe('journalist-desk')
    expect(adminPathOutcome('contributor', '/admin/users')).toBe('journalist-desk')
  })

  it('allows a role that owns the desk', () => {
    expect(adminPathOutcome('super_admin', '/admin/users')).toBe('allow')
    expect(adminPathOutcome('admin', '/admin/audit-log')).toBe('allow')
    expect(adminPathOutcome('section_editor', '/admin/journalists')).toBe('allow')
  })

  it('allows unruled admin paths only to roles that belong in the console at all', () => {
    // No rule matches /admin/dashboard, so the fallback is ADMIN_BASE_ROLES.
    // `viewer` is in it and `reader` is not, and `reader` still satisfies
    // `NEWSROOM_ROLES`, so it reaches this check rather than being turned away
    // at the session boundary.
    expect(adminPathOutcome('section_editor', '/admin/dashboard')).toBe('allow')
    expect(adminPathOutcome('viewer', '/admin/dashboard')).toBe('allow')
    expect(adminPathOutcome('reader', '/admin/dashboard')).toBe('deny')
  })
})
