"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageLoader } from "@/components/ui/page-loader"
import { DataError } from "@/components/ui/data-error"
import { usePortals } from "@/hooks/usePortals"
import { infoPagesCollection } from "@/lib/pb-collections"
import pb, { getErrorMessage } from "@/lib/pb"
import { Card } from "@/components/ui/card"
import { DragList } from "@/components/ui/drag-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  FileText,
  Trash2,
  Pencil,
} from "lucide-react"
import { t, UI_STRINGS } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

interface InfoPageRecord {
  id: string
  slug: string
  title_en: string
  icon?: string
  is_published: boolean
  order: number
}

export default function CmsPortalServicesPage() {
  const { lang } = useLang()
  const { portals: PORTALS, isLoading: portalsLoading, error: portalsError, reload: reloadPortals } = usePortals()
  const getPortalById = (id: string) => PORTALS.find((portal) => portal.id === id)
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft
  const params = useParams()
  const router = useRouter()
  const portalId = params.portalId as string
  const portal = getPortalById(portalId)

  const [pages, setPages] = useState<InfoPageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  const loadPages = useCallback(async () => {
    const data = await boundedFullList(pb.collection("info_pages"), {
      filter: pb.filter("portal_name = {:value0}", { value0: portalId }),
      sort: "order",
    })
    setPages(data as unknown as InfoPageRecord[])
  }, [portalId])

  useEffect(() => {
    if (!portal) return
    const timer = window.setTimeout(() => { void loadPages().finally(() => setLoading(false)) }, 0)
    return () => window.clearTimeout(timer)
  }, [portal, loadPages])

  const handleNewPage = async () => {
    setCreating(true)
    try {
      const newPage = await infoPagesCollection.create({
        slug: `new-page-${Date.now()}`,
        title_en: "New Page",
        portal_name: portalId,
      })
      router.push(`/cms/info/${portalId}/${newPage.slug}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        t(
          {
            en: `Delete "${title}"? This cannot be undone.`,
            ar: `حذف "${title}"؟ لا يمكن التراجع عن هذا.`,
          },
          lang
        )
      )
    )
      return
    setDeleting(id)
    try {
      await infoPagesCollection.delete(id)
      setPages((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleReorder = useCallback(async (items: InfoPageRecord[]) => {
    setSavingOrder(true)
    try {
      await Promise.all(
        items.map((item) =>
          infoPagesCollection.update(item.id, { order: item.order })
        )
      )
      setPages(items)
    } 

    catch (err) {
      toast.error(
        t(
          { en: "Failed to save order.", ar: "فشل حفظ الترتيب." },
          lang
        ),
        { description: getErrorMessage(err) }
      )
    } 

    finally {
      setSavingOrder(false)
    }
  }, [lang])

  if (portalsLoading) return <PageLoader />
  if (portalsError) return <DataError message={lang === "ar" ? "تعذر تحميل البوابات." : "Unable to load portals."} onRetry={() => void reloadPortals()} />
  if (!portal) {
    return (
      <div className="space-y-4">
        <Link
          href="/cms/info"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
        <p>{t({ en: "Portal not found", ar: "البوابة غير موجودة" }, lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cms/info"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(portal.title, lang)}</h1>
          <p className="text-muted-foreground">
            {t(
              { en: "Manage info pages for this portal", ar: "إدارة صفحات المعلومات لهذه البوابة" },
              lang
            )}
          </p>
        </div>

        {/* <Button onClick={handleNewPage} disabled={creating}>
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Page
        </Button> */}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            {t({ en: "No pages yet.", ar: "لا توجد صفحات بعد." }, lang)}
          </p>
          <Button onClick={handleNewPage} className="mt-4" disabled={creating}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t({ en: "Create your first page", ar: "أنشئ صفحتك الأولى" }, lang)}
          </Button>
        </div>
        ) : (
          <DragList
            items={pages}
            onReorder={handleReorder}
            keyExtractor={(p) => p.id}
            containerClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            renderItem={(p) => {
              const iconUrl = p.icon ? pb.files.getUrl(p as never, p.icon) : null
              return (
                <>
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${portal.accent}15` }}
                  >
                    {iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />
                    ) : (
                      <FileText className="h-6 w-6" style={{ color: portal.accent }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{p.title_en}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      {p.is_published ? (
                        <Badge variant="default" className="text-xs" style={{ backgroundColor: portal.accent, color: "#fff" }}>
                          {t(UI_STRINGS.published, lang)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{t(UI_STRINGS.draft, lang)}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/cms/info/${portalId}/${p.slug}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p.id, p.title_en)}
                      disabled={deleting === p.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </>
              )
            }}
          />
        )}
    </div>
  )
}
