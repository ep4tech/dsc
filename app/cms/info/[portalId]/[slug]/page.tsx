"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { usePortals } from "@/hooks/usePortals"
import { infoPagesCollection } from "@/lib/pb-collections"
import pb, { getErrorMessage } from "@/lib/pb"
import type { InfoPage } from "@/types/cms"
import type { Lang } from "@/types/form"
import { RichTextEditor } from "@/components/cms/RichTextEditor"
import { CmsPreviewDialog } from "@/components/cms/CmsPreviewDialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Eye, Loader2, Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { t, UI_STRINGS } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

function extractIcon(record: Record<string, unknown>): string {
  const icon = record.icon
  if (!icon) return ""
  if (Array.isArray(icon)) return icon[0] || ""
  return icon as string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Invalid image"))
    }
    img.src = url
  })
}

async function resizeIconToSquare(file: File, size = 256): Promise<File> {
  const img = await loadImage(file)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")

  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to process image"))),
      "image/png"
    )
  })
  return new File([blob], "icon.png", { type: "image/png" })
}

export default function CmsServiceEditorPage() {
  const { lang } = useLang()
  const { portals: PORTALS } = usePortals()
  const getPortalById = (id: string) => PORTALS.find((portal) => portal.id === id)
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft
  const params = useParams()
  const router = useRouter()
  const portalId = params.portalId as string
  const slug = params.slug as string
  const portal = getPortalById(portalId)
  const [activeLang, setActiveLang] = useState<Lang>("en")

  const [page, setPage] = useState<InfoPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [pageSlug, setPageSlug] = useState(slug)
  const [enTitle, setEnTitle] = useState("")
  const [arTitle, setArTitle] = useState("")
  const [enContent, setEnContent] = useState("")
  const [arContent, setArContent] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [iconUrl, setIconUrl] = useState<string | null>(null)

  const [resetKey, setResetKey] = useState(0)

  const isInitialMount = useRef(true)
  const pageRecordRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    async function load() {
      const data = await infoPagesCollection.getBySlug(slug)
      if (!data) {
        setLoading(false)
        return
      }
      pageRecordRef.current = data as unknown as Record<string, unknown>
      const iconFile = extractIcon(pageRecordRef.current)
      setIconUrl(
        iconFile && pageRecordRef.current
          ? pb.files.getUrl(pageRecordRef.current, iconFile)
          : null
      )
      setPage(data)
      setPageSlug(data.slug)
      setEnTitle(data.title_en)
      setArTitle(data.title_ar || "")
      setEnContent(data.content_en)
      setArContent(data.content_ar || "")
      setIsPublished(data.is_published)
      setLoading(false)
    }
    load()
  }, [slug, portalId])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setPageSlug(slugify(enTitle))
  }, [enTitle])

  const handleSave = useCallback(
    async (overrideContent?: string) => {
      if (!page) return
      setSaving(true)
      try {
        const contentField = `content_${activeLang}` as const
        const contentValue =
          overrideContent !== undefined
            ? overrideContent
            : activeLang === "en"
              ? enContent
              : arContent
        const updated = await infoPagesCollection.update(page.id, {
          portal_name: page.portal_name || portalId,
          slug: pageSlug,
          title_en: enTitle,
          title_ar: arTitle,
          is_published: isPublished,
          [contentField]: contentValue,
        })
        setPage(updated)
        setEnTitle(updated.title_en)
        setArTitle(updated.title_ar || "")
        setEnContent(updated.content_en)
        setArContent(updated.content_ar || "")
        if (updated.slug !== pageSlug) {
          router.push(`/cms/info/${portalId}/${updated.slug}`)
        }
      } catch (err) {
        toast.error(
          t(
            { en: "Failed to save. Make sure the slug is unique.", ar: "فشل الحفظ. تأكد من أن المعرف (slug) فريد." },
            lang
          ),
          { description: getErrorMessage(err) }
        )
      } finally {
        setSaving(false)
      }
    },
    [
      page,
      pageSlug,
      enTitle,
      arTitle,
      enContent,
      arContent,
      isPublished,
      activeLang,
      portalId,
      router,
      lang,
    ]
  )

  const handleContentChange = useCallback(
    (html: string) => {
      if (activeLang === "en") {
        setEnContent(html)
      } else {
        setArContent(html)
      }
    },
    [activeLang]
  )

  const handleContentSave = useCallback(
    async (html: string) => {
      if (activeLang === "en") {
        setEnContent(html)
      } else {
        setArContent(html)
      }
      await handleSave(html)
    },
    [handleSave, activeLang]
  )

  const copyFromEnglish = useCallback(() => {
    setArTitle(enTitle)
    setArContent(enContent)
    setResetKey(t => t + 1)
  }, [enTitle, enContent])

  const handleDiscard = useCallback(async () => {
    const data = await infoPagesCollection.getBySlug(slug)
    if (!data) return
    pageRecordRef.current = data as unknown as Record<string, unknown>
    setPage(data)
    setPageSlug(data.slug)
    setEnTitle(data.title_en)
    setArTitle(data.title_ar || "")
    setEnContent(data.content_en)
    setArContent(data.content_ar || "")
    setIsPublished(data.is_published)
    const iconFile = extractIcon(pageRecordRef.current)
    setIconUrl(iconFile ? pb.files.getUrl(pageRecordRef.current, iconFile) : null)
    setResetKey(t => t + 1)
  }, [slug])

  const togglePublish = useCallback(async () => {
    if (!page) return
    setPublishing(true)
    try {
      const updated = await infoPagesCollection.update(page.id, {
        is_published: !page.is_published,
      })
      setPage(updated)
      setIsPublished(updated.is_published)
    } finally {
      setPublishing(false)
    }
  }, [page])

  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      if (!page) throw new Error("No page loaded")
      const updated = await infoPagesCollection.updateWithFiles(page.id, {}, [file])
      const newMedia = updated.media as string[]
      const filename = newMedia[newMedia.length - 1]
      setPage((prev) => (prev ? { ...prev, media: newMedia } : null))
      return pb.files.getUrl(updated, filename)
    },
    [page]
  )

  const handleIconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !page) return
      setUploadingIcon(true)
      try {
        const resized = await resizeIconToSquare(file)
        const updated = await infoPagesCollection.updateIcon(page.id, resized)
        setPage(updated)
        pageRecordRef.current = updated as unknown as Record<string, unknown>
        const iconFile = extractIcon(pageRecordRef.current)
        setIconUrl(
          iconFile ? pb.files.getUrl(pageRecordRef.current, iconFile) : null
        )
      } catch (err) {
        toast.error(
          t(
            { en: "Please upload a valid image.", ar: "يرجى رفع صورة صالحة." },
            lang
          ),
          { description: getErrorMessage(err) }
        )
      } finally {
        e.target.value = ""
        setUploadingIcon(false)
      }
    },
    [page, lang]
  )

  const handleRemoveIcon = useCallback(async () => {
    if (!page) return
    try {
      const updated = await infoPagesCollection.removeIcon(page.id)
      setPage(updated)
      pageRecordRef.current = updated as unknown as Record<string, unknown>
      setIconUrl(null)
    } catch (err) {
      toast.error(
        t(
          { en: "Failed to remove icon.", ar: "فشل إزالة الأيقونة." },
          lang
        ),
        { description: getErrorMessage(err) }
      )
    }
  }, [page, lang])

  const handleDelete = useCallback(async () => {
    if (!page) return
    if (
      !confirm(
        t(
          {
            en: `Delete "${page.title_en}"? This cannot be undone.`,
            ar: `حذف "${page.title_en}"؟ لا يمكن التراجع عن هذا.`,
          },
          lang
        )
      )
    )
      return
    setDeleting(true)
    try {
      await infoPagesCollection.delete(page.id)
      router.push(`/cms/info/${portalId}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting(false)
    }
  }, [page, portalId, router, lang])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="space-y-4">
        <Link
          href={`/cms/info/${portalId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
        <p>{t({ en: "Page not found.", ar: "الصفحة غير موجودة." }, lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/cms/info/${portalId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t({ en: "Edit Page", ar: "تعديل الصفحة" }, lang)}
          </h1>
          <p className="text-muted-foreground">
            {t({ en: "Manage info page details", ar: "إدارة تفاصيل صفحة المعلومات" }, lang)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button> */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="me-2 h-4 w-4" />
            {t(UI_STRINGS.preview, lang)}
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="publish"
              checked={isPublished}
              onCheckedChange={togglePublish}
              disabled={publishing}
            />
            <Label htmlFor="publish" className="font-medium">
              {isPublished ? t(UI_STRINGS.published, lang) : t(UI_STRINGS.draft, lang)}
            </Label>
          </div>
        </div>
      </div>

      <Card className="space-y-4 p-4">
        <div className="space-y-2">
          <Label>{t({ en: "Portal", ar: "البوابة" }, lang)}</Label>
          <p className="text-sm text-muted-foreground">
            {portal ? t(portal.title, lang) : portalId}
          </p>
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)}
            placeholder="page-slug"
            className="max-w-xs w-72"
          />
        </div> */}

        <div className="space-y-2">
          <Label>{t({ en: "Icon", ar: "الأيقونة" }, lang)}</Label>
          {iconUrl && (
            <div className="relative mb-2 w-24 overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconUrl}
                alt={t({ en: "Icon", ar: "الأيقونة" }, lang)}
                className="h-auto w-full object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute right-1 top-1"
                onClick={handleRemoveIcon}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              disabled={uploadingIcon}
              className="w-72"
            />
            {uploadingIcon && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      </Card>

      <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeLang === "en" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="en-title">
              {t({ en: "Title (English)", ar: "العنوان (إنجليزي)" }, lang)}
            </Label>
            <Input
              id="en-title"
              value={enTitle}
              onChange={(e) => setEnTitle(e.target.value)}
              placeholder={t({ en: "Page title", ar: "عنوان الصفحة" }, lang)}
            />
          </div>
          <RichTextEditor
            key={`${resetKey}-en`}
            title={t({ en: "English Content", ar: "المحتوى (إنجليزي)" }, lang)}
            initialContent={enContent}
            onSave={handleContentSave}
            isSaving={saving}
            onImageUpload={handleImageUpload}
            onDiscard={handleDiscard}
            onChange={handleContentChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ar-title">
              {t({ en: "Title (Arabic)", ar: "العنوان (عربي)" }, lang)}
            </Label>
            <Button variant="outline" size="sm" onClick={copyFromEnglish}>
              <Copy className="mr-2 h-4 w-4" />
              {t({ en: "Copy from English", ar: "نسخ من الإنجليزية" }, lang)}
            </Button>
          </div>
          <Input
            id="ar-title"
            value={arTitle}
            onChange={(e) => setArTitle(e.target.value)}
            placeholder="عنوان الصفحة"
          />
          <RichTextEditor
            key={`${resetKey}-ar`}
            title={t({ en: "Arabic Content", ar: "المحتوى (عربي)" }, lang)}
            initialContent={arContent}
            onSave={handleContentSave}
            isSaving={saving}
            onImageUpload={handleImageUpload}
            onDiscard={handleDiscard}
            onChange={handleContentChange}
            direction="rtl"
          />
        </div>
      )}

      <CmsPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={activeLang === "ar" && arTitle ? arTitle : enTitle}
        html={activeLang === "en" ? enContent : arContent}
        lang={activeLang}
        path={`/info/${pageSlug}`}
      >
        {iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            className="mb-6 h-16 w-16 rounded-xl object-contain"
          />
        )}
      </CmsPreviewDialog>
    </div>
  )
}
