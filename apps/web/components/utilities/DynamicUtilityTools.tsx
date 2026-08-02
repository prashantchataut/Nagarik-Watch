'use client'

import dynamic from 'next/dynamic'
import type { Locale } from '@nagarikwatch/db'

const toolFallback = (
  <div
    className="min-h-[18rem] animate-pulse border border-rule bg-surface-raised"
    aria-busy="true"
    aria-label="Loading tool"
  />
)

export const DynamicNepaliCalendar = dynamic(
  () => import('@/components/utilities/NepaliCalendar').then((m) => m.NepaliCalendar),
  { loading: () => toolFallback },
)

export const DynamicDateConverter = dynamic(
  () => import('@/components/utilities/UtilityTools').then((m) => m.DateConverterTool),
  { loading: () => toolFallback },
)

export const DynamicPreetiUnicode = dynamic(
  () => import('@/components/utilities/UtilityTools').then((m) => m.PreetiUnicodeTool),
  { loading: () => toolFallback },
)

export const DynamicAgeCalculator = dynamic(
  () => import('@/components/utilities/UtilityTools').then((m) => m.AgeCalculatorTool),
  { loading: () => toolFallback },
)

export const DynamicUnitConverter = dynamic(
  () => import('@/components/utilities/UtilityTools').then((m) => m.UnitConverterTool),
  { loading: () => toolFallback },
)

export const DynamicCurrencyConverter = dynamic(
  () => import('@/components/utilities/UtilityTools').then((m) => m.CurrencyConverterTool),
  { loading: () => toolFallback },
)

export type CurrencyToolProps = {
  locale: Locale
  rates: Array<{ iso3: string; name: string; buy: number; sell: number; unit: string }>
  source?: string
}
