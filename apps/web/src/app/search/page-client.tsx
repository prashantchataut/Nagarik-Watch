'use client'

import { SearchView } from "@/components/nagarik/SavedSearch";
import { use } from "react";

export default function SearchPageClient({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = use(searchParams)
  return <SearchView initialQuery={params.q ?? ""} />;
}
