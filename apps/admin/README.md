# @nagarikwatch/admin

Payload CMS is the canonical editorial system for Nagarik Watch. It owns articles, categories, tags, authors, media, editorial roles, drafts, versions, scheduling, corrections, provenance, and publication state.

## Local development

From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @nagarikwatch/admin dev
```

The admin runs on `http://localhost:3001/admin` by default. The first Payload account is bootstrapped as `super_admin`; later accounts require an administrator.

## Production rules

- Set `PAYLOAD_DB_PUSH=false` and apply reviewed migrations.
- Use a 32+ character `PAYLOAD_SECRET`.
- Configure durable object storage before accepting production uploads.
- Share `REVALIDATE_SECRET` with the reader app.
- Keep `CONTENT_SOURCE=payload` on the reader deployment.
- Do not seed publishable journalism. `pnpm --filter @nagarikwatch/admin seed -- --demo-articles` creates unmistakable draft-only fixtures.

## Ownership boundary

Payload owns editorial content. The reader app owns reader accounts, comments, bookmarks, submissions, newsletters, ads, provider health, and privacy-preserving engagement telemetry. The web operations dashboard links editorial routes directly to Payload when Payload is canonical.
