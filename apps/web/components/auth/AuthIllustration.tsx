import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type AuthIllustrationProps = SVGProps<SVGSVGElement> & {
  variant: 'reader' | 'journalist' | 'admin'
}

/**
 * Editorial line illustration used only on auth entrances.
 * It is intentionally simple, flat and brand-coloured so the page feels authored
 * without shipping a heavy decorative raster or a generic AI mascot.
 */
export function AuthIllustration({ variant, className, ...props }: AuthIllustrationProps) {
  return (
    <svg
      viewBox="0 0 720 520"
      aria-hidden="true"
      focusable="false"
      className={cn('h-auto w-full', className)}
      {...props}
    >
      <rect x="44" y="48" width="632" height="420" rx="28" fill="var(--surface)" opacity="0.78" />
      <path d="M94 108h532" stroke="var(--rule)" strokeWidth="2" />
      <circle cx="112" cy="82" r="7" fill="var(--brand)" />
      <circle cx="136" cy="82" r="7" fill="var(--rule-strong)" />
      <circle cx="160" cy="82" r="7" fill="var(--rule)" />

      {variant === 'reader' ? <ReaderScene /> : null}
      {variant === 'journalist' ? <JournalistScene /> : null}
      {variant === 'admin' ? <AdminScene /> : null}
    </svg>
  )
}

function ReaderScene() {
  return (
    <>
      <rect x="96" y="142" width="336" height="258" rx="12" fill="var(--paper)" stroke="var(--rule)" strokeWidth="2" />
      <rect x="118" y="166" width="70" height="12" fill="var(--brand)" />
      <rect x="118" y="198" width="260" height="18" rx="3" fill="var(--ink)" opacity="0.9" />
      <rect x="118" y="226" width="216" height="14" rx="3" fill="var(--ink-soft)" opacity="0.55" />
      <rect x="118" y="258" width="292" height="112" rx="5" fill="var(--brand-tint)" />
      <path d="M140 347c34-44 60-56 92-40 22 11 42 9 58-7 27-27 54-22 96 20v28H140Z" fill="var(--brand)" opacity="0.2" />
      <circle cx="354" cy="284" r="14" fill="var(--brand)" opacity="0.7" />

      <rect x="470" y="164" width="122" height="214" rx="18" fill="var(--ink)" />
      <rect x="482" y="181" width="98" height="174" rx="11" fill="var(--surface)" />
      <rect x="498" y="201" width="48" height="8" fill="var(--brand)" />
      <rect x="498" y="223" width="66" height="9" rx="2" fill="var(--ink)" opacity="0.85" />
      <rect x="498" y="242" width="54" height="7" rx="2" fill="var(--ink-soft)" opacity="0.45" />
      <rect x="498" y="270" width="66" height="50" rx="4" fill="var(--brand-tint)" />
      <circle cx="531" cy="367" r="5" fill="var(--surface)" />
      <path d="M226 419h258" stroke="var(--ink)" strokeWidth="8" strokeLinecap="round" opacity="0.12" />
    </>
  )
}

function JournalistScene() {
  return (
    <>
      <path d="M124 383h452" stroke="var(--ink)" strokeWidth="10" strokeLinecap="round" opacity="0.16" />
      <rect x="164" y="176" width="294" height="178" rx="10" fill="var(--ink)" />
      <rect x="177" y="189" width="268" height="145" rx="5" fill="var(--surface)" />
      <rect x="198" y="209" width="64" height="9" fill="var(--brand)" />
      <rect x="198" y="234" width="194" height="12" rx="2" fill="var(--ink)" opacity="0.9" />
      <rect x="198" y="257" width="174" height="8" rx="2" fill="var(--ink-soft)" opacity="0.45" />
      <rect x="198" y="277" width="152" height="8" rx="2" fill="var(--ink-soft)" opacity="0.35" />
      <rect x="198" y="301" width="84" height="18" fill="var(--brand-tint)" />
      <path d="M280 354h62v30h-62z" fill="var(--ink)" opacity="0.82" />

      <g transform="rotate(-7 504 278)">
        <rect x="468" y="188" width="112" height="164" rx="8" fill="var(--paper)" stroke="var(--rule-strong)" strokeWidth="2" />
        <rect x="486" y="214" width="70" height="10" fill="var(--brand)" />
        <path d="M486 246h74M486 267h62M486 288h70M486 309h44" stroke="var(--ink-soft)" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
      </g>
      <path d="M108 392h500" stroke="var(--brand)" strokeWidth="3" />
      <circle cx="131" cy="153" r="23" fill="var(--brand-tint)" />
      <path d="M121 153h20M131 143v20" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" />
    </>
  )
}

function AdminScene() {
  return (
    <>
      <rect x="108" y="156" width="504" height="222" rx="10" fill="var(--surface-raised)" stroke="var(--rule)" strokeWidth="2" />
      <rect x="108" y="156" width="118" height="222" rx="10" fill="var(--ink)" />
      <rect x="128" y="184" width="54" height="9" fill="var(--brand)" />
      <path d="M128 218h70M128 246h58M128 274h66M128 302h50M128 330h62" stroke="var(--paper)" strokeWidth="7" strokeLinecap="round" opacity="0.55" />

      <rect x="252" y="184" width="142" height="72" rx="6" fill="var(--paper)" stroke="var(--rule)" />
      <rect x="414" y="184" width="166" height="72" rx="6" fill="var(--paper)" stroke="var(--rule)" />
      <rect x="252" y="278" width="328" height="72" rx="6" fill="var(--paper)" stroke="var(--rule)" />
      <rect x="270" y="202" width="44" height="8" fill="var(--brand)" />
      <path d="M270 226h88M432 204h82M432 226h112M270 298h78M270 322h254" stroke="var(--ink-soft)" strokeWidth="7" strokeLinecap="round" opacity="0.45" />
      <circle cx="559" cy="214" r="14" fill="var(--brand)" opacity="0.8" />
      <path d="M356 403h8v22h-8zM376 392h8v33h-8zM396 378h8v47h-8z" fill="var(--brand)" opacity="0.6" />
    </>
  )
}
