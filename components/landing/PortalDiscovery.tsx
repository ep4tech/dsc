"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import styles from "./discovery.module.css"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { usePortals } from "@/hooks/usePortals"
import { ArrowRight } from "lucide-react"
import { PortalIcon } from "@/components/portal/PortalIcon"
import { ServiceSearch } from "./ServiceSearch"
const SERVICE_DESCRIPTIONS: Record<string, { en: string; ar: string }> = {
  "anxiety-support": {
    en: "Professional guidance for anxiety management",
    ar: "إرشاد متخصص لإدارة القلق",
  },
  "autism-spectrum-disorder": {
    en: "Comprehensive evaluation and personalized support plan",
    ar: "تقييم شامل وخطط دعم مخصصة",
  },
  "curriculum-design": {
    en: "Build modern, effective learning curricula",
    ar: "بناء منهج تعليمي حديث وفعّال",
  },
  "strategic-planning": {
    en: "Organizational strategy and goal alignment",
    ar: "استراتيجية مؤسسية ومواءمة الأهداف",
  },
}

const POPULAR_SERVICES = [
  { portalId: "1", serviceId: "autism-spectrum-disorder" },
  { portalId: "2", serviceId: "anxiety-support" },
  { portalId: "4", serviceId: "curriculum-design" },
  { portalId: "5", serviceId: "strategic-planning" },
]

export function PortalDiscovery() {
  const { lang } = useLang()
  const { portals: PORTALS, isLoading, error, reload } = usePortals()
  const ar = lang === "ar"
  return (
    <section id="support" className={styles.discovery} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              {ar ? "الدعم المناسب لك" : "A path for every possibility"}
            </p>
            <h2>
              {ar
                ? "اختر مجال الدعم الذي تحتاجه"
                : "Choose the support you need."}
            </h2>
          </div>
          <p className={styles.intro}>
            {ar
              ? "خبرة متخصصة للأفراد والأسر والمؤسسات، في كل خطوة من رحلة التطور."
              : "Specialist guidance for individuals, families and organizations. Wherever your journey begins."}
          </p>
        </header>
        <ServiceSearch portals={PORTALS} />
        {isLoading && <p role="status">{ar ? "جارٍ تحميل البوابات…" : "Loading portals…"}</p>}
        {error && <div role="alert"><p>{ar ? "تعذر تحميل البوابات" : "Unable to load portals."}</p><button onClick={() => void reload()}>{ar ? "إعادة المحاولة" : "Retry"}</button></div>}
        {!isLoading && !error && PORTALS.length === 0 && <p>{ar ? "لا توجد بوابات متاحة حالياً." : "No portals are currently available."}</p>}
        <div className={styles.portalGrid}>
          {PORTALS.map((portal, index) => {

            return (
              <article
                key={portal.id}
                className={`${styles.portal} ${portal.picture ? styles.portalWithPicture : ""}`}
                style={{ "--portal-color": portal.accent } as CSSProperties}
              >
                <div className={portal.picture ? styles.pictureTop : styles.portalTop}>
                  {portal.picture ? (
                    <img src={portal.picture} alt="" className={styles.portalPicture} />
                  ) : (
                    <span className={styles.icon}><PortalIcon name={portal.icon} /></span>
                  )}
                  <span className={styles.number}>0{index + 1}</span>
                </div>
                <h3>{t(portal.title, lang)}</h3>
                <p>{t(portal.tagline, lang)}</p>
                <div className={styles.portalActions}>
                <Link href={`/portal/${portal.id}`} className={styles.explore}>
                  {ar ? "استكشف المجال" : "Explore support"}
                  <ArrowRight size={16} />
                </Link>
                </div>
              </article>
            )
          })}
        </div>
        <div className={styles.services}>
          <div className={styles.servicesHeading}>
            <h3>{ar ? "الخدمات الأكثر طلباً" : "Popular services"}</h3>
            <span>{ar ? "ابدأ بما يهمك" : "A good place to start"}</span>
          </div>
          <div className={styles.serviceGrid}>
            {POPULAR_SERVICES.map((item) => {
              const portal = PORTALS.find((p) => p.id === item.portalId)
              const service = portal?.services.find(
                (s) => s.id === item.serviceId
              )
              const desc = SERVICE_DESCRIPTIONS[item.serviceId]
              if (!portal || !service) return null

              return (
                <Link
                  key={item.serviceId}
                  href={`/portal/${portal.id}`}
                  className={styles.service}
                  style={{ "--portal-color": portal.accent } as CSSProperties}
                >
                  <span className={styles.serviceIcon}>
                    <PortalIcon name={portal.icon} size={19} />
                  </span>
                  <h4>{t(service.name, lang)}</h4>
                  <p>{desc ? t(desc, lang) : ""}</p>
                  <span className={styles.book}>
                    {ar ? "احجز الآن" : "Book now"}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
