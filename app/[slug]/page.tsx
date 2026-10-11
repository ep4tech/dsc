import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import pb from "@/lib/pb"
import { localizedField, t } from "@/lib/i18n"
import { PAGE_TITLES } from "@/lib/site-content"
import type { HomePage } from "@/types/cms"
import type { Lang } from "@/types/form"
import "suneditor/css/contents"

import { CmsContent } from "@/components/cms/CmsContent"

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params
  const cookieStore = await cookies()
  const lang = (cookieStore.get("lang")?.value as Lang) || "en"

  const pageTitle = PAGE_TITLES[slug]

  let page: HomePage | null = null

  try {
    const record = await pb
      .collection("home_pages")
      .getFirstListItem(pb.filter("slug = {:value0} && is_published = true", { value0: slug }))
    page = record as unknown as HomePage
  } catch {
    // Page not found or not published
  }

  if (!page) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        &larr; {lang === "ar" ? "الرئيسية" : "Home"}
      </Link>

      <h1 className="mb-8 text-3xl font-bold capitalize">
        {lang === "ar" && !page.title_ar && pageTitle
          ? t(pageTitle, lang)
          : localizedField(page, lang, "title")}
      </h1>

      <CmsContent
        html={localizedField(page, lang, "content")}
        lang={lang}
      />
    </div>
  )
}
