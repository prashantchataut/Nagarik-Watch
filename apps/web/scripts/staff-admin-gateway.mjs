/**
 * Static staff gateway written into apps/web/out/admin after Pages export.
 * Full /admin ops need the OpenNext Worker (`nagarik-watch-app`); static hosting strips APIs.
 */
export function buildStaffAdminHtml(options) {
  const site = String(options.siteUrl || '').replace(/\/$/, '') || 'https://nagarikwatch.com'
  const cms = String(options.cmsAdminUrl || '').replace(/\/$/, '')
  const desk = String(options.adminAppUrl || '').replace(/\/$/, '')
  const deskLogin = desk ? `${desk}/admin/login` : ''

  if (deskLogin) {
    return `<!doctype html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <meta http-equiv="refresh" content="0;url=${deskLogin}" />
  <link rel="canonical" href="${deskLogin}" />
  <title>न्युजरुम · नागरिक वाच</title>
  <style>
    :root { color-scheme: light dark; --brand:#9E1F22; --ink:#1a1a1a; --soft:#555; --surface:#fafafa; --paper:#fff; }
    @media (prefers-color-scheme: dark) {
      :root { --ink:#f5f5f5; --soft:#aaa; --surface:#000; }
    }
    body { margin:0; font-family:"Noto Sans Devanagari","Source Sans 3",system-ui,sans-serif; background:var(--surface); color:var(--ink); }
    main { max-width:36rem; margin:0 auto; padding:3rem 1.25rem; }
    a.primary { display:inline-flex; min-height:2.75rem; align-items:center; border-radius:8px; padding:0 1rem; background:var(--brand); color:var(--paper); text-decoration:none; font-weight:700; }
    .lead { color:var(--soft); line-height:1.6; }
  </style>
</head>
<body>
  <main>
    <p class="lead">न्युजरुम डेस्कमा लैजादै…</p>
    <p><a class="primary" href="${deskLogin}">प्रवेश गर्नुहोस्</a></p>
  </main>
  <script>location.replace(${JSON.stringify(deskLogin)})</script>
</body>
</html>`
  }

  const cmsBlock = cms
    ? `<p class="lead">सम्पादकीय CMS अहिले यो लिंकबाट खोल्न सकिन्छ:</p>
       <p><a class="primary" href="${cms}">CMS खोल्नुहोस्</a></p>`
    : `<p class="lead">पूर्ण न्युजरुम लगइन यस सार्वजनिक होस्टमा जोडिएको छैन। सार्वजनिक समाचार साइट सामान्य रूपमा चल्छ; कर्मचारी डेस्क छुट्टै एप होस्टमा चल्नुपर्छ।</p>`

  return `<!doctype html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>न्युजरुम · नागरिक वाच</title>
  <style>
    :root { color-scheme: light dark; --brand:#9E1F22; --ink:#1a1a1a; --soft:#555; --rule:#e5e5e5; --surface:#fafafa; --paper:#fff; }
    @media (prefers-color-scheme: dark) {
      :root { --ink:#f4f4f4; --soft:#aaa; --rule:#333; --surface:#000; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Noto Sans Devanagari", "Source Sans 3", system-ui, sans-serif; background: var(--surface); color: var(--ink); }
    main { max-width: 40rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
    .mark { font-weight: 800; font-size: 1.15rem; color: var(--brand); }
    h1 { font-size: clamp(1.6rem, 4vw, 2.1rem); line-height: 1.2; margin: 1.25rem 0 .75rem; letter-spacing: -.02em; }
    .lead { color: var(--soft); line-height: 1.65; margin: .75rem 0; }
    .primary { display: inline-flex; min-height: 2.75rem; align-items: center; border-radius: 8px; padding: 0 1rem; background: var(--brand); color: var(--paper); text-decoration: none; font-weight: 700; }
    .links { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); display: grid; gap: .75rem; }
    a.secondary { color: var(--brand); font-weight: 600; text-decoration: none; }
    a.secondary:hover { text-decoration: underline; }
    .en { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); color: var(--soft); font-size: .95rem; line-height: 1.6; }
    .note { margin-top: 1rem; padding: .9rem 1rem; border: 1px solid var(--rule); border-radius: 8px; background: color-mix(in srgb, var(--surface) 92%, var(--brand) 8%); }
  </style>
</head>
<body>
  <main>
    <p class="mark">नागरिक वाच</p>
    <h1>न्युजरुम डेस्क</h1>
    <p class="lead">यो पृष्ठ सार्वजनिक समाचार साइट हो। कर्मचारी लगइन र सम्पादन उपकरण यहाँबाट सिधै खुल्दैनन्।</p>
    ${cmsBlock}
    <div class="note">
      <strong>के गर्ने?</strong>
      <p class="lead" style="margin:.4rem 0 0">डेस्क एप होस्ट तयार भएपछि <code>NEXT_PUBLIC_ADMIN_APP_URL</code> सेट गर्नुहोस्। तब <code>/admin</code> स्वतः लगइनमा जान्छ।</p>
    </div>
    <div class="links">
      <a class="secondary" href="${site}/">गृहपृष्ठमा फर्कनुहोस्</a>
      <a class="secondary" href="${site}/contact/">सम्पर्क</a>
    </div>
    <div class="en" lang="en">
      <strong>Newsroom desk</strong> — The public site is static. Staff login needs a separate app host (or CMS URL). This is not a missing data error; the ops desk is simply not wired to this host yet.
    </div>
  </main>
</body>
</html>`
}
