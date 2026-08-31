'use client'

import SubscribeView from "@/components/nagarik/SubscribeView";

export default function SubscribePageClient() {
  return (
    <SubscribeView
      onOpenAccount={() => window.dispatchEvent(new Event("nagarikwatch:open-account"))}
    />
  )
}
