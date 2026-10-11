"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  UsersRound,
} from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { SITE_CONTENT } from "@/lib/site-content"
import { FOUNDER } from "@/components/team/TeamData"
import { specializationLabel } from "@/components/team/team-labels"
import type { TeamExpert } from "@/types/team"
import styles from "./home.module.css"

function ExpertPortrait({ expert }: { expert: TeamExpert }) {
  const [failed, setFailed] = useState(false)
  const initials = expert.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
  const hue =
    Array.from(expert.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    360
  return (
    <div
      className={styles.expertPortrait}
      style={{ backgroundColor: `hsl(${hue} 24% 27%)` }}
    >
      {expert.photoUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={expert.photoUrl}
          alt={expert.name}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.initials} aria-label={expert.name}>
          <span>{initials || "DSC"}</span>
          <span>{expert.name}</span>
        </div>
      )}
    </div>
  )
}

export function HeroSection({ experts }: { experts: TeamExpert[] }) {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [index, setIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [playPreference, setPlayPreference] = useState<boolean | null>(null)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [visible, setVisible] = useState(true)
  const activeIndex = experts.length ? index % experts.length : 0
  const activeExpert = experts[activeIndex]
  const expert = activeExpert
    ? {
        ...activeExpert,
        name:
          (ar ? activeExpert.publicNameAr : activeExpert.publicNameEn) ||
          activeExpert.name,
      }
    : undefined
  const qualification = expert
    ? (ar ? expert.publicQualificationAr : expert.publicQualificationEn) ||
      expert.fieldOfStudy ||
      ""
    : ""
  const specialty = expert
    ? (ar ? expert.publicSpecialtyAr : expert.publicSpecialtyEn) ||
      expert.roles.map((role) => specializationLabel(role, lang)).join(" · ")
    : ""
  const wantsToPlay = playPreference ?? !reducedMotion
  const rotating = experts.length > 1 && wantsToPlay && visible

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(media.matches || document.documentElement.classList.contains("reading-motion"))
    const syncVisibility = () => setVisible(!document.hidden)
    syncMotion()
    syncVisibility()
    media.addEventListener("change", syncMotion)
    window.addEventListener("dsc-readability-changed", syncMotion)
    document.addEventListener("visibilitychange", syncVisibility)
    return () => {
      media.removeEventListener("change", syncMotion)
      window.removeEventListener("dsc-readability-changed", syncMotion)
      document.removeEventListener("visibilitychange", syncVisibility)
    }
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % experts.length)
      setCycle((value) => value + 1)
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [rotating, experts.length, cycle])

  function move(direction: number) {
    setIndex((value) => (value + direction + experts.length) % experts.length)
    setCycle((value) => value + 1)
  }

  return (
    <section className={styles.hero} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.heroInner}>
        <div className={styles.introduction}>
          <div className={styles.brandLine}>
            <div className={styles.orbitLogo}>
              <Image
                src="/logo.svg"
                alt="DSC"
                width={90}
                height={90}
                priority
              />
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={styles.orbitDot}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span>
              {ar
                ? "معرفة متخصصة. أثر يدوم."
                : "Expert knowledge. Lasting impact."}
            </span>
          </div>
          <div className={styles.headingCopy}>
            <h1>
              {ar ? (
                SITE_CONTENT.hero.headline.ar
              ) : (
                <>
                  Development Secrets{" "}
                  <span>
                    Consultancy<span className={styles.acronym}> (DSC)</span>
                  </span>
                </>
              )}
            </h1>
            <p>{SITE_CONTENT.hero.subheadline[lang]}</p>
          </div>
          <article className={styles.founder}>
            <Image
              className={styles.founderPortrait}
              src={FOUNDER.photo}
              alt={FOUNDER.name[lang]}
              width={116}
              height={145}
              priority
            />
            <div className={styles.founderCopy}>
              <p className={styles.eyebrow}>{FOUNDER.role[lang]}</p>
              <h2>{FOUNDER.name[lang]}</h2>
              <p className={styles.biography}>
                {ar
                  ? "خبرة أكاديمية ومهنية في التربية الخاصة والتقييم النفسي والتربوي والتدخل القائم على الأدلة."
                  : "Academic and professional expertise in special education, psychological and educational assessment, and evidence-based intervention."}
              </p>
            </div>
          </article>
        </div>
        <section
          className={styles.team}
          aria-roledescription={ar ? "عرض شرائح" : "carousel"}
          aria-label={ar ? "فريقنا" : "Our Team"}
        >
          <div className={styles.teamHeading}>
            <div>
              <h2>{ar ? "تعرف على خبرائنا" : "Meet our experts"}</h2>
            </div>
            <UsersRound size={25} aria-hidden="true" />
          </div>
          <div
            className={styles.slide}
            aria-live={rotating ? "off" : "polite"}
            aria-atomic="true"
          >
            {expert ? (
              <article
                key={expert.id}
                className={styles.expertCard}
                aria-roledescription={ar ? "شريحة" : "slide"}
                aria-label={`${activeIndex + 1} / ${experts.length}`}
              >
                <ExpertPortrait expert={expert} />
                <div className={styles.expertCopy}>
                  <span className={styles.expertTag}>
                    {ar ? "فريق DSC" : "DSC EXPERT"}
                  </span>
                  <h3>{expert.name}</h3>
                  {qualification && (
                    <p className={styles.qualification}>{qualification}</p>
                  )}
                  {specialty && (
                    <p className={styles.shortBiography}>{specialty}</p>
                  )}
                  {(ar ? expert.shortBioAr : expert.shortBioEn) && (
                    <p className={styles.shortBiography}>
                      {ar ? expert.shortBioAr : expert.shortBioEn}
                    </p>
                  )}
                </div>
              </article>
            ) : (
              <div className={styles.empty}>
                <UsersRound size={52} aria-hidden="true" />
                <h3>
                  {ar
                    ? "معاً، نحو إمكانات أكبر"
                    : "Together, towards greater potential"}
                </h3>
                <p>
                  {ar
                    ? "فريق الخبراء قيد الاستكمال. يرجى العودة لاحقاً."
                    : "Our team of experts is being finalised. Please check back soon."}
                </p>
              </div>
            )}
          </div>
          {experts.length > 1 && (
            <div className={styles.carouselFooter}>
              <div className={styles.carouselControls}>
                <button
                  className={styles.arrowControl}
                  onClick={() => move(-1)}
                  aria-label={ar ? "الخبير السابق" : "Previous expert"}
                >
                  {ar ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                <span className={styles.counter} dir="ltr">
                  <strong>{String(activeIndex + 1).padStart(2, "0")}</strong> /{" "}
                  {String(experts.length).padStart(2, "0")}
                </span>
                <button
                  className={styles.arrowControl}
                  onClick={() => move(1)}
                  aria-label={ar ? "الخبير التالي" : "Next expert"}
                >
                  {ar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
                <button
                  className={styles.playControl}
                  onClick={() => {
                    setPlayPreference(!wantsToPlay)
                    setCycle((value) => value + 1)
                  }}
                  aria-label={
                    wantsToPlay
                      ? ar
                        ? "إيقاف العرض التلقائي"
                        : "Pause automatic rotation"
                      : ar
                        ? "تشغيل العرض التلقائي"
                        : "Resume automatic rotation"
                  }
                >
                  {wantsToPlay ? <Pause size={14} /> : <Play size={14} />}{" "}
                  {wantsToPlay
                    ? ar
                      ? "إيقاف"
                      : "Pause"
                    : ar
                      ? "تشغيل"
                      : "Play"}
                </button>
                <span className={styles.playStatus}>
                  {rotating
                    ? ar
                      ? "عرض تلقائي"
                      : "Playing"
                    : ar
                      ? "متوقف"
                      : "Paused"}
                </span>
              </div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span
                  key={`${cycle}-${rotating}`}
                  className={rotating ? styles.progressPlaying : undefined}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
