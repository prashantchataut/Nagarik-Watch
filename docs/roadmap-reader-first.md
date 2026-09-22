# Reader-first: a second set of suggestions

Written 2026-09-22, after the accessibility and design-system pass.

`roadmap-next.md` is about the platform: the Payload cutover, observability, rate
limiting, editorial workflow. Those are the right things to fix and none of them change
what a reader in Nepal experiences next week. This list is the other axis — what the
person holding the phone actually gets — plus the design-system work that the contrast
and token gates now make possible.

Every item here was measured or read out of the tree on 2026-09-22, and each one says
how, so you can re-check it rather than take my word. Where I expected a gap and found
working code instead, I have said so rather than quietly dropping the item — knowing
what is already built is worth as much as knowing what is not.

Ordered by reader benefit per unit of work.

---

## 1. 534 KB of webfonts is preloaded on every page

This is the largest reader-facing regression available to fix, and it is entirely
self-inflicted.

`app/fonts.ts` loads three families at thirteen static weights:

| Family                 | Subsets           | Weights                 |
| ---------------------- | ----------------- | ----------------------- |
| `Mukta`                | devanagari, latin | 400, 500, 600, 700, 800 |
| `Noto_Sans_Devanagari` | devanagari        | 400, 500, 600, 700      |
| `Source_Sans_3`        | latin             | 400, 500, 600, 700      |

All three set `preload: true`. The build ships **751 KB of woff2 across 25 files**, and a
rendered page carries **12 font preloads totalling 534 KB** — measured on
`.next/server/app/ne/team.html` by summing the `as="font"` hrefs. The single largest
face is 121 KB.

A preload is a promise that the file is needed immediately, so those 534 KB compete
with the HTML and the critical JS for the first seconds of a connection. On a 3G link
in Nepal that is the difference between a story appearing and a reader leaving.

Three things are wrong, in order of size:

- **Two Devanagari families are loaded.** Mukta already carries the `devanagari` subset,
  and Noto Sans Devanagari carries it again at four more weights. Pick one. Mukta is
  already the heading face (`--font-mukta` in `styles/01-base.css`); Noto is the body
  face for `[lang='ne']`. That is a defensible type pairing, but it costs a second full
  Devanagari glyph set and should be a decision someone makes knowingly.
- **Thirteen weights.** The design system defines its type scale with `font-weight` 400,
  600, 700 and 800 in practice. Every weight not referenced by a token is pure payload.
- **Everything is preloaded.** Preload the one or two faces that render above the fold
  and let the rest arrive on the normal font path — `display: 'swap'` is already set, so
  the fallback is already in place.

A reasonable target is **under 150 KB preloaded**. Getting there is mostly deletion.

Two things worth doing at the same time, since you will be touching the font stack:

- Add `adjustFontFallback` / `size-adjust` metrics so the swap from the system fallback
  to Mukta does not shift the page. Devanagari fallbacks differ a lot in metrics from
  Mukta, so this CLS is probably visible today.
- Consider variable fonts. Mukta is not available as one; Noto Sans Devanagari is, and a
  single variable file can replace four static weights.

## 2. Most of the audience cannot type a search query

`lib/search-server.ts` matches the query against the stored title and body. There is no
transliteration anywhere in `apps/web/lib` — `grep -rn "translit\|romani\|phonetic"`
returns nothing.

So the search box works if you have a Devanagari keyboard installed and configured. A
very large share of Nepali phone users do not, and type romanised Nepali instead:
`bhukampa`, `nirvachan`, `sarkar`, `kathmandu`. Every one of those returns zero results
against a Devanagari corpus today, and a zero-result search is indistinguishable to a
reader from "this site has no coverage of earthquakes".

The fix is at index time, not query time. `toSearchableStory` (`lib/search-server.ts:42`)
already normalises each story into a searchable shape; add a romanised key alongside the
Devanagari one and match against both.

The thing to get right is that **this must be permissive, not correct**. ISO 15919 is a
precise standard and precisely the wrong tool: readers type `bhukampa`, `bhukamba`,
`bhukamp`, and a strict scheme matches one of them. Map many romanisations onto one key
— fold aspirated/unaspirated pairs together, drop inherent vowels, collapse the three
sibilants and the retroflex/dental pairs. Over-matching is nearly free here (the ranker
sorts it out); under-matching is the failure you are trying to remove.

Worth pairing with a `did you mean` line and with logging the zero-result queries —
`lib/search-analytics.ts` already exists, and the list of things readers searched for and
did not find is the most useful editorial document this site could produce.

## 3. Devanagari numerals are a decision nobody has made

`DEVANAGARI_DIGITS = '०१२३४५६७८९'` appears in exactly one file,
`lib/content/series.ts:20`. Nowhere else.

So a Nepali reader today sees Devanagari digits in series numbering and Arabic digits in
dates, the market board, AQI readings, comment counts, reading time and the पात्रो. That
is not a style, it is an absence of one.

Make it a rule and put it in one formatter:

- Prose, dates, counts and the calendar → Devanagari digits in `ne`.
- The market, forex and NEPSE readouts → arguably Arabic, because that is how NEPSE
  publishes them and a trader cross-checking a number should not have to transliterate.
  The `tabular-nums` tracking those readouts already use is also a Latin-figure feature.

Either answer is fine. Having both by accident, in adjacent cards on the same page, is
the part that reads as unfinished. Whichever you choose, the exception should be written
down next to the formatter, because the next person will otherwise "fix" it back.

## 4. Offline reading works and no reader can tell

I expected this to be a gap and it is not. `app/sw.js/route.ts` ships a real service
worker: a shell cache, an article cache capped at 30 stories, an image cache capped at
80, versioned cache names, and a precache list. `lib/pwa/offline-cache.ts` has unit
tests. `PwaBoot.tsx` registers it and also recovers from stale-chunk failures after a
deploy. That is a genuinely good piece of work.

What is missing is any acknowledgement of it in the interface. `grep -rn
"navigator.onLine"` across `components/`, `app/` and `lib/` returns **nothing**.

So a reader on a train through a tunnel gets: cached pages that render silently as if
live, and uncached links that fail with a browser error page. They have no way to learn
that the last 30 articles are readable, which means the feature has roughly zero
perceived value despite being built and tested.

The work is small:

- An offline banner in the chrome driven by `navigator.onLine` plus the `online`/
  `offline` events.
- A stale marker on a cached article ("saved copy, last updated …") rather than passing
  it off as fresh — this is a news site, and a reader acting on a cached figure they
  believed was live is a trust problem.
- Offline-aware link affordance, or at minimum an in-app offline page instead of the
  browser's.
- Say so in the install prompt. "Read the latest 30 stories without a connection" is a
  far better reason to install than "install our app".

## 5. The CSS split made the duplicates findable, not gone

`globals.css` is now 14 partials under `apps/web/app/styles/`. The stated reason for the
split was that focus rings and card chrome had been redefined at several depths with
slightly different values, because nobody could hold 8,010 lines in their head.

The split does not fix that. It makes it **tractable** — you can now see that
`03-newsroom-account.css` and `07-newsroom-desks.css` both define a form register — but
every duplicate that existed before still exists, and the cascade still resolves them by
import order.

The next step is a third audit alongside `audit:contrast` and `audit:design-tokens`: walk
the partials, collect selectors, and report any defined in more than one file. Not all of
those are bugs — a deliberate override is legitimate — so the useful output is a
reviewed allowlist plus a failure on anything new. That is the same shape as
`audit-ui-bans.mjs`, which already works this way.

Then merge them one at a time, and use the trick that made the split safe: a production
build's compiled CSS hash. It is byte-stable (`2035f32af895357a` / `94a4fc51dd2080a1`),
so any merge that changes nothing rendered can be proved to change nothing rendered.

## 6. There are two styling systems and no inventory of either

14 partials of hand-written BEM-ish classes (`.newsroom-studio__actions`,
`.admin-button--primary`, `.patro-tool-nav`) sit alongside Tailwind utilities in JSX. Both
consume the same tokens, which is why the `--on-brand` fix had to be applied twice: 22
CSS rules **and** 34 JSX class strings.

That is the real cost of the split system — every design-system change is paid for
twice, and a fix applied to one half and not the other is invisible until a reader finds
it.

You do not need to unify them, and attempting it would be a large rewrite with no
reader-visible benefit. What is worth doing is bounding the problem:

- Take the ten most-repeated patterns — filled primary button, ghost button, card, form
  field, badge, tab, dialog — and make each one a React component with a single
  definition.
- Add the raw patterns to `audit-ui-bans.mjs` so new code cannot re-hand-roll them.
- Leave the rest alone.

That converts "two systems, unbounded" into "two systems, with the overlapping ten
resolved", which is the version you can live with indefinitely.

## 7. The contrast gate checks resting state only

`scripts/audit-contrast.mjs` covers 64 pairs, which is every token pair that renders as
text or as a meaningful non-text mark **at rest**. Two categories are not in it:

- **Hover and active recolours.** A link that darkens on hover passes twice; one that
  brightens toward the background fails at exactly the moment the reader is looking at
  it. The hover colours live in the partials rather than in `tokens.css`, which is why
  they are not covered — the gate reads tokens, not rules. Promoting the hover values to
  tokens would bring them in for free, and is worth doing for its own sake.
- **Text over images.** Lead-story and photo-desk headlines sit on photographs. Contrast
  applies to what renders, so the number that matters is at the image's _lightest_ point
  under the text, not its average. The fix is a scrim token with a measured floor and a
  rule that overlaid text always sits on it — then the pair becomes checkable and joins
  the other 64.

Both extensions are cheap because the machinery exists; it is the inputs that need to
move into `tokens.css`.

## 8. Nothing catches a visual regression

The `globals.css` split was safe because a no-op refactor can be proved by hashing the
compiled CSS. That trick works exactly once per class of change and not at all for
anything intended to look different.

For everything else there is no net: 652 tests pass without any of them knowing what the
site looks like.

Playwright screenshot baselines over the eight pages that carry the most chrome — front
page, article, पात्रो, market, search, reader corner, newsroom studio, admin — at two
themes and two locales is 32 images and a few hours' work. That is the smallest thing
that would let someone change a shared partial without reading all fourteen.

Do this before §5 and §6, not after. Both of those are refactors of shared CSS, which is
precisely the change a screenshot baseline exists to protect.

## 9. Keyboard and screen reader: the honest remaining gap

The token layer is AA-verified and gated. That is a real claim and a narrow one.
Automated checking catches the mechanical third of WCAG; it cannot tell you whether a
dialog can be left, whether a tab order makes sense, or whether a control announces what
it does.

One defect of that class was found by hand during this pass and is worth describing
because it is the shape of what a colour audit will never surface: the breaking ticker
renders its list twice so the marquee has no gap when it wraps, and the duplicate copy
was being announced by screen readers and tabbed through a second time. No contrast
check, no lint rule and no unit test would have caught it. Someone pressing Tab would
have, in about four seconds.

Surfaces to walk, ordered by how much interaction state they hold:

- `UtilityTools` — 14 `useState`, and the most complex thing a reader touches.
- `NepaliCalendar` and the पात्रो — date grids are where roving tabindex goes wrong.
- The media picker dialog — it has a focus trap, which means it can trap focus wrongly.
- `CommentSection` — the only reader-facing surface that posts.
- The newsroom studio — staff use it all day, which is when small friction compounds.

`pnpm test:a11y` exists and still is not in CI; that remains blocked on a token with the
`workflow` scope, as recorded in `roadmap-next.md` §5. Wiring it is two lines and has to
be done by a human.

## 10. The CSP cannot help you, so the injection points must be audited by hand

`lib/security/response-headers.ts` keeps `'unsafe-inline'` in `script-src`, and the
comment there is correct about why: the App Router inlines bootstrap script, and the
nonce alternative forces every route to render dynamically. The launch readiness surface
reports the residual weakness to the operator rather than hiding it, which is the right
call.

The consequence is that the CSP will not save you from an HTML injection, so the places
where this app injects HTML are load-bearing and should be reviewed deliberately rather
than trusted:

- `lib/content/inline-marks.ts` — article body inline marks. This is the one that takes
  editorial input and turns it into markup, so it is the highest-value target.
- `app/[locale]/live/[slug]/page.tsx` and `app/[locale]/photos/[slug]/page.tsx`.
- The JSON-LD emitters (`SiteJsonLd`, `seo/Schema`, `article/ArticleJsonLd`) — lower
  risk, since they serialise structured objects, but `JSON.stringify` alone does not
  escape `</script>`.

Reader comments are **not** on this list: they render as text, with no
`dangerouslySetInnerHTML` in the comment components. That is the correct design and
worth keeping as an explicit rule, because "let editors use a little formatting in
comments" is exactly the feature request that would undo it.

---

## If you only do three

1. **§1, the fonts.** Half a megabyte of preloaded webfonts on every page, for an
   audience largely on mobile data. Mostly deletion, immediately felt.
2. **§2, romanised search.** The search box currently does not work for readers without
   a Devanagari keyboard, which is most of them.
3. **§8, screenshot baselines.** Not because it helps a reader directly, but because
   §5 and §6 are shared-CSS refactors and this is what makes them safe to attempt.

§4 is the best ratio of reader benefit to effort on the list — the hard part is already
built and tested, and what remains is a banner and a label.
