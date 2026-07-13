# Nagarik Watch remediation session / नागरिक वाच सुधार सत्र

## Critical path / मुख्य प्राथमिकता

- [x] Restore missing `packages/db` source and `pnpm-lock.yaml` from the nested recovery archive.
- [x] Remove duplicate `apps/cms`; keep `apps/admin` as the canonical Payload CMS.
- [x] Remove secret-bearing `.env` and local env files from the deliverable.
- [ ] Establish baseline: install, typecheck, lint, tests, static audits, builds.
- [ ] Fix Better Auth local persistence, schema migration, boot-account seeding, and error visibility.
- [ ] Enforce Payload as production content source and remove silent JSON-store production writes.
- [ ] Restore the full public shell, dynamic navigation, theme initialization, and locale stability.
- [ ] Audit every custom admin route and remove/hide duplicate authoring surfaces.
- [ ] Unify live-data providers and require source/timestamp/error/manual-fallback states.
- [ ] Verify reader, journalist, submissions, paywall, bookmarks, polls, newsletter, SEO, and trust pages.
- [ ] Produce `FINAL_AUDIT.md` and `CONTINUATION_PROMPT.md` with verified status.
