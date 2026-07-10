# Nagarik Watch recovery delivery

This directory is a **best-effort recovery and critical-fix delivery** created from the uploaded `nagarik-watch-fix.zip`.

## Important limitation

The uploaded ZIP was not a normal project archive:

- all 672 ZIP members were stored at the archive root;
- no member retained an original directory path;
- 27 filenames were duplicated, including `SKILL.md`, `page.tsx`, `route.ts`, `package.json`, and `layout.tsx`;
- normal extraction would overwrite 190 duplicate entries;
- TypeScript build metadata references 68 web files and 2 Payload admin files that are not present anywhere in the ZIP.

Every uploaded member has been preserved in this recovered tree and recorded in `RECOVERY_INVENTORY.json`. Paths were reconstructed from TypeScript build metadata, imports, file contents, package metadata, and archive order. Where the source was genuinely absent, it is listed in `RECOVERY_STATUS.json`; it was not fabricated.

Because core public route files such as `apps/web/app/[locale]/layout.tsx`, the homepage, category pages, article pages, reader auth pages, and journalist pages are absent, this recovered directory **cannot be certified as the complete original project or as production-build green**.

## Critical fixes included

- Better Auth initialization no longer permanently caches a rejected promise.
- Boot-account seeding is detached from auth initialization and failure-isolated.
- Role assignment failures are caught and logged without taking down every auth endpoint.
- The missing `app/api/auth/[...all]/route.ts` handler was restored.
- Auth route initialization failures return a controlled `503` JSON response instead of an opaque unhandled `500`.
- Duplicate `NEXT_PUBLIC_SITE_URL` was removed from `.env`.
- Known client-side date/time hydration mismatches were fixed in the masthead, Nepali calendar, utility date converter, wire browser, comments, and saved stories.
- Public, admin, and global route error boundaries were added.
- Mobile navigation now has a real keyboard focus trap, valid `aria-controls`, Escape handling, and focus restoration.
- Launch readiness now checks minimum content configuration, newsroom address, and auth-secret length.

See `AUDIT_AND_FIX_REPORT.md` and `VERIFICATION_LOG.md` for the full findings and evidence.

## What is needed for a complete production pass

Re-upload the project with directories preserved. From the parent directory of the repository:

```bash
zip -r nagarik-watch-intact.zip nagarik-watch \
  -x '*/node_modules/*' '*/.next/*' '*/.turbo/*' '*/dist/*' '*/coverage/*' '.git/*'
```

Before uploading, confirm this shows paths such as `nagarik-watch/apps/web/app/...` rather than hundreds of files at the ZIP root:

```bash
unzip -l nagarik-watch-intact.zip | head -50
```
