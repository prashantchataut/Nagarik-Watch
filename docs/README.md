# Docs index

Everything here is meant to be current. There is no `archive/` any more: a
historical plan sitting beside a live one is indistinguishable from it, and this
repository accumulated ten readiness documents that way. What was worth keeping
was folded into [`READINESS.md`](./READINESS.md); the rest is in git history,
which is where superseded plans belong.

## Start here

| Doc                                                  | Use                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [READINESS.md](./READINESS.md)                       | **Is it ready?** Status, owners, phases, risks. One page.               |
| [launch-runbook.md](./launch-runbook.md)             | Soft to hard launch, step by step.                                      |
| [env-launch-checklist.md](./env-launch-checklist.md) | Environment variables and secrets.                                      |
| [pending/](./pending/)                               | Fixes blocked on a token scope no agent branch has. Apply, then delete. |

## The domain

| Doc                                                | Use                                                      |
| -------------------------------------------------- | -------------------------------------------------------- |
| [architecture.md](./architecture.md)               | System structure, patterns, failure modes.               |
| [content-model.md](./content-model.md)             | Collections and fields, and what each is for.            |
| [editorial-workflow.md](./editorial-workflow.md)   | Pitch to publish, roles, corrections.                    |
| [ALGORITHM_INVENTORY.md](./ALGORITHM_INVENTORY.md) | Capability statuses, adapter prerequisites, cron wiring. |
| [adr/](./adr/)                                     | Decisions, dated, with the reasoning that produced them. |

## Operations

| Doc                                                                                 | Use                                           |
| ----------------------------------------------------------------------------------- | --------------------------------------------- |
| [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)                                      | Vercel Node deploy (the origin, per ADR-004). |
| [CLOUDFLARE.md](./CLOUDFLARE.md) · [CLOUDFLARE-DOMAIN.md](./CLOUDFLARE-DOMAIN.md)   | DNS and CDN.                                  |
| [ADMIN-CLOUDFLARE.md](./ADMIN-CLOUDFLARE.md) · [admin-deploy.md](./admin-deploy.md) | Deploying the Payload CMS app.                |
| [NOTIFICATIONS.md](./NOTIFICATIONS.md)                                              | Web push and digest delivery.                 |
| [calendar-api-setup.md](./calendar-api-setup.md)                                    | BS calendar provider.                         |
| [sports-api-setup.md](./sports-api-setup.md)                                        | Live football and cricket providers.          |
| [security/audit-exceptions.md](./security/audit-exceptions.md)                      | Accepted advisories, each with a reason.      |

## Root

`README.md` (quick start), `PRODUCT.md` (who this is for and what it refuses to
be), `DESIGN.md` (the binding design contract), `AGENTS.md` (conventions for
anyone, human or agent, editing this tree), `MANUAL.md` (operating the newsroom).
