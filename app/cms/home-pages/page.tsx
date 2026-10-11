"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useEffect, useState } from "react"
import Link from "next/link"
import { homePagesCollection } from "@/lib/pb-collections"
import { formatDate } from "@/lib/format-date"
import { HomePage } from "@/types/cms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Loader2, Plus, Pencil, Lock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import pb, { getErrorMessage } from "@/lib/pb"
import { useAuth } from "@/hooks/useAuth"
import { t, UI_STRINGS } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"

export default function CmsHomePagesListPage() {
  const { lang } = useLang()
  const { isSuperAdmin } = useAuth()
  const [pages, setPages] = useState<HomePage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [creatingPage, setCreatingPage] = useState(false)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = () => {
    setLoading(true)
    boundedFullList(pb.collection("home_pages"))
      .then((data) => {
        setPages(data as unknown as HomePage[])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleCreate = async () => {
    if (!newSlug.trim() || !newTitle.trim()) return
    setCreatingPage(true)
    try {
      await homePagesCollection.create({
        slug: newSlug.trim(),
        title: newTitle.trim(),
      })
      setNewSlug("")
      setNewTitle("")
      setShowCreate(false)
      loadPages()
    } catch (err) {
      toast.error(
        t(
          { en: "Failed to create page. Slug must be unique.", ar: "فشل إنشاء الصفحة. يجب أن يكون المعرف (slug) فريداً." },
          lang
        ),
        { description: getErrorMessage(err) }
      )
    } finally {
      setCreatingPage(false)
    }
  }

  const togglePublish = async (page: HomePage) => {
    try {
      const updated = await homePagesCollection.update(page.id, {
        is_published: !page.is_published,
      })
      setPages((prev) => prev.map((p) => (p.id === page.id ? updated : p)))
    } catch (err) {
      toast.error(
        t(
          { en: "Failed to update status.", ar: "فشل تحديث الحالة." },
          lang
        ),
        { description: getErrorMessage(err) }
      )
    }
  }

  const handleDelete = async (page: HomePage) => {
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
    try {
      await homePagesCollection.delete(page.id)
      setPages((prev) => prev.filter((p) => p.id !== page.id))
    } catch (err) {
      toast.error(
        t(
          { en: "Failed to delete page.", ar: "فشل حذف الصفحة." },
          lang
        ),
        { description: getErrorMessage(err) }
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t({ en: "Home Pages", ar: "صفحات رئيسية" }, lang)}
          </h1>
          <p className="text-muted-foreground">
            {t(
              {
                en: "Manage About Us, Contact Us, and other site pages",
                ar: "إدارة صفحات من نحن وتواصل معنا وصفحات الموقع الأخرى",
              },
              lang
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button variant="outline" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-2 h-4 w-4" />
              {t({ en: "New Page", ar: "صفحة جديدة" }, lang)}
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && showCreate && (
        <div className="rounded-md border bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">
                {t({ en: "URL Slug", ar: "معرف الرابط (Slug)" }, lang)}
              </Label>
              <Input
                id="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder={t({ en: "e.g., about, contact, privacy", ar: "مثال: about، contact، privacy" }, lang)}
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  { en: "This will be the URL: /", ar: "سيكون الرابط: /" },
                  lang
                )}
                {newSlug || "slug"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">
                {t({ en: "Page Title", ar: "عنوان الصفحة" }, lang)}
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t({ en: "e.g., About Us", ar: "مثال: من نحن" }, lang)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t(UI_STRINGS.cancel, lang)}
            </Button>
            <Button onClick={handleCreate} disabled={creatingPage || !newSlug.trim() || !newTitle.trim()}>
              {creatingPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t({ en: "Create Page", ar: "إنشاء الصفحة" }, lang)}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {t({ en: "No pages yet.", ar: "لا توجد صفحات بعد." }, lang)}
          </p>
          {isSuperAdmin && (
            <Button onClick={() => setShowCreate(true)} className="mt-4">
              {t({ en: "Create your first page", ar: "أنشئ صفحتك الأولى" }, lang)}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ en: "Title", ar: "العنوان" }, lang)}</TableHead>
                <TableHead>{t({ en: "Last Updated", ar: "آخر تحديث" }, lang)}</TableHead>
                <TableHead>{t({ en: "Status", ar: "الحالة" }, lang)}</TableHead>
                <TableHead className="w-24">
                  {t({ en: "Actions", ar: "إجراءات" }, lang)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title_en}</TableCell>
                  <TableCell>{formatDate(page.updated)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => togglePublish(page)}
                      className="flex items-center gap-1"
                    >
                      {page.is_published ? (
                        <Badge className="bg-green-600 text-white">
                          <Eye className="mr-1 h-3 w-3" />
                          {t(UI_STRINGS.published, lang)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Lock className="mr-1 h-3 w-3" />
                          {t(UI_STRINGS.draft, lang)}
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/cms/home-pages/${page.slug}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(page)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      {page.is_published && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Eye className="h-4 w-4 text-green-600" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
