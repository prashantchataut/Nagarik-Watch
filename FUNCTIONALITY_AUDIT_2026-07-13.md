# Nagarik Watch — Functionality Audit, Second Pass

## Current verdict

The repository is no longer a collection of disconnected visual shells. Core reader, editorial and operations contracts now exist and are guarded server-side. It is still not honest to call the entire publication production-ready because external infrastructure and end-to-end runtime verification remain unfinished.

## Functional ownership

| Domain | Canonical owner | Current state |
|---|---|---|
| Articles, categories, tags, authors, media | Payload CMS | Implemented; production migration required |
| Homepage/section/article rendering | Reader Next app | Implemented against Payload with explicit empty/degraded states |
| Reader accounts and sessions | Better Auth + Postgres | Implemented |
| Password reset/change | Better Auth + configured email provider | Implemented; provider credentials required |
| Staff invitations and web-operations roles | Reader operations DB | Implemented with hashed expiring tokens |
| Bookmarks, comments, reading events | Reader operations DB | Implemented with canonical article verification |
| Newsletter | Reader operations DB + email provider | Implemented with double opt-in |
| RSS Source Desk | Ingest package | Implemented as attributed headline/link only |
| Recommendations | DB package | Implemented content/follow model with eligibility and diversity controls |
| Trending/Most Read | Verified reader telemetry | Conservative until sufficient distinct-reader evidence exists |
| Media persistence | Payload local uploads | Not production-safe on Vercel; hard blocker |
| Payments/membership | External provider | Not launch-critical and not represented as complete |

## Security and integrity findings closed

- Public Payload responses no longer expose newsroom-only article fields.
- Author emails are no longer public.
- Disabled CMS users are blocked at authentication.
- Reporters can revise assigned drafts without receiving publishing authority.
- Only publishing roles can schedule or publish.
- Newsroom mutation routes use role checks and an origin boundary.
- Ad event ingestion is rate-limited.
- Provider diagnostics require a newsroom session.
- Reading and engagement APIs reject invented article identities.
- Invite tokens are random, hashed at rest, expire after seven days and require a matching authenticated email.
- Ordinary admins cannot manage super-admin accounts or grant admin/super-admin roles.
- Password resets expire after 30 minutes and revoke sessions.

## Deployment error closure

The reported error is resolved at repository level by synchronizing the lockfile importer and consolidating the CMS path. The repaired lockfile passes `scripts/verify-workspace-lock.mjs` for all workspace manifests. Vercel must build a newly pushed commit; its cached deployment of `b6ae37e` cannot contain the repair.

## Remaining production work

- Add a durable Payload media adapter and its dependency through a connected pnpm install.
- Run the full dependency-aware CI sequence.
- Configure production Postgres, Payload service token, shared revalidation secret, email provider and verified senders.
- Supply verified legal publication identity.
- Build a real editorial inventory; no fabricated news is bundled.
- Validate browser behavior, responsive layouts, accessibility and migrations in staging.
