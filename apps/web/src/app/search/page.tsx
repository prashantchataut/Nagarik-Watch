import type { Metadata } from "next";
import SearchPageClient from "./page-client";

export const metadata: Metadata = {
  title: "खोज",
  description: "नागरिक वाचका समाचारमा खोज्नुहोस्।",
  alternates: { canonical: "/search" },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return <SearchPageClient searchParams={searchParams} />;
}
