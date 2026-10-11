"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageLoader } from "@/components/ui/page-loader"
import { DataError } from "@/components/ui/data-error"
import { usePortals } from "@/hooks/usePortals"
import { infoPagesCollection } from "@/lib/pb-collections"
import type { InfoPage } from "@/types/cms"
import { Card } from "@/components/ui/card"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

export default function CmsInfoPage() {
  const { lang } = useLang()
  const { portals: PORTALS, isLoading: portalsLoading, error, reload } = usePortals()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    infoPagesCollection
      .getAll()
      .then((pages: InfoPage[]) => {
        const byPortal: Record<string, number> = {}
        pages.forEach((page) => {
          const key = page.portal_name || ""
          byPortal[key] = (byPortal[key] || 0) + 1
        })
        setCounts(byPortal)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t({ en: "Info Pages", ar: "صفحات المعلومات" }, lang)}
        </h1>
        <p className="text-muted-foreground">
          {t(
            { en: "Select a portal to manage its info pages", ar: "اختر بوابة لإدارة صفحات المعلومات الخاصة بها" },
            lang
          )}
        </p>
      </div>

      {portalsLoading && <PageLoader />}
      {error && <DataError message={lang === "ar" ? "تعذر تحميل البوابات." : "Unable to load portals."} onRetry={() => void reload()} />}
      {!portalsLoading && !error && PORTALS.length === 0 && <p>{lang === "ar" ? "لا توجد بوابات متاحة." : "No portals available."}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PORTALS.map((portal) => (
          <Link key={portal.id} href={`/cms/info/${portal.id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
              <div
                className="h-2"
                style={{ backgroundColor: portal.accent }}
              />
              <div className="p-4">
                <h3 className="font-semibold">{t(portal.title, lang)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading
                    ? "..."
                    : t(
                        {
                          en: `${counts[portal.id] || 0} ${counts[portal.id] === 1 ? "page" : "pages"}`,
                          ar: `${counts[portal.id] || 0} ${counts[portal.id] === 1 ? "صفحة" : "صفحات"}`,
                        },
                        lang
                      )}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
