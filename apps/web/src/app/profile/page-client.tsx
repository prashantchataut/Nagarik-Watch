'use client'

import ProfileView from "@/components/nagarik/ProfileView";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePageClient() {
  const router = useRouter()
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <>
      <ProfileView
        onOpenAccount={() => setAccountOpen(true)}
        onLogout={() => router.push("/")}
      />
      {accountOpen && (
        <button
          type="button"
          className="hidden"
          onClick={() => window.dispatchEvent(new Event("nagarikwatch:open-account"))}
          aria-hidden
        />
      )}
    </>
  )
}
