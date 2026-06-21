---
name: newsroom-cms-architecture-skill
description: Use when designing or changing Nagarik Watch admin/CMS, roles, permissions, editorial workflow, article fields, media library, moderation or audit logging.
---

# Newsroom CMS Architecture

Separate reader accounts from newsroom accounts. Protect all `/admin/*` routes server-side and mark admin metadata `noindex`.

Use the workflow: Idea, Assigned, Draft, Submitted, Fact Check, Copy Edit, SEO Review, Legal/Sensitivity Review, Scheduled, Published, Updated, Archived.

AI suggestions are draft-only. Record audit log entries for AI-assisted summaries, headlines, tags, SEO metadata and moderation decisions.

Media assets require alt text, caption and credit before publish.
