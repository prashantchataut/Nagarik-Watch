import type { NextConfig } from "next";

function hostFromUrl(value?: string) {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return {
      protocol: u.protocol.slice(0, -1) as "https" | "http",
      hostname: u.hostname,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const configuredHosts = [
  process.env.STORAGE_PUBLIC_BASE_URL,
  process.env.R2_PUBLIC_BASE_URL,
  process.env.STORAGE_ENDPOINT,
  process.env.R2_ENDPOINT,
]
  .map(hostFromUrl)
  .filter((v): v is NonNullable<typeof v> => v !== null);

// Dedupe by hostname+protocol
const remotePatterns = (() => {
  const base = [
    // Keep R2 public bucket hosts for backwards compat
    { protocol: "https" as const, hostname: "**.r2.dev", pathname: "/**" },
    { protocol: "https" as const, hostname: "r2.dev", pathname: "/**" },
    // Void Drive / generic S3 public host will be added via STORAGE_PUBLIC_BASE_URL above
    ...configuredHosts,
  ];
  const seen = new Set<string>();
  return base.filter((p) => {
    const k = `${p.protocol}://${p.hostname}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Vercel-friendly defaults; SSG + ISR (revalidate) power the newsroom.
  images: {
    remotePatterns,
  },
  // No `eslint` key: Next 16 removed the option and `next build` no longer lints.
  // Linting runs through the ESLint CLI (`pnpm lint`) instead.
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
