import EnglishHome from "@/components/nagarik/EnglishHome";

export const metadata = {
  title: "Nagarik Watch — Devanagari-first news from Nepal",
  description:
    "Nagarik Watch in English: Nepal top stories, flood disaster coverage, fact checks, markets, sports and opinion — from Nepal Devanagari-first newsroom.",
  alternates: { canonical: "/en", languages: { "ne-NP": "/", "en-US": "/en" } },
};

export default function EnglishPage() {
  return <EnglishHome />;
}
