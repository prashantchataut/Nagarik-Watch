# Nagarik Watch — redesign deliverable (revision 3)

This archive mirrors the Nagarik-Watch repository layout:

```
Nagarik-Watch/
├── apps/
│   └── web/        The complete full-stack portal (Next.js 16, standalone)
│       ├── src/    app routes, 20+ API routes, components, newsroom libraries
│       ├── public/ photos, desk illustrations, OG image, media archive
│       ├── prisma/ schema (Reader/Journalist/Session/Newsletter/Pitch/Article/
│       │           Comment/Bookmark/Poll/PollVote/Contact/Breaking/Pageview)
│       ├── db/     seeded SQLite (demo editor, reporters, reader, poll,
│       │           breaking banner, published CMS article, pageviews)
│       └── scripts/ seed + maintenance scripts
├── DESIGN.md       The design contract (incl. revision 3 newsroom loop)
└── CHANGES.md      Everything that changed (revisions 1–3)
```

## What's inside apps/web

A self-contained full-stack build of the portal: the two-band chrome, the
edition homepage (breaking banner, trending rail, live poll), all 15 desks,
87 archive stories + the live CMS layer, article comments, the astronomical
पात्रो, the live बजार dashboard, reader + journalist accounts, the full
newsroom pipeline (pitch → draft → review → publish → analytics),
साँझ ब्रिफिङ newsletter with CSV export, and the Preeti/date tools.

## Demo accounts (password: demo1234)

- Editor (सम्पादक): `sushila@nagarikwatch.com`
- Reporters: `manisha@nagarikwatch.com`, `rajesh@nagarikwatch.com`
- Reader: `demo.reader@nagarikwatch.com`

## Integrating with the production monorepo

The current repository's `apps/web` is a [locale]-routed app wired to the
Payload CMS. This build is a standalone redesign that keeps the same design
system and all 87 archive stories in `src/lib/news/data.ts`. Two paths:

1. **Adopt directly** — replace `apps/web` with this build and re-point its
   story layer (`src/lib/news/data.ts` + the CMS article store) at Payload's
   REST/GraphQL API; the component tree expects the same `Story` shape.
2. **Cherry-pick** — copy `src/components/nagarik/*`, `src/lib/news/*`,
   `src/app/api/*`, `prisma/schema.prisma`, `public/photos/` and
   `DESIGN.md` into the existing app and mount the components in your
   routes.

Either way, keep `DESIGN.md` as the source of truth for visual decisions.
