# Nagarik Watch Design System and Editorial Product Contract

**Status:** implementation contract  
**Updated:** 2026-08-28  
**Primary register:** Devanagari-first civic newsroom  
**Secondary register:** calm newsroom operations product  
**Brand direction:** Civic Crimson on warm paper

This file is the source of truth for Nagarik Watch UI/UX. It replaces the earlier palette-comparison document and the visual habits that made the product feel like a generic portal dashboard.

The product is not a pile of cards, utility bars, or navigation rows. It is a publication. Every public page should feel like a different page from the same newspaper; every internal page should feel like a newsroom workstation built for a specific job.

---

## 1. Product thesis

Nagarik Watch should feel:

- **editorial, not templated** — hierarchy comes from headline scale, photography, rules, whitespace, and sequence;
- **Nepali-first, not translated-first** — Devanagari is given enough size, line-height, and measure to look intentional;
- **dense in information, light in chrome** — readers can see many stories without seeing many boxes;
- **civic, not alarmist** — crimson is an identity and navigation color, not wallpaper;
- **service-oriented** — calendar, market, results, live scores, search, saved reading, and conversion tools are real products with honest data states;
- **operationally truthful** — the UI never fabricates content, dates, rates, scores, holidays, or source freshness to avoid an empty state;
- **CMS-led** — published editorial content belongs to the canonical content system, not page components.

### The anti-goals

Do not ship:

- four or five horizontal bars before the first story;
- tiny 14–16px Devanagari body copy;
- every section as an identical bordered card grid;
- left-aligned hero copy with no visual hierarchy simply because it is easiest to code;
- generic gradients, glass panels, glow, ornamental pills, or “AI dashboard” styling;
- fake live numbers, sample news presented as current news, or calendar fallback values that look authoritative;
- a homepage that disappears because one optional feed is unavailable;
- duplicated navigation within the same visual level;
- duplicated content-authoring authorities in production.

---

## 2. Competitive grammar, not competitive cloning

The redesign borrows information-architecture lessons from mature Nepali news products without copying their brand systems.

### Useful patterns to retain

- a visible distinction between **rapid updates** and **edited section packages**;
- a dominant first story with meaningful photography;
- section rhythm that changes by editorial role rather than repeating one card component;
- utilities such as the calendar treated as dedicated reader services;
- publication identity, contact routes, and standards kept easy to find;
- special packages, video, opinion, and data work allowed to have their own editorial zones.

### What Nagarik Watch should do differently

- fewer chrome bands;
- larger Devanagari type;
- warmer reading surface;
- less tabloid use of red;
- more whitespace around primary decisions;
- explicit provenance and failure states for service data;
- a stronger separation between public editorial surfaces and internal newsroom operations.

---

## 3. Visual foundation

### 3.1 Color

The public product uses **Civic Crimson** as a restrained committed accent.

| Token | Value / intent | Use |
| --- | --- | --- |
| `brand` | `oklch(0.55 0.18 25)` | desk rail, links, kickers, active states |
| `brand-strong` | darker civic crimson | hover, emphasis, urgent labels |
| `brand-tint` | very light crimson tint | selected/active background only |
| `paper` | warm paper around `#F7F3ED` | principal reading field |
| `chrome` | warm off-white around `#F8F5F0` | masthead and quiet chrome |
| `surface` | warm neutral around `#F4F1EC` | page surface |
| `surface-raised` | warm near-paper around `#FBF9F6` | rare raised controls, not default cards |
| `ink` | warm near-black | primary copy |
| `ink-soft` | warm charcoal | decks and secondary copy |
| `mute` | low-contrast warm gray | timestamps and captions |
| `rule` | warm hairline gray | structural dividers |
| `breaking` | stronger crimson | actual breaking-news status only |

Rules:

1. Crimson carries identity; it does not fill entire content modules by default.
2. Hairlines and paper changes are preferred to boxes.
3. New light-theme surfaces must not introduce pure white as a default page background.
4. Green/red market states are semantic, not brand decoration.
5. Dark mode is a reader option, not the default identity.

### 3.2 Typography

- **Display / Nepali headline:** Mukta.
- **Body / UI Devanagari:** Noto Sans Devanagari.
- **Latin UI:** the existing sans stack, tuned to align visually with Devanagari.
- **Data / numbers:** tabular numerals where comparison matters.

Recommended scale:

| Role | Size |
| --- | --- |
| Homepage lead | `clamp(2.35rem, 6vw, 4.5rem)` |
| Desk / institutional H1 | `clamp(2.35rem, 6vw, 4.25rem)` |
| Article H1 | `clamp(2.5rem, 6.5vw, 5rem)` subject to length |
| Section H2 | 1.75–2.4rem |
| Story card title | 1.2–1.65rem according to role |
| Article body | 1.08–1.18rem minimum responsive target |
| General Nepali body | 1.05–1.2rem |
| Meta | 0.8–0.9rem; never the main reading layer |

Devanagari rules:

- use generous line-height, generally 1.45–1.7 for running copy;
- do not use aggressive negative letter spacing;
- do not uppercase or over-track Nepali text;
- keep article measure around **42.5rem / 680px**;
- center major display headlines when the page is a destination, not a transactional tool.

### 3.3 Layout and rhythm

- principal public page width: existing `max-w-page` token;
- article reading width: ~680px;
- editorial section spacing: usually 2–3rem, larger at major transitions;
- structural rules are usually 1px; important edition breaks may use 2px ink rules;
- avoid nested padding boxes; let page gutters and typography create the frame;
- image aspect ratio should come from editorial role, not one universal thumbnail shape.

---

## 4. Public chrome: exactly two primary bands

### Band 1 — paper masthead

Desktop includes:

- Nagarik Watch logo at the left;
- Kathmandu/Nepal civil date;
- compact live reference facts such as weather/NEPSE when verified;
- Unicode, saved reading, account, search, theme, locale controls as quiet utilities;
- **पात्रो** as the single solid service CTA.

Mobile includes:

- menu trigger;
- logo;
- search;
- no desktop utility clutter.

### Band 2 — sticky Civic Crimson desk rail

- one horizontal row of editorial desks;
- horizontally scrollable on narrow screens;
- active state is visible without another tab row;
- overflow menu is permitted for secondary desks;
- Patro can appear at the rail edge on mobile where the desktop CTA is absent.

### Prohibited masthead patterns

- topic chips in a third row;
- leaderboard ad inside the masthead stack;
- weather, date, stock, language, social links, login, and breaking news each receiving their own strip;
- a second sticky nav underneath the first sticky nav;
- hamburger plus duplicated full desktop menu at the same breakpoint.

The first editorial content should arrive quickly. Chrome exists to orient, not to delay reading.

---

## 5. Homepage edition

The homepage is an **edition**, not a component gallery.

### Sequence

1. verified breaking ticker only when there is breaking material;
2. centered lead package;
3. lead photograph as dominant visual anchor;
4. two supporting stories;
5. commercial billboard after the editorial opening, never before it;
6. editorial spotlight / special package;
7. core desks with a latest rail where useful;
8. business/sports and other role-specific desks;
9. provider-backed live-sport band when verified scores exist;
10. public-service desk: today in BS + next verified event, NEPSE when available, and NRB USD/NPR when available;
11. mid-page labeled ad;
12. province hub;
13. entertainment/world feature pair;
14. active poll if published;
15. opinion/literature voices;
16. secondary desks;
17. closing desk such as history/photo-of-day when sourced.

### Lead package

- centered kicker, headline, deck, byline/date;
- headline should be the largest type on the site home;
- copy uses a controlled maximum measure;
- hero image sits below the lead copy and can span the main content width;
- lead image receives priority loading;
- support stories are subordinate in both scale and position.

### Section role system

Do not force every desk into one card grid.

- **Politics / world / health / diaspora:** news desk; text hierarchy and a clear lead.
- **Society / technology / education:** compact desk; faster scan, more rows, smaller images.
- **Business:** split desk; lead reporting plus market/service context where verified.
- **Sports / entertainment / photo:** image-led desk.
- **Opinion / interview:** voices; author and thesis matter more than thumbnail repetition.
- **Literature / long-form:** slower split composition with more whitespace.

### Homepage empty/failure behavior

- retry a transient canonical source error once;
- never replace a failed source with fabricated stories;
- if no trustworthy edition can be read, render an explicit newsroom service notice;
- optional modules may disappear independently without blanking the entire edition.

---

## 6. Article page

The article is the most important reading surface.

### Header

- centered category/kicker;
- large centered headline;
- centered deck and provenance where applicable;
- byline, publish/update dates, correction status, and trust signals are clear but quiet;
- save/share tools are available without becoming another large toolbar.

### Reading column

- max ~680px;
- body 18–19px equivalent with generous Devanagari leading;
- paragraphs receive visible vertical rhythm;
- inline media can break wider than the text where the story warrants it;
- captions remain visually attached to media;
- headings clearly interrupt the flow;
- quoted material, data, embeds, and live modules must have distinguishable semantics.

### Article end

- correction/update information remains explicit;
- next-story navigation must look like editorial links, not ecommerce cards;
- related material should not overwhelm the conclusion;
- ad slots are labeled and cannot cause layout shift.

---

## 7. Desk, category, topic, tag, province, author and index pages

All content-index destinations use the shared destination grammar.

### Destination header

- centered kicker/rules;
- 2.35–4.25rem H1;
- concise centered deck;
- no boxed title card;
- no duplicated breadcrumb-like label rows unless needed for orientation.

### Editorial body

- one clear lead when inventory supports it;
- supporting material beneath in role-appropriate rows/grids;
- latest/most-read rails are optional enhancements, not obligatory sidebars;
- empty desks use a composed editorial note plus real evergreen/latest material;
- no fake inventory is generated to make the page look full.

This family includes:

- category routes;
- latest;
- most-read;
- trending;
- editor picks / exclusive / wire where available;
- topic and tag routes;
- province and district routes;
- author/columns;
- fact-check and specialist reporting indexes;
- search-adjacent and archive indexes;
- RSS and sitemap destinations.

---

## 8. Institutional, legal and standards pages

About, ethics, privacy, cookies, editorial policy, fact-check policy, corrections policy, recommendation policy, terms, and related routes use a publication-document grammar.

### Header

- centered publication kicker;
- large, calm H1;
- short lead;
- no SaaS hero card.

### Body

- narrow readable measure;
- sections separated by whitespace and rules rather than floating cards;
- lists and definitions remain semantic;
- dates/revisions are explicit where policy governance requires them;
- important contact/escalation routes remain links, not decorative callouts.

---

## 9. Contact, advertising and team

### Contact

- centered publication header;
- tips and corrections presented as two editorial lanes separated by rules;
- contact form is the primary interaction, not buried under cards;
- newsroom desk contacts form a quiet sticky rail on desktop;
- response-time copy is factual and modest.

### Advertising

- treat it as a media-kit/service page, not a generic lead-gen landing page;
- centered institutional header;
- sales/contact facts in a restrained rule-based band;
- ad principles displayed as flat editorial statements;
- placement inventory comes from the real ad-placement model;
- never invent reach, audience, or pricing numbers.

### Team

- active authors come from the content source;
- newsroom people are editorial rows with monogram/photo and role;
- contributors may be more compact;
- standards links are flat institutional links, not a three-card marketing block.

---

## 10. Search, saved reading, archive and reader corner

### Search

- large search field as the page's primary control;
- keyboard focus must be obvious;
- result filters should not create chip clutter;
- no-result state offers useful next actions and real destinations;
- history/suggestions are visibly distinct from results.

### Saved

- device-only vs account-synced behavior must be stated truthfully;
- empty state explains how to save a story;
- saved stories use the same editorial list grammar as index pages.

### Archive

- date navigation should feel like archive navigation, not a calendar clone;
- dates are timezone-correct for Nepal publication dates;
- empty days remain honest.

### Reader corner / submissions

- distinguish participation from editorial endorsement;
- forms use clear field labels, status, success, and failure states;
- do not promise publication.

---

## 11. Utility hub

Utilities are a reader-service product family, not a permanent sidebar.

### Shell

- shared centered destination header;
- horizontal scrollable tool rail under the header;
- active tool indicated by a Civic Crimson bottom rule;
- workspace below with no desktop sidebar consuming reading width;
- directory view uses indexed editorial rows in two columns on larger screens rather than large cards.

### Utility standards

Every tool must have:

- a clear single primary task;
- accessible labels and error messages;
- useful keyboard behavior;
- local/offline calculation where the result can be deterministic;
- source/time labels for live external data;
- a truthful unavailable state;
- no silent “best guess” fallbacks.

This family includes date converter, Preeti/Unicode, currency, calendar, calculators and other registered tools.

---

## 12. Patro / Bikram Sambat calendar

The calendar is a first-class reader service.

### Information architecture

On the apex site:

1. today block;
2. calendar workspace;
3. quick tool links;
4. upcoming festivals/holidays and market/forex reference rail;
5. latest newsroom context below when available.

The embedded Patro page must not repeat a second Patro tool nav when the site masthead and quick-tool workspace already provide navigation. The standalone calendar host may keep its own product header/nav because it does not inherit the main site chrome.

### Today and timezone

- resolve “today” from `Asia/Kathmandu` civil time;
- server and client representations must agree across UTC boundaries;
- AD labels shown for BS dates must also format in `Asia/Kathmandu`;
- do not derive a Nepal weekday from raw UTC components without normalization.

### Supported conversion range

- only the supported `nepali-datetime` BS range is valid;
- currently exposed contract: **BS 2000–2099**;
- previous/next controls disable at the boundary;
- out-of-range values must fail, not approximate.

### Absolute data rules

Never:

- return `30` because a BS month-length lookup failed;
- return the Gregorian year/month/day as if it were a Bikram Sambat date;
- accept day 32 simply because some BS months can be 32 days;
- repeat one year's festival schedule into another year;
- present an unsourced festival or holiday as verified.

### Festival / holiday publishing

- the reader calendar is provider-driven; operators should not hand-author a year of holidays in JSX or raw JSON;
- default provider adapter is BizzPatro when `CALENDAR_API_KEY` is configured; a normalized JSON provider may be selected with `CALENDAR_PROVIDER=json` and `CALENDAR_API_URL`;
- a scheduled `/api/cron/calendar-sync` job refreshes the current BS year and persists a validated last-known-good snapshot;
- each snapshot is bound to one BS year and keeps a meaningful provider/source label;
- every provider month/day is validated through the BS conversion library before publication;
- duplicate events are rejected/deduplicated before the snapshot becomes public;
- upstream provider failure preserves the last validated snapshot and exposes staleness instead of inventing replacements;
- the Ministry of Home Affairs annual holiday notice is the authority operators should use to audit provider holiday coverage when the ministry publishes the schedule as a notice/PDF rather than an application API;
- public UI displays a clear “verified schedule not loaded” state when no validated snapshot exists.

---

## 13. Market, NEPSE, forex, gold/silver and live scores

These are **source-driven services**.

- source name and last update must be shown where practical;
- external provider health is observable in admin;
- football supports `football-data.org` or API-Football; cricket supports CricketData or Sportmonks Cricket through provider adapters;
- the homepage live-sport band is independent of whether a sports article exists in the CMS and renders only when a provider/manual verified fallback returns real match data;
- live matches rank ahead of fixtures/results; a provider outage collapses the homepage band rather than showing fake scores;
- manual override is permitted only as a sourced newsroom fallback;
- manual data must pass shape validation;
- no stale override is automatically re-labeled as current;
- unavailable is preferable to fabricated;
- numeric tables use tabular figures;
- rise/fall uses text/symbol plus color so meaning does not depend on color alone.

---

## 14. Rashifal

Rashifal is editorial content with a date contract, not random filler.

- daily record must be tied to the Kathmandu local date;
- exactly 12 unique signs are required;
- Nepali forecast text is required; English is optional where supported;
- stale or incomplete data does not masquerade as today's edition;
- page header follows destination grammar; signs may use a denser service layout because they are parallel records.

---

## 15. Photos, video, data stories, e-paper and live coverage

These surfaces may be visually stronger than normal index pages, but still inherit the brand.

### Photos / video

- media is dominant;
- captions, credits and source remain visible;
- autoplay is avoided unless user-initiated and accessible;
- poster dimensions are reserved to prevent layout shift.

### Data stories

- charts and interactives explain the data source;
- fallback text/table exists for inaccessible or failed graphics;
- visual decoration never obscures axes or labels.

### E-paper

- edition date and availability are primary;
- empty editions remain honest;
- page thumbnails reserve dimensions.

### Live coverage / disaster alerts / elections / results

- urgency is communicated with semantic status and update time;
- breaking crimson is used only for current urgent state;
- updates are timestamped;
- stale state is visible;
- emergency information is never buried under promotional modules.

---

## 16. Authentication, profile and membership

### Reader auth

- calm split or focused form surface;
- brand illustration is secondary to the form;
- labels remain persistent;
- password requirements and failures are specific;
- social auth buttons represent real configured providers only;
- locale and return-to-news controls remain accessible.

### Staff / journalist auth

- visually distinct from public reader auth;
- names the newsroom context clearly;
- MFA/setup states are first-class, not afterthought modals;
- no public navigation clutter while authenticating.

### Membership

When enabled:

- editorial-independence language is prominent;
- plans are compared as editorial rows, not ecommerce pricing cards;
- activation/payment mode is explicit;
- contribution does not imply editorial influence.

When disabled:

- render a composed publication holding page;
- do not show a lonely bordered “coming soon” card;
- keep newsletter/about routes available.

---

## 17. Journalist workspace

Journalist pages are a task product, not public editorial pages.

- dashboard prioritizes assignment/review status and next action;
- article editor uses a dominant writing column with supporting metadata panels;
- feedback and assignments are chronological and scannable;
- tools share form and validation primitives with the newsroom admin;
- no public-site masthead density is imported into the workstation.

---

## 18. Admin architecture

There are two internal responsibilities and they must remain visibly and technically distinct.

### 18.1 Canonical Payload CMS

Payload owns editorial entities such as articles, media, categories, tags and authors. `CONTENT_SOURCE` defaults to `payload`; omitting the variable must not silently choose the shadow store.

Design intent:

- warm-paper neutral shell rather than default pure-white SaaS chrome;
- larger collection/document titles;
- readable field spacing;
- calmer tables;
- obvious primary actions;
- no decorative gradients/glass.

### 18.2 Nagarik Watch operations admin

The custom `/admin` workstation owns operational workflows such as:

- dashboard / newsroom health;
- live operations and manual verified service overrides;
- comments/contact/submissions;
- polling/newsletter workflows;
- ad operations;
- experiments/analytics/launch checks;
- roles/settings where applicable.

It must not pretend to be a second canonical article CMS. Where Payload is canonical, editorial entity links route to Payload and dashboard publication counts/recent stories are read from Payload rather than the shadow store.

### Operations shell

- warm neutral application surface;
- ~17rem desktop sidebar;
- strong current-location indicator using inset Civic Crimson rather than filled pills;
- 4.25rem topbar;
- content max width around 94rem;
- workflow strip is flat and task-oriented;
- mobile drawer has focus management and escape behavior.

### Admin page hierarchy

1. shell page title / location;
2. small page subtitle/eyebrow only when useful;
3. primary action;
4. data/task content;
5. health/help context.

Avoid admin pages where every statistic and action is a raised card. Tables, lists, and rule-separated work queues are preferred.

---

## 19. Content authority and “no hardcoded news” rule

### Production contract

- Payload is the default and canonical editorial mode; explicit `CONTENT_SOURCE=json` exists only as a local/emergency compatibility path;
- a Payload-declared deployment must fail closed if its CMS origin/token requirements are not configured;
- articles, media, authors, categories and volatile topics/tags are editable in Payload;
- page JSX must not contain current-news arrays presented as production inventory;
- source-code/runtime article fixtures are not shipped and no development command may auto-populate published journalism;
- the Payload seed may create stable categories and shared desk identities only; it never creates articles, and it does not pre-seed time-sensitive topics;
- specialty hubs may not pad a sparse desk by relabeling unrelated recent stories as matching content; any broader fallback stream must be visibly separate;
- service overrides are operational records with source and validation, not hardcoded reader UI values.

### Allowed constants

Constants are appropriate for stable product structure, for example:

- navigation labels;
- BS month names;
- supported utility routes;
- semantic role lists;
- ad placement identifiers;
- zodiac identifiers;
- validation ranges tied to a library contract.

Stable product constants are not the same thing as publishing mutable news or live facts in source code.

---

## 20. Advertising

- every commercial slot is labeled as advertising;
- placement dimensions reserve space to protect CLS;
- masthead must not grow extra bands for ads;
- no ad may visually mimic a story card or newsroom notice;
- an unavailable ad collapses according to placement rules without leaving misleading copy;
- ad inventory and public advertising page use the same placement model.

---

## 21. Accessibility contract

Minimum requirements:

- semantic heading order;
- skip link reaches the real main landmark;
- interactive elements are keyboard reachable;
- focus visible against warm paper and crimson surfaces;
- menus/dialogs/drawers return or manage focus predictably;
- horizontal rails remain scrollable with keyboard/touch where relevant;
- images have meaningful alt text when editorial and empty alt when purely duplicative;
- form fields have persistent labels;
- validation is announced and not color-only;
- touch targets are generally at least ~44px where practical;
- zoom/reflow works at 200% and narrow phone widths;
- reduced-motion preferences disable nonessential movement;
- live service status does not spam assistive technology.

---

## 22. Performance contract

Targets:

- LCP <= 2.5s at the 75th percentile;
- INP <= 200ms;
- CLS <= 0.1.

Implementation rules:

- lead image is priority-loaded with correct responsive `sizes`;
- non-lead media is lazy by default;
- image dimensions/aspect ratio are reserved;
- ad dimensions are reserved;
- server-render meaningful editorial HTML;
- do not hydrate static decoration;
- optional live modules should not block the main edition;
- fonts are limited to the approved families/weights;
- avoid layout-measuring JavaScript for effects CSS can express;
- no carousels that require heavy client libraries for simple horizontal browsing.

---

## 23. Motion and interaction

Motion should explain state, not decorate the page.

Allowed:

- small hover color transitions;
- slight editorial image scale on pointer hover when reduced-motion permits;
- menu/drawer transitions;
- progress/status changes tied to actual operations.

Avoid:

- bouncing CTAs;
- auto-moving story carousels;
- parallax;
- gradient shimmer on content that already exists;
- scroll-jacking;
- large spring animations on reading pages.

---

## 24. Responsive behavior

### Phone

- single masthead row;
- swipeable sticky crimson desk rail;
- five-item bottom navigation where enabled;
- one-column article/index flow;
- sidebars move below the primary task or disappear when redundant;
- calendar cells remain legible without horizontal page overflow.

### Tablet

- two-column editorial support grids where hierarchy remains clear;
- avoid forcing desktop sidebars too early.

### Desktop

- use breadth for editorial contrast, not merely more cards;
- latest/service rails are reserved for pages where they materially improve scanning;
- sticky rails do not compete with the main masthead.

---

## 25. Route-family implementation map

| Route family | Shared design owner | Primary pattern |
| --- | --- | --- |
| `/` | `HomePage`, `PortalFeed`, `HomeSportsLive`, `HomeServiceDesk`, home blocks | edition + verified service context |
| `/:category/:slug` | article route/components | centered article |
| `/:category` | `HubIndexHeader`, `CategoryDesk` | desk destination |
| `/latest`, `/most-read`, `/trending` | `HubIndexHeader`, index components | ranked/index newsroom |
| `/topic/:slug`, `/tag/:slug` | `HubIndexHeader` | topical index |
| `/province`, `/province/:slug`, `/district/:slug` | hub header + geo components | geographic index |
| `/author/:slug`, `/columns`, `/team` | hub header + people grammar | byline/people |
| `/about`, `/help`, `/ethics`, `/privacy`, policies, terms | `InfoPageHeader`, info sections | publication document/service help |
| `/contact` | `InfoPageHeader`, contact form | service/document |
| `/advertise` | `InfoPageHeader`, ad model | media kit |
| `/utilities`, `/utilities/:tool` | `UtilityPageShell` | reader tool |
| `/patro` | `PatroShell`, `PatroDesk`, `NepaliCalendar` | calendar service |
| `/market`, `/nepse`, `/rashifal`, `/live-scores` | destination header + source modules | live reader service |
| `/search`, `/saved`, `/archive` | dedicated view + destination grammar | retrieval |
| `/photos`, `/video`, `/data-stories`, `/epaper` | media-specific components | visual edition |
| `/live/:slug`, disaster/election/results | live/status components | urgent coverage |
| `/auth/*`, `/login`, `/register`, `/profile` | auth shells | focused reader task |
| `/membership` | publication header + plan rows | reader support |
| `/journalist/*` | journalist workspace | newsroom task |
| `/admin/*` | `AdminShell`, admin primitives | operations workstation |
| Payload admin | Payload theme globals | canonical CMS |
| `__not-found` | public shell + recovery links | recovery |

A new route should join one of these families before inventing a new page shell.

---

## 26. State matrix

Every route/component must account for the states that apply to it.

| State | Required behavior |
| --- | --- |
| loading | preserve layout; do not flash fake data |
| empty | explain what is absent and offer a real next step |
| error | specific, recoverable where possible |
| offline | distinguish from “no data” |
| stale | show timestamp/source when freshness matters |
| unauthorized | explain access boundary without exposing protected data |
| disabled feature | composed holding page, not a broken link |
| invalid input | field-level message + preserved user input |
| success | concise confirmation tied to the action |

---

## 27. UI bans

These are regressions unless a documented exception is approved.

- generic gradient hero backgrounds;
- glassmorphism;
- glow shadows;
- rounded-everything;
- pill labels for every metadata item;
- card-within-card-within-card;
- dashboard KPI tiles on reader pages;
- all-caps tracked Nepali labels;
- fake quotes/testimonials;
- unsourced statistics;
- pure decorative icon grids;
- equal visual weight for every story;
- more than two primary public chrome bands;
- a sidebar on every desktop page;
- a CTA repeated in header, rail, hero and sticky footer simultaneously;
- skeletons that remain visible instead of real error/empty handling;
- placeholder content in production;
- silent data coercion that converts failure into a plausible-looking value.

---

## 28. Review checklist

Before merging a UI change, answer yes to the relevant questions.

### Editorial hierarchy

- Is the most important story/action visually obvious?
- Does this page look like a publication rather than a card library?
- Is Devanagari large enough and given enough line-height?
- Is whitespace doing structural work?

### Chrome

- Did this add a new band? If yes, is it truly necessary?
- Is navigation duplicated elsewhere on the same page?
- Does the content start early enough?

### Data truth

- Is mutable editorial/service data coming from its real source?
- Does failure remain failure rather than becoming a fabricated fallback?
- Are date/time calculations explicitly tied to Kathmandu when they represent Nepal civil time?
- Is source/freshness visible where readers might mistake stale data for live data?

### Accessibility

- Can the page be completed with keyboard alone?
- Is focus visible?
- Do labels and landmarks make sense out of context?
- Does 200% zoom preserve task order?

### Performance

- Is the largest above-fold image prioritized and correctly sized?
- Are media/ad dimensions reserved?
- Did this introduce avoidable client JavaScript?

### Responsive

- Does the phone layout preserve hierarchy instead of simply stacking desktop cards?
- Does the primary task come before side content in DOM order?
- Are horizontal rails intentionally scrollable rather than page overflow bugs?

---

## 29. Decision record

### 2026-08-28 — newsroom reset

- Civic Crimson retained as the single public accent.
- Public chrome reduced to paper masthead + sticky crimson desk rail.
- Homepage lead centered and enlarged; lead photo made dominant.
- Shared destination and institutional headers standardized.
- Article measure standardized at ~680px.
- Utility desktop sidebar removed in favor of a horizontal tool rail.
- Embedded Patro duplicate nav removed.
- Calendar calculations tied to `Asia/Kathmandu` and unsupported conversions made explicit failures.
- Calendar publication validation tightened to actual BS month lengths and duplicate rejection.
- Custom operations admin and Payload CMS visually aligned while preserving separate responsibilities.
- Payload is now the default editorial authority; missing Payload configuration fails closed instead of implicitly selecting JSON.
- Runtime/source-code article fixtures and the 87-story checked-in edition file were removed; Payload development seeding is taxonomy/desk-only.
- Volatile topic/tag seeds were removed so topics are created in the CMS.
- Sparse specialty hubs keep unrelated newsroom stories in a separately labeled stream rather than misclassifying them.
- Calendar holidays/events now support automatic provider sync with a validated last-known-good snapshot; manual year JSON is no longer the normal workflow.
- Live football/cricket adapters use sport-specific provider schemas and the homepage renders a compact live-score band only when verified data is available.
- Operations-admin publication metrics read the canonical content authority.
- The homepage service desk accepts a configured licensed NEPSE JSON adapter before the public-page fallback, and bullion supports the same normalized provider pattern; absent feeds stay unavailable rather than inventing values.

This contract is intentionally stricter than a mood board. If an implementation conflicts with it, the implementation should be changed or the decision should be recorded here before the design drifts.
