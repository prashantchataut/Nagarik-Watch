/**
 * Static public-gate pages for routes that cannot run on Pages (auth / journalist).
 * Full desks need the OpenNext Worker; these pages keep links from dying as 404s.
 */
export function buildPublicDeskHtml(options) {
  const site = String(options.siteUrl || '').replace(/\/$/, '') || 'https://nagarikwatch.com'
  const title = options.titleNe
  const lead = options.leadNe
  const enTitle = options.titleEn
  const enLead = options.leadEn
  const primaryHref = options.primaryHref || `${site}/`
  const primaryLabel = options.primaryLabelNe || 'गृहपृष्ठमा फर्कनुहोस्'

  return `<!doctype html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title} · नागरिक वाच</title>
  <style>
    :root { color-scheme: light dark; --brand:#9E1F22; --ink:#111; --soft:#555; --rule:#ddd; --surface:#fafafa; }
    @media (prefers-color-scheme: dark) {
      :root { --ink:#f4f4f4; --soft:#aaa; --rule:#333; --surface:#000; }
    }
    * { box-sizing: border-box; }
    body { margin:0; font-family:"Noto Sans Devanagari","Source Sans 3",system-ui,sans-serif; background:var(--surface); color:var(--ink); }
    main { max-width:40rem; margin:0 auto; padding:3rem 1.25rem 4rem; }
    .mark { font-weight:800; font-size:1.15rem; color:var(--brand); }
    h1 { font-size:clamp(1.6rem,4vw,2.1rem); line-height:1.2; margin:1.25rem 0 .75rem; letter-spacing:-.02em; }
    .lead { color:var(--soft); line-height:1.65; margin:.75rem 0; }
    .primary { display:inline-flex; min-height:2.75rem; align-items:center; padding:0 1rem; background:var(--brand); color:#fff; text-decoration:none; font-weight:700; margin-top:1rem; }
    .links { margin-top:2rem; padding-top:1.25rem; border-top:1px solid var(--rule); display:grid; gap:.75rem; }
    a.secondary { color:var(--brand); font-weight:600; text-decoration:none; }
    a.secondary:hover { text-decoration:underline; }
    .en { margin-top:2rem; padding-top:1.25rem; border-top:1px solid var(--rule); color:var(--soft); font-size:.95rem; line-height:1.6; }
  </style>
</head>
<body>
  <main>
    <p class="mark">नागरिक वाच</p>
    <h1>${title}</h1>
    <p class="lead">${lead}</p>
    <p><a class="primary" href="${primaryHref}">${primaryLabel}</a></p>
    <div class="links">
      <a class="secondary" href="${site}/">गृहपृष्ठ</a>
      <a class="secondary" href="${site}/latest/">ताजा अपडेट</a>
      <a class="secondary" href="${site}/contact/">सम्पर्क</a>
    </div>
    <div class="en" lang="en">
      <strong>${enTitle}</strong> — ${enLead}
    </div>
  </main>
</body>
</html>`
}
