# Nagarik Watch — redesign deliverable (revision 2)

This archive mirrors the Nagarik-Watch repository layout:

```
Nagarik-Watch/
├── apps/
│   └── web/        The complete redesigned reader app (Next.js 16, standalone)
│       ├── src/    app routes, API routes, components, newsroom libraries
│       ├── public/ photos, desk illustrations, OG image, media archive
│       ├── prisma/ schema (Reader / Journalist / Session / Newsletter / Pitch)
│       ├── db/     seeded SQLite (demo journalists ready)
│       └── scripts/ seed + maintenance scripts
├── DESIGN.md       The design contract (updated — letter-spacing forbidden,
│                   Sat+Sun holidays, live-market + accounts contracts)
└── CHANGES.md      Everything that changed in this revision
```

## What's inside apps/web

A self-contained build of the redesigned reader portal: the two-band chrome,
the full edition homepage, all 15 desks, 87 stories, the astronomical
पात्रो, the live बजार dashboard, reader + journalist accounts, साँझ ब्रिफिङ
newsletter, and the Preeti/date tools. Run it standalone (see apps/web/README.md)
or port components into the existing monorepo — file structure and tokens
match DESIGN.md.

## Integrating with the production monorepo

The current repository's `apps/web` is a [locale]-routed app wired to the
Payload CMS. This build is a standalone redesign that keeps the same design
system and all 87 archive stories in `src/lib/news/data.ts`. Two paths:

1. **Adopt directly** — replace `apps/web` with this build and re-point its
   story layer (`src/lib/news/data.ts`) at Payload's REST/GraphQL API; the
   component tree expects the same `Story` shape.
2. **Cherry-pick** — copy `src/components/nagarik/*`, `src/lib/news/*`,
   `prisma/schema.prisma`, `public/photos/` and `DESIGN.md` into the existing
   app and mount the components in your routes.

Either way, keep `DESIGN.md` as the source of truth for visual decisions.
