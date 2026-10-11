"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowRight, X } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { t, localizedField } from "@/lib/i18n"
import pb from "@/lib/pb"
import { boundedFullList } from "@/lib/bounded-records"
import type { Portal } from "@/lib/portals"
import type { RecordModel } from "pocketbase"

export function ServiceSearch({ portals }: { portals: Portal[] }) {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [query, setQuery] = useState("")
  const [pages, setPages] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    boundedFullList(pb.collection("info_pages"), {
      filter: "is_published=true",
      requestKey: null,
    })
      .then((rows) => {
        if (active) {
          setPages(rows)
          setFailed(false)
        }
      })
      .catch(() => {
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt])
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/[\u064b-\u065f\u0670]/g, "")
      .trim()
  const results = useMemo(() => {
    const needle = normalize(query)
    if (!needle) return []
    return portals.flatMap((portal) => {
      const published = pages.filter((page) => page.portal_name === portal.id)
      const entries = published.map((page) => ({
        key: page.id,
        name: localizedField(page, lang, "title"),
        search: `${page.title_en || ""} ${page.title_ar || ""}`,
        href: `/info/${page.slug}`,
        portal: t(portal.title, lang),
      }))
      for (const service of portal.services) {
        if (
          !published.some(
            (page) =>
              page.slug === service.id ||
              normalize(String(page.title_en)) === normalize(service.name.en)
          )
        ) {
          entries.push({
            key: `${portal.id}-${service.id}`,
            name: t(service.name, lang),
            search: `${service.name.en} ${service.name.ar}`,
            href: `/portal/${portal.id}`,
            portal: t(portal.title, lang),
          })
        }
      }
      return entries.filter((entry) => normalize(entry.search).includes(needle))
    })
  }, [pages, portals, query, lang])
  return (
    <div className="mb-8 rounded-xl border border-[#0b3d60]/20 bg-white p-5 sm:p-6">
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div>
          <label
            htmlFor="service-search"
            className="mb-2 block text-lg font-semibold text-[#0b3d60]"
          >
            {ar
              ? "ما الخدمة التي تبحث عنها؟"
              : "What service are you looking for?"}
          </label>
          <p className="text-sm leading-relaxed text-[#526a7b]">
            {ar
              ? "ابحث عن خدمة مباشرة بالاسم بالعربية أو الإنجليزية، أو تصفّح البوابات التالية."
              : "Find a service directly by name in English or Arabic, or browse the following portals."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[#0b3d60]/30 px-3 focus-within:ring-2 focus-within:ring-[#0b3d60]">
          <Search size={20} aria-hidden="true" />
          <input
            id="service-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 min-w-0 flex-1 bg-transparent outline-none"
            placeholder={
              ar
                ? "مثلاً: التوحد، القلق، تصميم المناهج"
                : "Try autism, anxiety or curriculum design"
            }
            maxLength={120}
            aria-controls="service-results"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={ar ? "مسح البحث" : "Clear search"}
              className="p-2"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      {query.trim() && (
        <div id="service-results" className="mt-4">
          <p role="status" className="mb-2 text-sm text-[#526a7b]">
            {loading
              ? ar
                ? "جارٍ تحميل الخدمات…"
                : "Loading services…"
              : ar
                ? `${results.length} خدمة مطابقة`
                : `${results.length} matching services`}
          </p>
          {failed && (
            <p role="alert" className="mb-3 text-sm">
              {ar
                ? "تعذر تحميل تفاصيل الخدمات. يمكنك فتح البوابة أو إعادة المحاولة."
                : "Service details could not load. You can open the portal or retry."}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setLoading(true)
                  setAttempt((value) => value + 1)
                }}
              >
                {ar ? "إعادة المحاولة" : "Retry"}
              </button>
            </p>
          )}
          <ul className="max-h-80 divide-y divide-[#0b3d60]/10 overflow-auto">
            {results.map((result) => (
              <li key={result.key}>
                <Link
                  href={result.href}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-3 text-[#0b3d60] hover:bg-[#f3f6f8] focus-visible:outline-2"
                >
                  <span>
                    <strong className="block">{result.name}</strong>
                    <span className="text-sm text-[#526a7b]">
                      {result.portal}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
          {!loading && !results.length && (
            <p className="text-sm">
              {ar
                ? "لا توجد نتائج. جرّب كلمة أخرى أو استكشف البوابات أدناه."
                : "No matches. Try another word or explore the portals below."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
