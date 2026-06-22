---
name: form-expert
description: "Master of complex form patterns — validation UX, multi-step wizards, conditional fields, autosave, dirty detection, error display, file upload UX, and form accessibility. Use when building any form more complex than a single-field input. Invoke for form validation strategies, wizard/multi-step forms, dynamic field dependencies, autosave/draft recovery, dirty state detection, form error UX, upload UX, and large form performance."
license: MIT
compatibility: opencode
metadata:
  author: opencode
  version: "1.0.0"
  domain: frontend
  triggers: form, validation, wizard, multi-step, autosave, dirty, field, input, registration, checkout, survey
  role: specialist
  scope: implementation
  output-format: code
---

# Form Expert

Production-grade form patterns for every framework. Forms are the most error-prone UI element — this skill covers what most developers get wrong.

## Core Principles

1. **Validate at the right time** — inline (on blur/change), on submit, or debounced async. Never all at once.
2. **Error UX matters more than error logic** — a technically correct error the user can't understand is a UX bug.
3. **Every form needs a state model** — idle, validating, submitting, success, error. Track it explicitly.
4. **Assume network failure** — autosave, draft recovery, and idempotent submissions are not optional for production forms.
5. **Accessibility is structural** — `aria-invalid`, `aria-describedby`, `role="alert"`, and focus management are not afterthoughts.

## Form State Model

Every form component should implement this state machine:

```
idle → validating → submitting → success
                    → error (→ editing → idle)
         editing → idle (dirty detection)
```

Track at minimum: `isDirty`, `isValidating`, `isSubmitting`, `submitError`, `lastSaved`.

## Validation Patterns

### When to validate

| Trigger | Use case | Implementation |
|---------|----------|---------------|
| On blur | Single-field validation (email, URL, required) | Validate field when it loses focus |
| On change | Real-time feedback (password strength, character count) | Debounce 300ms, validate |
| On submit | Cross-field validation (confirm password, date range) | Validate entire form |
| Debounced async | Server-side checks (username availability, coupon code) | 500ms debounce, AbortController |

### Validation strategy per field type

| Field type | Validate on | Pattern |
|------------|------------|---------|
| Text/email | Blur | Format validation, required check |
| Password | Change + blur | Strength meter on change, format on blur |
| Select/dropdown | Change | Required check |
| Checkbox group | Change | Min/max selections |
| Date range | Submit | Start < end, business rules |
| File upload | Change + submit | Size, type, count on change; server validation on submit |
| Async (username) | Debounced change | 500ms debounce, cancel previous request |

### Error message guidelines

- **Be specific**: "Password must be at least 8 characters" not "Invalid password"
- **Be actionable**: "Enter a valid email address" not "Error in field"
- **Be contextual**: Show error next to the field AND in a summary at the top
- **Be brief**: 1 line max. No paragraphs.

## Multi-Step / Wizard Forms

### Step state management

```typescript
interface WizardState {
  currentStep: number
  totalSteps: number
  steps: Record<number, { status: 'pending' | 'active' | 'complete' | 'error'; data: any }>
  history: number[] // for back navigation
}
```

### Patterns

1. **Validate before advancing** — each step must be valid to proceed. Show errors inline before advancing.
2. **Persist between steps** — use a store (localStorage for draft recovery, state for session).
3. **Step indicator** — show: completed (✓), current (highlighted), future (dimmed). Allow clicking completed steps to edit.
4. **Back/forward guards** — warn on back if data will be lost. Validate forward before moving.
5. **Final review step** — always show a summary step before submission with "Edit" links per section.

### Progress indicator accessibility

```html
<nav aria-label="Progress">
  <ol role="list">
    <li aria-current="step">Step 2 of 5: Shipping</li>
  </ol>
</nav>
```

## Conditional / Dynamic Fields

### Implementation patterns

| Pattern | Use case | Notes |
|---------|----------|-------|
| Show/hide | Simple dependency (show "other" text field when "Other" selected) | Use CSS, not removal — preserve field state |
| Dynamic add/remove | Repeatable sections (line items, team members, phone numbers) | Track by stable ID, not index |
| Dependent options | Cascading selects (country → state → city) | Consider async loading per level |
| Calculated fields | Auto-compute from other fields (total = price × qty) | Read-only display, store the raw formula |

### Conditional field performance

- Use `display: none` not `*ngIf`/`v-if` for simple show/hide (preserves layout, no DOM thrash)
- For complex forms with 50+ conditional fields, use field virtualization
- Debounce expensive calculations (500ms)

## Autosave & Draft Recovery

### Autosave patterns

| Pattern | When | Implementation |
|---------|------|---------------|
| On change | Critical data (editor, long form) | Debounce 2s, save to localStorage + API |
| On blur | Field-level | Save individual field on blur |
| On interval | Long forms | Save every 30s regardless of changes |
| On navigate | Before route change | `beforeunload` + `onBeforeUnload` handler |

### Draft recovery

1. On mount, check localStorage/IndexedDB for saved draft
2. Show recovery banner: "You have an unsaved draft from [timestamp]. [Restore] [Discard]"
3. On restore, populate form + trigger dirty state
4. On successful submit, clear draft

### Conflict detection

When loading a draft that's older than the server state:
- Show diff if possible
- Option to view server version vs draft version
- Let the user choose which to keep

## Dirty Detection

### What makes a form dirty

- Any field value changed from initial value
- Fields added or removed (dynamic fields)
- Files selected but not uploaded
- Server data loaded but not yet modified

### Implementation

```typescript
function isDirty(initialValues: Record<string, any>, currentValues: Record<string, any>): boolean {
  return JSON.stringify(initialValues) !== JSON.stringify(currentValues)
}
```

### Navigation guard

```typescript
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault()
    e.returnValue = 'You have unsaved changes. Leave anyway?'
  }
})
```

## Error Display Patterns

### Error display levels

| Level | Where | What |
|-------|-------|------|
| Field-level | Below each input | Specific error for that field |
| Summary | Top of form | List of all errors with links to fields |
| Toast | Floating notification | Non-field errors (network, server) |
| Inline banner | Within form section | Section-level errors (API error for that group) |

### Field error accessibility

```html
<div>
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" role="alert">
    Enter a valid email address
  </p>
</div>
```

### Focus management on error

1. On submit failure, focus the first field with an error
2. When a field is corrected, remove its error state immediately
3. For async validation errors, keep the error visible until the field changes

## File Upload UX

### Upload states

- idle (no file) → selecting → validating (client-side) → uploading (with progress) → uploaded (success) → uploading again (replacement)
- Error states: size exceeded, type mismatch, upload failed, virus detected

### Component structure

- Drag-and-drop zone with fallback to click
- Progress bar per file
- File list with: name, size, status, remove button
- Thumbnail preview for images (client-side via `URL.createObjectURL`)

### UX patterns

- Accept multiple files with clear limits shown upfront
- Validate size and type before upload starts
- Retry button on failed uploads
- Allow reordering uploaded files
- Show total size / count limit

## Large Form Performance

| Problem | Solution |
|---------|----------|
| 100+ fields on one page | Virtualize with `react-window` or `@tanstack/virtual` |
| Re-renders on every keystroke | Isolate field state — each field is its own component/controller |
| Expensive validation | Debounce + memoize validation functions |
| Lots of conditional fields | `display: none` instead of mount/unmount |
| API calls on every change | AbortController + debounce |

## Framework-Specific Guidance

### React (React Hook Form + Zod/Yup)

- Use React Hook Form for performance (isolated re-renders)
- Schema validation with Zod or Yup
- `useWatch()` for conditional fields instead of `watch()`
- `Controller` for custom components
- `useFieldArray` for dynamic lists

### Vue (VeeValidate + Zod)

- Use `<Field>` and `<Form>` components
- Validation schema with Zod
- `useFieldArray` for dynamic fields
- Watch with `watch` for conditional logic

### Angular (Reactive Forms)

- FormBuilder + FormGroup/FormControl for complex forms
- Custom validators for cross-field validation
- `valueChanges` debounced for conditional fields
- FormArray for dynamic lists
- `updateOn: 'blur'` for performance

### Vanilla JS

- Native Constraint Validation API for basic validation
- Custom implementation for complex patterns
- `form.elements` + `form.reportValidity()` for programmatic control
