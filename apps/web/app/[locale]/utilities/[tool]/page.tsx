import { staticUtilityToolParams } from '@/lib/static-export-params'
import { notFound } from 'next/navigation'
import { asLocale } from '@/lib/i18n/locales'
import { UtilityPageShell } from '@/components/utilities/UtilityPageShell'
import {
  AgeCalculatorTool,
  CurrencyConverterTool,
  DateConverterTool,
  PreetiUnicodeTool,
  UnitConverterTool,
} from '@/components/utilities/UtilityTools'
import { NepaliCalendar } from '@/components/utilities/NepaliCalendar'
import { getRealForex } from '@/lib/live/real'

export const dynamic = 'force-static'
export function generateStaticParams() {
  return staticUtilityToolParams()
}

const meta = {
  calendar: ['Nepali calendar', 'नेपाली पात्रो', 'Browse Bikram Sambat months, festivals and holidays.', 'विक्रम संवत् महिना, पर्व र बिदा हेर्नुहोस्।'],
  'date-converter': ['BS / AD date converter', 'बि.सं. / इस्वी मिति रूपान्तरण', 'Convert dates accurately in both directions.', 'दुवै दिशामा मिति सही रूपमा रूपान्तरण गर्नुहोस्।'],
  'preeti-unicode': ['Preeti Unicode converter', 'प्रिती युनिकोड रूपान्तरण', 'Convert legacy Nepali font text in your browser.', 'पुरानो नेपाली फन्टको पाठ ब्राउजरमै रूपान्तरण गर्नुहोस्।'],
  currency: ['NPR currency converter', 'नेपाली मुद्रा रूपान्तरण', 'Convert NPR and major currencies when verified rates are available.', 'प्रमाणित दर उपलब्ध हुँदा नेपाली रुपैयाँ र प्रमुख मुद्रा रूपान्तरण गर्नुहोस्।'],
  'age-calculator': ['Age calculator', 'उमेर क्याल्कुलेटर', 'Calculate exact age in years, months and days.', 'वर्ष, महिना र दिनमा ठ्याक्कै उमेर निकाल्नुहोस्।'],
  'unit-converter': ['Unit converter', 'एकाइ रूपान्तरण', 'Convert length, weight and temperature.', 'लम्बाइ, तौल र तापक्रम रूपान्तरण गर्नुहोस्।'],
} as const

export default async function UtilityToolPage({ params }: { params: Promise<{ locale: string; tool: string }> }) {
  const { locale: raw, tool } = await params
  const locale = asLocale(raw)
  const item = meta[tool as keyof typeof meta]
  if (!item) notFound()
  const en = locale === 'en'
  let content
  if (tool === 'calendar') content = <NepaliCalendar locale={locale} />
  else if (tool === 'date-converter') content = <DateConverterTool locale={locale} />
  else if (tool === 'preeti-unicode') content = <PreetiUnicodeTool locale={locale} />
  else if (tool === 'currency') {
    const forex = await getRealForex(locale)
    content = (
      <CurrencyConverterTool
        locale={locale}
        rates={forex.data ?? []}
        source={forex.source}
      />
    )
  } else if (tool === 'age-calculator') content = <AgeCalculatorTool locale={locale} />
  else content = <UnitConverterTool locale={locale} />

  return (
    <UtilityPageShell
      locale={locale}
      title={en ? item[0] : item[1]}
      description={en ? item[2] : item[3]}
      currentPath={`/utilities/${tool}`}
    >
      {content}
    </UtilityPageShell>
  )
}