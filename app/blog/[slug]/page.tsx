import { boundedFullList } from "@/lib/bounded-records"
import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import pb from "@/lib/pb"
import { localizedField, t } from "@/lib/i18n"
import { formatDate } from "@/lib/format-date"
import type { BlogPage, BlogCategory } from "@/types/cms"
import type { Lang } from "@/types/form"
import "suneditor/css/contents"

import { CmsContent } from "@/components/cms/CmsContent"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const cookieStore = await cookies()
  const lang = (cookieStore.get("lang")?.value as Lang) || "en"

  let page: BlogPage | null = null
  let categoryLabel = ""

  try {
    const [catRecords, record] = await Promise.all([
      boundedFullList(pb.collection("blog_categories")),
      pb
        .collection("blog_pages")
        .getFirstListItem(pb.filter("slug = {:value0} && is_published = true", { value0: slug })),
    ])
    const catMap = new Map<string, BlogCategory>()
    for (const c of catRecords) {
      catMap.set(c.key as string, {
        id: c.id as string,
        key: c.key as string,
        label_en: c.label_en as string,
        label_ar: c.label_ar as string | undefined,
      })
    }
    const rawCategory = record.category as string
    const matched = catMap.get(rawCategory)
    categoryLabel = matched
      ? lang === "ar" && matched.label_ar
        ? matched.label_ar
        : matched.label_en
      : rawCategory
    page = {
      id: record.id as string,
      slug: record.slug as string,
      title_en: record.title_en as string,
      title_ar: record.title_ar as string | undefined,
      category: rawCategory,
      content_en: record.content_en as string,
      content_ar: record.content_ar as string | undefined,
      is_published: record.is_published as boolean,
      media: (record.media as string[]) || [],
      thumbnail: "",
      author_name: (record.author_name as string) || "",
      created: record.created as string,
      updated: record.updated as string,
    }
  } catch {
    // Record not found or not published
  }

  if (!page) {
    notFound()
  }

  return (
    <div
      className={`mx-auto ${lang === "ar" ? "mr-60" : "ml-60"} max-w-4xl px-6 py-12`}
    >
      <Link
        href="/blog"
        className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        &larr; {t({ en: "Blog", ar: "المدونة" }, lang)}
      </Link>

      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 capitalize">
            {categoryLabel}
          </span>
          <span>&middot;</span>
          <span>{formatDate(page.created)}</span>
          {page.author_name && (
            <>
              <span>&middot;</span>
              <span>
                {t({ en: "By", ar: "بقلم" }, lang)} {page.author_name}
              </span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold">
          {localizedField(page, lang, "title")}
        </h1>
      </div>

      <CmsContent
        html={localizedField(page, lang, "content")}
        lang={lang}
      />
    </div>
  )
}
