import type { Config } from 'tailwindcss'

/**
 * Nagarik Watch Tailwind preset. Consumed by apps/web/tailwind.config.ts via:
 *   import tailwindPreset from '@nagarikwatch/ui/tailwind-preset'
 *   // ...presets: [tailwindPreset]
 *
 * Maps the CSS-variable tokens (tokens.css) onto Tailwind's color/spacing scale so
 * utilities like `bg-brand`, `text-ink`, `rule` work and respect the theme toggle.
 * Neutrals are tinted (never pure black/white) — impeccable law.
 *
 * Typed as Partial<Config> because a *preset* deliberately omits `content`/`plugins`
 * (the consuming app supplies those); Tailwind's `Config` type requires them.
 */
const tailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          strong: 'var(--brand-strong)',
          tint: 'var(--brand-tint)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        mute: 'var(--mute)',
        rule: 'var(--rule)',
        breaking: 'var(--breaking)',
        link: 'var(--link)',
        gold: 'var(--accent-gold)',
        // Semantic live-data states (market up/down, AQI bands). Paired with a glyph/label
        // in components, never colour-only (DESIGN.md §11).
        up: 'var(--up)',
        down: 'var(--down)',
        'aqi-good': 'var(--aqi-good)',
        'aqi-moderate': 'var(--aqi-moderate)',
        'aqi-unhealthy': 'var(--aqi-unhealthy)',
        'aqi-severe': 'var(--aqi-severe)',
      },
      maxWidth: {
        page: 'var(--page-max)',
        body: 'var(--body-max)',
      },
      spacing: {
        // 4px base scale, exposed as Tailwind spacing keys too.
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        24: 'var(--space-24)',
        32: 'var(--space-32)',
      },
      borderRadius: {
        none: 'var(--radius-0)',
        // Moderate rounding (user pick): inputs/small surfaces = 4px, default = 8px,
        // large cards/overlays = 12px, pills = full. `sm` is the smallest non-zero radius.
        sm: 'var(--radius-1)',
        DEFAULT: 'var(--radius-2)',
        md: 'var(--radius-2)',
        lg: 'var(--radius-3)',
        full: 'var(--radius-full)',
      },
      transitionTimingFunction: {
        'out-quint': 'var(--ease-out-quint)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        card: 'var(--shadow-card)',
      },
    },
  },
}

export default tailwindPreset
