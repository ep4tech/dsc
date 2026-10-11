"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { blogPagesCollection, blogCategoriesCollection } from "@/lib/pb-collections"
import { BlogPage, BlogCategory } from "@/types/cms"
import type { Lang } from "@/types/form"
import { RichTextEditor } from "@/components/cms/RichTextEditor"
import { CmsPreviewDialog } from "@/components/cms/CmsPreviewDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Loader2, ArrowLeft, ArrowRight, Eye, Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
import pb, { getErrorMessage } from "@/lib/pb"
import { t, UI_STRINGS } from "@/lib/i18n"
import { formatDate } from "@/lib/format-date"
import { useLang } from "@/lib/lang-context"

function extractThumbnail(record: Record<string, unknown>): string {
  const t = record.thumbnail
  if (!t) return ""
  if (Array.isArray(t)) return t[0] || ""
  return t as string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CmsBlogEditorPage() {
  const { lang } = useLang()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [activeLang, setActiveLang] = useState<Lang>("en")
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft

  const [page, setPage] = useState<BlogPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [enTitle, setEnTitle] = useState("")
  const [arTitle, setArTitle] = useState("")
  const [postSlug, setPostSlug] = useState("")
  const [category, setCategory] = useState("")
  const [enContent, setEnContent] = useState("")
  const [arContent, setArContent] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [authorName, setAuthorName] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  const [categories, setCategories] = useState<BlogCategory[]>([])

  const [resetKey, setResetKey] = useState(0)

  const isInitialMount = useRef(true)
  const pageRecordRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    async function load() {
      const [rawRecords, cats] = await Promise.all([
        boundedFullList(pb.collection("blog_pages"), { filter: pb.filter("slug = {:value0}", { value0: slug }), limit: 1 }),
        blogCategoriesCollection.getAll(),
      ])
      const rawRecord = rawRecords[0] as Record<string, unknown> | undefined
      if (!rawRecord) {
        setLoading(false)
        return
      }
      pageRecordRef.current = rawRecord

      const thumbFile = extractThumbnail(rawRecord)
      setThumbnailUrl(thumbFile ? pb.files.getUrl(rawRecord, thumbFile) : null)

      const data: BlogPage = {
        id: rawRecord.id as string,
        slug: rawRecord.slug as string,
        title_en: rawRecord.title_en as string,
        title_ar: rawRecord.title_ar as string | undefined,
        category: rawRecord.category as string,
        content_en: rawRecord.content_en as string,
        content_ar: rawRecord.content_ar as string | undefined,
        is_published: rawRecord.is_published as boolean,
        media: (rawRecord.media as string[]) || [],
        thumbnail: thumbFile,
        author_name: (rawRecord.author_name as string) || "",
        created: rawRecord.created as string,
        updated: rawRecord.updated as string,
      }
      setPage(data)
      setEnTitle(data.title_en)
      setArTitle(data.title_ar || "")
      setPostSlug(data.slug)
      setCategory(data.category)
      setEnContent(data.content_en)
      setArContent(data.content_ar || "")
      setIsPublished(data.is_published)
      setAuthorName(data.author_name)
      setCategories(cats)
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Auto-generate slug from English title
    setPostSlug(slugify(enTitle))
  }, [enTitle])

  const handleSave = useCallback(
    async (overrideContent?: string) => {
      if (!page) return
      setSaving(true)
      try {
        const contentField = `content_${activeLang}` as const
        const contentValue = overrideContent !== undefined
          ? overrideContent
          : (activeLang === "en" ? enContent : arContent)
        const updated = await blogPagesCollection.update(page.id, {
          title_en: enTitle,
          title_ar: arTitle,
          slug: postSlug,
          category,
          author_name: authorName,
          [contentField]: contentValue,
        })
        setPage(updated)
        setEnTitle(updated.title_en)
        setArTitle(updated.title_ar || "")
        setEnContent(updated.content_en)
        setArContent(updated.content_ar || "")
        // If slug changed, redirect to new slug
        if (updated.slug !== slug) {
          router.push(`/cms/blog/${updated.slug}`)
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
    [page, enTitle, arTitle, postSlug, category, authorName, enContent, arContent, slug, router, activeLang, lang]
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

  const handleDiscard = useCallback(() => {
    if (!page) return
    setEnTitle(page.title_en)
    setArTitle(page.title_ar || "")
    setPostSlug(page.slug)
    setCategory(page.category)
    setEnContent(page.content_en)
    setArContent(page.content_ar || "")
    setIsPublished(page.is_published)
    setAuthorName(page.author_name)
    setThumbnailUrl(
      page.thumbnail && pageRecordRef.current
        ? pb.files.getUrl(pageRecordRef.current, page.thumbnail)
        : null
    )
    setResetKey(t => t + 1)
  }, [page])

  const togglePublish = useCallback(async () => {
    if (!page) return
    setPublishing(true)
    try {
      const updated = await blogPagesCollection.update(page.id, {
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
      const updated = await blogPagesCollection.updateWithFiles(
        page.id,
        {},
        [file]
      )
      const newMedia = updated.media
      const filename = newMedia[newMedia.length - 1]
      setPage((prev) => (prev ? { ...prev, media: newMedia } : null))
      return pb.files.getUrl(updated, filename)
    },
    [page]
  )

  const handleThumbnailUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !page) return
      setUploadingThumbnail(true)
      try {
        const updated = await blogPagesCollection.updateThumbnail(page.id, file)
        setPage(updated)
        pageRecordRef.current = updated as unknown as Record<string, unknown>
        setThumbnailUrl(pb.files.getUrl(updated as never, updated.thumbnail))
      } catch (err) {
        toast.error(
          t(
            { en: "Failed to upload thumbnail.", ar: "فشل رفع الصورة المصغرة." },
            lang
          ),
          { description: getErrorMessage(err) }
        )
      } finally {
        setUploadingThumbnail(false)
      }
    },
    [page, lang]
  )

  const handleRemoveThumbnail = useCallback(async () => {
    if (!page) return
    try {
      const updated = await blogPagesCollection.removeThumbnail(page.id)
      setPage(updated)
      pageRecordRef.current = updated as unknown as Record<string, unknown>
      setThumbnailUrl(null)
    } catch (err) {
      toast.error(
        t(
          { en: "Failed to remove thumbnail.", ar: "فشل إزالة الصورة المصغرة." },
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
      await blogPagesCollection.delete(page.id)
      router.push("/cms/blog")
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting(false)
    }
  }, [page, router, lang])

  // Category label for the preview, resolved the same way the public
  // /blog/[slug] page resolves it.
  const previewCategoryLabel = (() => {
    const matched = categories.find((c) => c.key === category)
    if (!matched) return category
    return activeLang === "ar" && matched.label_ar ? matched.label_ar : matched.label_en
  })()

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
          href="/cms/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
        <p>{t({ en: "Post not found.", ar: "المنشور غير موجود." }, lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cms/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <BackIcon className="h-4 w-4" />
          {t({ en: "Back", ar: "رجوع" }, lang)}
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t({ en: "Edit Post", ar: "تعديل المنشور" }, lang)}
          </h1>
          <p className="text-muted-foreground">
            {t({ en: "Manage blog post details", ar: "إدارة تفاصيل منشور المدونة" }, lang)}
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <Label htmlFor="category">
            {t({ en: "Category", ar: "التصنيف" }, lang)}
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-72">
              <SelectValue placeholder={t({ en: "Select category", ar: "اختر التصنيف" }, lang)} />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] min-w-[160px]">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.key}>
                  {activeLang === "ar" && cat.label_ar ? cat.label_ar : cat.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">
            {t({ en: "Author", ar: "المؤلف" }, lang)}
          </Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t({ en: "Author name", ar: "اسم المؤلف" }, lang)}
            className="max-w-xs w-72"
          />
        </div>

        <div className="space-y-2">
          <Label>{t({ en: "Thumbnail", ar: "الصورة المصغرة" }, lang)}</Label>
          {thumbnailUrl && (
            <div className="relative mb-2 w-48 overflow-hidden rounded-lg border">
              <Image
                src={thumbnailUrl}
                alt={t({ en: "Thumbnail", ar: "الصورة المصغرة" }, lang)}
                width={192}
                height={108}
                className="h-auto w-full object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute right-1 top-1"
                onClick={handleRemoveThumbnail}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              disabled={uploadingThumbnail}
              className="w-72"
            />
            {uploadingThumbnail && <Loader2 className="h-4 w-4 animate-spin" />}
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
              placeholder={t({ en: "Post title", ar: "عنوان المنشور" }, lang)}
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
            placeholder="عنوان المقال"
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
        path={`/blog/${postSlug}`}
      >
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {previewCategoryLabel && (
              <>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 capitalize">
                  {previewCategoryLabel}
                </span>
                <span>&middot;</span>
              </>
            )}
            {page.created && <span>{formatDate(page.created)}</span>}
            {authorName && (
              <>
                <span>&middot;</span>
                <span>
                  {t({ en: "By", ar: "بقلم" }, lang)} {authorName}
                </span>
              </>
            )}
          </div>
        </div>
      </CmsPreviewDialog>
    </div>
  )
}
