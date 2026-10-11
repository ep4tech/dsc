import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import pb from "@/lib/pb"
import { localizedField, t } from "@/lib/i18n"
import type { InfoPage } from "@/types/cms"
import type { Lang } from "@/types/form"
import "suneditor/css/contents"
import { getPortalById } from "@/lib/portal-data"
import { PortalJourneyButton } from "@/components/portal/PortalJourneyButton"
import { CmsContent } from "@/components/cms/CmsContent"

interface InfoPageProps {
  params: Promise<{ id: string }>
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const lang = (cookieStore.get("lang")?.value as Lang) || "en"
  let record: Record<string, unknown> | null = null
  try {
    record = await pb
      .collection("info_pages")
      .getFirstListItem(pb.filter("slug = {:value0}", { value0: id }))
  } catch {
    // Record not found
  }

  const page = record as InfoPage | null
  const isPublished = !!page?.is_published
  const portalId = page?.portal_name
  const infoPortal = portalId ? await getPortalById(portalId) : undefined
  const backHref = portalId ? `/portal/${portalId}` : "/"
  const title = page ? localizedField(page, lang, "title") : ""
  const displayTitle = title || id.replace(/-/g, " ")

  if (record && page && isPublished) {
    const iconFile = page.icon
    const iconUrl = iconFile ? pb.files.getUrl(record, iconFile) : null

    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href={backHref}
          className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
        >
          {t(
            { en: "\u2190 Back", ar: "\u0631\u062C\u0648\u0639 \u2192" },
            lang
          )}
        </Link>
        {iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            className="mb-6 h-16 w-16 rounded-xl object-contain"
          />
        )}
        <h1 className="mb-8 text-3xl font-bold capitalize">{displayTitle}</h1>
        <CmsContent html={localizedField(page, lang, "content")} lang={lang} />

        <div className="tet">
          {infoPortal && (
            <PortalJourneyButton
              portalId={infoPortal.id}
              registrationType={infoPortal.registrationType}
              label={infoPortal.ctaLabel}
              className="px-4 py-3 text-xs font-semibold shadow-lg lg:px-8 lg:py-6 lg:text-base"
              style={{ backgroundColor: infoPortal.accent, color: "#fff" }}
            />
          )}
        </div>
      </div>
    )
  }

  // Not published or missing → show the 404 page
  notFound()
}
