/**
 * Static staff gateway written into apps/web/out/admin after Pages export.
 * Full /admin ops need a dynamic Workers/OpenNext deploy; static hosting strips APIs.
 */
export function buildStaffAdminHtml(options) {
  const site = String(options.siteUrl || '').replace(/\/$/, '') || 'https://nagarikwatch.com'
  const cms = String(options.cmsAdminUrl || '').replace(/\/$/, '')
  const cmsBlock = cms
    ? `<p class="lead">सम्पादकीय CMS यहाँ उपलब्ध छ:</p>
       <p><a class="primary" href="${cms}">${cms.replace(/^https?:\/\//, '')} खोल्नुहोस्</a></p>`
    : `<p class="lead">Payload CMS अहिले यस डोमेनमा जोडिएको छैन। <code>NEXT_PUBLIC_CMS_ADMIN_URL</code> सेट गरेर फेरि deploy गर्नुहोस्, वा OpenNext/Workers मा पूर्ण /admin डेस्क चलाउनुहोस्।</p>`

  return `<!doctype html>
<html lang="ne">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>न्युजरुम · नागरिक वाच</title>
  <style>
    :root { color-scheme: light; --brand:#9E1F22; --ink:#3A3332; --soft:#6B5F5D; --rule:#E2DAD8; --surface:#FBFAF9; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Noto Sans Devanagari", "Source Sans 3", system-ui, sans-serif; background: var(--surface); color: var(--ink); }
    main { max-width: 40rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
    .mark { font-weight: 800; font-size: 1.25rem; color: var(--brand); letter-spacing: -0.02em; }
    h1 { font-size: 1.75rem; line-height: 1.25; margin: 1.5rem 0 0.75rem; letter-spacing: -0.02em; }
    .lead { color: var(--soft); line-height: 1.65; margin: 0.75rem 0; }
    .primary { display: inline-flex; min-height: 2.75rem; align-items: center; padding: 0 1rem; background: var(--brand); color: #fff; text-decoration: none; font-weight: 700; }
    .primary:hover { filter: brightness(0.92); }
    .links { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); display: grid; gap: 0.75rem; }
    a.secondary { color: var(--brand); font-weight: 600; text-decoration: none; }
    a.secondary:hover { text-decoration: underline; }
    code { font-size: 0.85em; background: #fff; border: 1px solid var(--rule); padding: 0.1em 0.35em; }
    .en { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); color: var(--soft); font-size: 0.95rem; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <p class="mark">नागरिक वाच</p>
    <h1>न्युजरुम डेस्क</h1>
    <p class="lead">यो स्थैतिक सार्वजनिक साइटमा पूर्ण /admin अप्स कन्सोल समावेश छैन (API र लगइन सर्भर चाहिन्छ)।</p>
    ${cmsBlock}
    <div class="links">
      <a class="secondary" href="${site}/">गृहपृष्ठमा फर्कनुहोस्</a>
      <a class="secondary" href="${site}/journalist/login">पत्रकार लगइन (यदि सक्रिय छ)</a>
      <a class="secondary" href="${site}/contact">सम्पर्क</a>
    </div>
    <div class="en" lang="en">
      <strong>Newsroom</strong> — The public static export cannot host the full ops console.
      Point <code>NEXT_PUBLIC_CMS_ADMIN_URL</code> at your Payload CMS, or deploy the OpenNext Worker build for live <code>/admin</code>.
    </div>
  </main>
</body>
</html>`
}
