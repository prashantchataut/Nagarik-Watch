'use client'

import { useMemo, useState } from 'react'
import { AdminButton, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/primitives'

type Creative = {
  title: string
  body: string
  cta: string
  href: string
  imageUrl?: string
  titleEn?: string
  bodyEn?: string
  ctaEn?: string
}

type EditableHouseAd = Creative & {
  placementKey: string
  active: boolean
  abEnabled: boolean
  challenger?: Creative
}

type PlacementOption = {
  key: string
  label: string
  width: number
  height: number
  position: string
}

export function HouseAdEditor({
  placements,
  houseAds,
  action,
}: {
  placements: PlacementOption[]
  houseAds: EditableHouseAd[]
  action: (formData: FormData) => void | Promise<void>
}) {
  const byPlacement = useMemo(
    () => new Map(houseAds.map((ad) => [ad.placementKey, ad])),
    [houseAds],
  )
  const initialKey = houseAds[0]?.placementKey ?? placements[0]?.key ?? ''
  const [placementKey, setPlacementKey] = useState(initialKey)
  const placement = placements.find((item) => item.key === placementKey)
  const ad = byPlacement.get(placementKey)

  if (!placement) return null

  return (
    <form key={placementKey} action={action} className="mt-4 grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-end">
        <AdminSelect
          label="Placement"
          name="placementKey"
          lang="en"
          value={placementKey}
          onChange={(event) => setPlacementKey(event.target.value)}
          options={placements.map((item) => ({
            value: item.key,
            label: `${item.key} · ${item.width}×${item.height}`,
          }))}
        />
        <div className="rounded-sm border border-rule bg-surface px-3 py-2.5 text-caption text-ink-soft">
          <span className="block font-bold text-ink" lang="en">
            {placement.label}
          </span>
          <span lang="en">{placement.position}</span>
        </div>
        <label className="flex min-h-11 items-center gap-2 rounded-sm border border-rule bg-surface px-3 text-meta font-semibold text-ink-soft">
          <input
            name="active"
            type="checkbox"
            className="size-4 accent-brand"
            defaultChecked={ad?.active ?? false}
          />
          Active
        </label>
      </div>

      <fieldset className="grid gap-3 rounded-sm border border-rule p-4 lg:grid-cols-6">
        <legend className="px-1 text-meta font-bold text-brand-strong" lang="ne">
          नेपाली creative
        </legend>
        <div className="lg:col-span-4">
          <AdminInput label="शीर्षक" name="title" required defaultValue={ad?.title} />
        </div>
        <div className="lg:col-span-2">
          <AdminInput label="CTA" name="cta" required defaultValue={ad?.cta} />
        </div>
        <div className="lg:col-span-6">
          <AdminTextarea label="विवरण" name="body" required rows={3} defaultValue={ad?.body} />
        </div>
      </fieldset>

      <fieldset className="grid gap-3 rounded-sm border border-rule p-4 lg:grid-cols-6">
        <legend className="px-1 text-meta font-bold text-brand-strong" lang="en">
          English variant
        </legend>
        <div className="lg:col-span-4">
          <AdminInput label="Title" name="titleEn" lang="en" defaultValue={ad?.titleEn} />
        </div>
        <div className="lg:col-span-2">
          <AdminInput label="CTA" name="ctaEn" lang="en" defaultValue={ad?.ctaEn} />
        </div>
        <div className="lg:col-span-6">
          <AdminTextarea label="Body" name="bodyEn" lang="en" rows={3} defaultValue={ad?.bodyEn} />
        </div>
      </fieldset>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <AdminInput
          label="Destination URL"
          name="href"
          type="text"
          lang="en"
          required
          defaultValue={ad?.href}
          hint="Use /path for Nagarik Watch or an https:// URL for an external campaign."
        />
        <AdminInput
          label="Image URL"
          name="imageUrl"
          type="url"
          lang="en"
          defaultValue={ad?.imageUrl}
          hint="Optional. Text-only creative remains valid without an image."
        />
      </div>

      <fieldset className="grid gap-3 rounded-sm border border-rule bg-surface p-4 lg:grid-cols-6">
        <legend className="px-1 text-meta font-bold text-brand-strong" lang="en">
          A/B challenger
        </legend>
        <label className="lg:col-span-6 flex items-center gap-2 text-meta font-semibold text-ink">
          <input
            name="abEnabled"
            type="checkbox"
            className="size-4 accent-brand"
            defaultChecked={ad?.abEnabled ?? false}
          />
          Enable control vs challenger experiment
        </label>
        <div className="lg:col-span-4">
          <AdminInput
            label="Challenger title"
            name="challengerTitle"
            lang="en"
            defaultValue={ad?.challenger?.title}
          />
        </div>
        <div className="lg:col-span-2">
          <AdminInput
            label="Challenger CTA"
            name="challengerCta"
            lang="en"
            defaultValue={ad?.challenger?.cta}
          />
        </div>
        <div className="lg:col-span-6">
          <AdminTextarea
            label="Challenger body"
            name="challengerBody"
            lang="en"
            rows={3}
            defaultValue={ad?.challenger?.body}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminInput
            label="Challenger English title"
            name="challengerTitleEn"
            lang="en"
            defaultValue={ad?.challenger?.titleEn}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminInput
            label="Challenger English CTA"
            name="challengerCtaEn"
            lang="en"
            defaultValue={ad?.challenger?.ctaEn}
          />
        </div>
        <div className="lg:col-span-6">
          <AdminTextarea
            label="Challenger English body"
            name="challengerBodyEn"
            lang="en"
            rows={3}
            defaultValue={ad?.challenger?.bodyEn}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminInput
            label="Challenger destination"
            name="challengerHref"
            type="text"
            lang="en"
            defaultValue={ad?.challenger?.href}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminInput
            label="Challenger image URL"
            name="challengerImageUrl"
            type="url"
            lang="en"
            defaultValue={ad?.challenger?.imageUrl}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="submit">Save house ad</AdminButton>
        <span className="text-caption text-mute" lang="en">
          Saving with Active unchecked keeps the creative configured but off-air.
        </span>
      </div>
    </form>
  )
}
