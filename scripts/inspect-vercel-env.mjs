import fs from 'node:fs'

const raw = fs.readFileSync('.env.vercel.check', 'utf8')
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue
  const i = line.indexOf('=')
  if (i < 0) continue
  const k = line.slice(0, i)
  let v = line.slice(i + 1)
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1)
  }
  if (!/NEWSROOM_|AUTH_BOOT|DATABASE_URL|BETTER_AUTH|AUTH_SECRET|CONTENT_SOURCE/.test(k)) {
    continue
  }
  const sensitive = /PASSWORD|SECRET|DATABASE_URL/.test(k)
  console.log(
    JSON.stringify({
      key: k,
      empty: !v,
      len: v.length,
      hasWhitespace: /\s/.test(v),
      preview: sensitive ? (v ? `${v.slice(0, 2)}…${v.slice(-2)}` : '(empty)') : v,
    }),
  )
}
