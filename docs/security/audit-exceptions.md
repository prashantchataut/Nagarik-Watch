# Dependency audit exceptions

CI runs `pnpm audit --prod --audit-level high` (`.github/workflows/ci.yml`). The
advisories listed here are the only ones the gate ignores, via
`pnpm.auditConfig.ignoreGhsas` in the root `package.json`. Everything else must
be fixed, not added here.

An entry belongs on this list only if **both** are true: no fixed version exists
(or the only fix is a major upgrade of a dependency we do not control), and the
vulnerable code is not reachable from a request path in production.

Re-check at every dependency sweep. If a patched release appears, take it and
delete the entry.

## GHSA-5p2g-fcmc-qvqq / GHSA-w3rx-r6r6-pgpr — `image-size`

- **Path:** `apps/admin > payload > image-size`
- **Severity:** high (denial of service in the JXL, HEIF and ICNS parsers)
- **No fix available.** Both advisories report `patched_versions: <0.0.0`;
  upstream has not shipped a release, so no `payload` upgrade resolves them.
- **Why it is accepted:** `image-size` runs inside the Payload admin when an
  editor uploads an image. That surface is behind newsroom authentication
  (`apps/admin` is not public), uploads are restricted to signed-in staff, and
  the failure mode is a stalled upload request in the CMS, not data exposure.
  The public site never calls it: reader-facing images are served from the media
  store and resized by `next/image`.
- **Review:** revisit when Payload bumps its `image-size` range.

## GHSA-ggr8-5vv4-36mx — `deepmerge-ts`

- **Path:** `apps/admin > @payloadcms/db-postgres > drizzle-orm > prisma >
@prisma/config > deepmerge-ts`
- **Severity:** high (stack exhaustion when merging self-referencing objects)
- **No usable fix.** The advisory is patched in `deepmerge-ts@8`, but
  `@prisma/config` — including the current release — still depends on `7.1.5`.
  Forcing 8 through an override would put Prisma's config loader on an API it
  was not tested against.
- **Why it is accepted:** the vulnerable call is Prisma's _config file_ merge,
  which runs in `prisma generate` at build time on config we author. It is not
  in any request path, and it never merges attacker-supplied objects. Prisma
  itself is a devDependency (`apps/web`), used by `prisma generate` and the seed
  scripts; the deployed bundle does not contain it.
- **Review:** drop this entry once `@prisma/config` moves to `deepmerge-ts@^8`.
