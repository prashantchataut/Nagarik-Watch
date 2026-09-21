import path from 'node:path'

/**
 * Resolve a local JSON store file for development / emergency desk mode.
 *
 * Why this exists: passing a *dynamic* second argument to `path.join/resolve`
 * makes Turbopack's static analysis give up and trace the entire project into
 * the serverless bundle ("Dynamic filesystem access causes tracing of the whole
 * project"), which is how serverless functions blow past size limits.
 *
 * The default branch below is statically scoped (`process.cwd() + '.data' +
 * literal name`), so it traces nothing. An explicit operator override is the
 * only dynamic case and opts out of tracing on purpose.
 */
export function localStorePath(name: string, overrideEnv?: string): string {
  const configured = overrideEnv ? process.env[overrideEnv]?.trim() : ''
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(/* turbopackIgnore: true */ process.cwd(), configured)
  }
  return path.join(process.cwd(), '.data', name)
}
