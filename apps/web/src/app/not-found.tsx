import { href } from "@/lib/news/router";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-[680px] px-4 py-20 text-center">
      <p className="kicker">पृष्ठ भेटिएन</p>
      <h1 className="mt-2 font-headline text-[34px] font-extrabold text-ink">४०४ — यस्तो पृष्ठ छैन</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        तपाईंले खोज्नुभएको पृष्ठ सारिएको वा हटाइएको हुन सक्छ। तलका बाटाहरूबाट सुरु गर्नुहोस्।
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={href("/")} className="rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white">
          गृहपृष्ठ
        </a>
        <a href={href("/feed")} className="rounded-sm border border-rule-strong px-5 py-2.5 font-headline text-[15px] font-bold text-ink">
          सबै समाचार
        </a>
        <a href={href("/search")} className="rounded-sm border border-rule-strong px-5 py-2.5 font-headline text-[15px] font-bold text-ink">
          खोज्नुहोस्
        </a>
      </div>
    </main>
  );
}
