import { boundedFullList } from "@/lib/bounded-records"
import pb from "@/lib/pb"
import type { Portal } from "@/lib/portals"
import type { RecordModel } from "pocketbase"

export function portalFromRecord(record: RecordModel): Portal {
  const config = (record.config || {}) as Partial<Portal>
  const title = { en: record.title_en as string, ar: record.title_ar as string }
  const description = {
    en: record.description_en as string,
    ar: record.description_ar as string,
  }
  const picture = record.picture ? pb.files.getURL(record, record.picture) : ""
  return {
    id: record.portal_key,
    recordId: record.id,
    title,
    portalName: title,
    tagline: description,
    heroTitle: config.heroTitle || title,
    heroText: config.heroText || description,
    philosophy: config.philosophy || description,
    ctaLabel: config.ctaLabel || { en: "Start your journey", ar: "ابدأ رحلتك" },
    ctaHref: "/register",
    accent: record.accent,
    secondary: config.secondary || "#0f3090",
    image: picture || config.image || "/portals/portal-1.jpg",
    banner: picture || config.banner || "/banners/banner-1.png",
    menu: config.menu || [],
    services: config.services || [],
    icon: record.icon,
    picture,
    isDeleted: record.is_deleted,
    order: record.order,
    registrationType: record.registration_type,
  }
}
export async function getPortals(includeDeleted = false): Promise<Portal[]> {
  const rows = await boundedFullList(pb
    .collection("portals"), {
      sort: "order,created",
      filter: includeDeleted ? "" : "is_deleted=false",
      requestKey: null,
    })
  return rows.map(portalFromRecord)
}
export async function getPortalById(id: string): Promise<Portal | undefined> {
  const rows = await pb
    .collection("portals")
    .getList(1, 1, {
      filter: pb.filter("portal_key={:id} && is_deleted=false", { id }),
      requestKey: null,
    })
  return rows.items[0] ? portalFromRecord(rows.items[0]) : undefined
}
