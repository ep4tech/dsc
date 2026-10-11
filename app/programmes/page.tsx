"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Grid2X2,
  MapPin,
  Monitor,
  Search,
  Tag,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { publicLecturesPublicCollection } from "@/lib/pb-lectures"
import { trainingProgramsCollection } from "@/lib/pb-training"
import type { Lecture } from "@/types/lecture"
import type { TrainingProgram } from "@/types/training"
import { dayKey, parseDate, overlaps, eventStatus } from "@/lib/event-dates"
import styles from "./events.module.css"

type Event = {
  id: string
  kind: "lecture" | "training"
  title: string
  presenter: string
  description: string
  category: string
  categoryKey: string
  presenterKey: string
  location: string
  mode: string
  start: Date
  end: Date
  duration: number
  image?: string
  capacity?: number
  registered: number
  completed: boolean
}

export default function ProgrammesPage() {
  const { lang } = useLang()
  const ar = lang === "ar"
  const t = (en: string, arabic: string) => (ar ? arabic : en)
  const locale = ar ? "ar-JO" : "en-GB"
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState("")
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [day, setDay] = useState("")
  const [filters, setFilters] = useState({
    kind: "",
    status: "",
    mode: "",
    category: "",
    presenter: "",
    location: "",
    from: "",
    to: "",
  })
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(false)
      try {
        const [ls, ps] = await Promise.all([
          publicLecturesPublicCollection.getAll(),
          trainingProgramsCollection.getPubliclyVisible(),
        ])
        if (active) {
          setLectures(
            ls.filter((l) => l.status !== "draft" && l.status !== "cancelled")
          )
          setPrograms(
            ps.filter((p) => p.status !== "draft" && p.status !== "cancelled")
          )
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [retry])
  const events = useMemo<Event[]>(() => {
    const text = (s: { en: string; ar: string }) =>
      s[lang] || s.en || s.ar || ""
    return [
      ...lectures.map((l) => ({
        id: l.id,
        kind: "lecture" as const,
        title: text(l.title),
        presenter: text(l.speaker.name),
        description: text(l.description),
        category: "",
        categoryKey: "",
        presenterKey: l.speaker.name.en || l.speaker.name.ar,
        location: l.schedule.location,
        mode: "",
        start: parseDate(l.schedule.dateTime),
        end: new Date(
          parseDate(l.schedule.dateTime).getTime() + l.duration * 60000
        ),
        duration: l.duration,
        image: l.thumbnail,
        registered: l.currentRegistrations,
        completed: l.status === "completed",
      })),
      ...programs.map((p) => ({
        id: p.id,
        kind: "training" as const,
        title: text(p.title),
        presenter: text(p.trainer.name),
        description: "",
        category: text(p.category),
        categoryKey: p.category.en || p.category.ar,
        presenterKey: p.trainer.name.en || p.trainer.name.ar,
        location: p.location,
        mode: p.type,
        start: parseDate(p.schedule.startDate),
        end: parseDate(p.schedule.endDate, true),
        duration: p.duration,
        image: p.thumbnail,
        capacity: p.maxParticipants,
        registered: p.currentRegistrations,
        completed: p.status === "completed",
      })),
    ]
      .filter(
        (e) =>
          Number.isFinite(e.start.getTime()) && Number.isFinite(e.end.getTime())
      )
      .sort((a, b) => {
        const pastA = a.completed || a.end.getTime() < now,
          pastB = b.completed || b.end.getTime() < now
        return pastA !== pastB
          ? pastA
            ? 1
            : -1
          : pastA
            ? b.start.getTime() - a.start.getTime()
            : a.start.getTime() - b.start.getTime()
      })
  }, [lectures, programs, lang, now])
  const status = (e: Event) => eventStatus(e, now)
  const statusLabel = (s: string) =>
    s === "past"
      ? t("Past", "انتهى")
      : s === "upcoming"
        ? t("Upcoming", "قادم")
        : t("In progress", "قيد التنفيذ")
  const modeLabel = (s: string) =>
    s === "online"
      ? t("Online", "عبر الإنترنت")
      : s === "hybrid"
        ? t("Hybrid", "مختلط")
        : t("In person", "حضوري")
  const typeEvents = events.filter(
    (event) => !filters.kind || event.kind === filters.kind
  )
  const statusOptions = ["upcoming", "in_progress", "past"]
    .filter((value) => typeEvents.some((event) => status(event) === value))
    .map((value) => ({ value, label: statusLabel(value) }))
  const modeOptions = ["online", "in_person", "hybrid"]
    .filter((value) => typeEvents.some((event) => event.mode === value))
    .map((value) => ({ value, label: modeLabel(value) }))
  const presenterLabel =
    filters.kind === "lecture"
      ? t("Speaker", "المحاضر")
      : filters.kind === "training"
        ? t("Trainer", "المدرب")
        : t("Trainer / Speaker", "المدرب / المحاضر")

  function changeEventType(kind: string) {
    const available = events.filter((event) => !kind || event.kind === kind)
    setFilters((previous) => {
      const next = { ...previous, kind }
      const values: Record<
        "status" | "mode" | "category" | "presenter" | "location",
        string[]
      > = {
        status: available.map(status),
        mode: available.map((event) => event.mode),
        category: available.map((event) => event.categoryKey),
        presenter: available.map((event) => event.presenterKey),
        location: available.map((event) => event.location),
      }
      for (const key of Object.keys(values) as (keyof typeof values)[]) {
        if (!values[key].includes(previous[key])) next[key] = ""
      }
      // Preserve a date range only when it still includes this event type.
      if (
        (previous.from || previous.to) &&
        !available.some(
          (event) =>
            (!previous.from || dayKey(event.end) >= previous.from) &&
            (!previous.to || dayKey(event.start) <= previous.to)
        )
      ) {
        next.from = ""
        next.to = ""
      }
      return next
    })
    setDay((previous) =>
      !previous || available.some((event) => overlaps(event, previous))
        ? previous
        : ""
    )
  }
  const filtered = events.filter(
    (e) =>
      (!query ||
        [e.title, e.presenter, e.description, e.category, e.location]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase().trim())) &&
      (!filters.kind || e.kind === filters.kind) &&
      (!filters.status || status(e) === filters.status) &&
      (!filters.mode || e.mode === filters.mode) &&
      (!filters.category || e.categoryKey === filters.category) &&
      (!filters.presenter || e.presenterKey === filters.presenter) &&
      (!filters.location || e.location === filters.location) &&
      (!filters.from || dayKey(e.end) >= filters.from) &&
      (!filters.to || dayKey(e.start) <= filters.to)
  )
  const visible = filtered.filter((e) => !day || overlaps(e, day))
  const activeFilters = !!query || !!day || Object.values(filters).some(Boolean)
  const reset = () => {
    setQuery("")
    setDay("")
    setFilters({
      kind: "",
      status: "",
      mode: "",
      category: "",
      presenter: "",
      location: "",
      from: "",
      to: "",
    })
  }
  const dateLabel = (date: Date) =>
    date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  const calendarStart = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - month.getDay()
  )
  const days = Array.from(
    { length: 42 },
    (_, i) =>
      new Date(
        calendarStart.getFullYear(),
        calendarStart.getMonth(),
        calendarStart.getDate() + i
      )
  )
  const unique = (key: "category" | "presenter" | "location") =>
    [
      ...new Map(
        typeEvents
          .filter((e) => e[key])
          .map((e) => [
            key === "location" ? e.location : e[`${key}Key`],
            e[key],
          ])
      ).entries(),
    ]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  function card(e: Event) {
    return (
      <article
        className={`${styles.card} ${e.kind === "lecture" ? styles.lecture : ""}`}
        key={`${e.kind}-${e.id}`}
      >
        <div className={styles.photo}>
          {/* CMS images can use arbitrary PocketBase hosts. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.image || "/images/events/event-placeholder.jpg"}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = "/images/events/event-placeholder.jpg"
            }}
          />
          <div className={styles.badges}>
            {e.mode && (
              <span
                className={e.mode === "online" ? styles.online : styles.mode}
              >
                {modeLabel(e.mode)}
              </span>
            )}
            <span>{statusLabel(status(e))}</span>
          </div>
        </div>
        <div className={styles.cardBody}>
          <h3>{e.title}</h3>
          <p className={styles.presenter}>
            {e.kind === "training" && `${t("Trainer", "المدرب")}: `}
            {e.presenter}
          </p>
          <div className={styles.metadata}>
            <span>
              <CalendarDays />
              {dateLabel(e.start)}
              {e.kind === "training" &&
                dayKey(e.start) !== dayKey(e.end) &&
                ` – ${dateLabel(e.end)}`}
            </span>
            <span>
              <Clock />
              {e.kind === "lecture"
                ? `${e.start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} · ${e.duration} ${t("min", "دقيقة")}`
                : `${e.duration} ${t("days", "أيام")}`}
            </span>
            {e.location && (
              <span>
                <MapPin />
                {e.location}
              </span>
            )}
            {!!e.capacity && (
              <span>
                <Users />
                {t("Spots left", "المقاعد المتبقية")}:{" "}
                {Math.max(0, e.capacity - e.registered)} / {e.capacity}
              </span>
            )}
            {e.category && (
              <span>
                <BookOpen />
                {e.category}
              </span>
            )}
          </div>
          {e.description && (
            <p className={styles.description}>{e.description}</p>
          )}
          <Link
            className={styles.details}
            href={`/programmes/${e.kind === "lecture" ? "public_lectures" : "training_programmes"}/${e.id}`}
          >
            {t("View Details", "عرض التفاصيل")}
            <ArrowRight />
          </Link>
        </div>
      </article>
    )
  }
  function section(title: string, items: Event[], href: string) {
    return (
      <section className={styles.panel}>
        <header className={styles.sectionHeader}>
          <h2>
            <GraduationCap />
            {title}
          </h2>
          <Link href={href}>
            {t("View All", "عرض الكل")}
            <ChevronRight />
          </Link>
        </header>
        {items.length ? (
          <div
            className={
              items[0].kind === "lecture" ? styles.lectureList : styles.cardGrid
            }
          >
            {items.map(card)}
          </div>
        ) : (
          <p className={styles.empty}>
            {activeFilters
              ? href.includes("public_lectures")
                ? t(
                    "No lectures match your selection.",
                    "لا توجد محاضرات تطابق اختيارك."
                  )
                : t(
                    "No training programmes match your selection.",
                    "لا توجد برامج تدريبية تطابق اختيارك."
                  )
              : href.includes("public_lectures")
                ? t(
                    "New lectures will be announced here soon.",
                    "سيتم الإعلان عن محاضرات جديدة هنا قريباً."
                  )
                : t(
                    "New training programmes will be announced here soon.",
                    "سيتم الإعلان عن برامج تدريبية جديدة هنا قريباً."
                  )}
          </p>
        )}
      </section>
    )
  }
  function selectFilter(
    key: "kind" | "status" | "mode" | "category" | "presenter" | "location",
    title: string,
    icon: React.ReactNode,
    options: { value: string; label: string }[]
  ) {
    return (
      <details className={styles.filter} key={key}>
        <summary>
          {icon}
          <span>
            {title}
            {filters[key] && (
              <small>
                {" "}
                · {options.find((o) => o.value === filters[key])?.label}
              </small>
            )}
          </span>
          <ChevronRight />
        </summary>
        <label className={styles.filterInput}>
          <span className={styles.srOnly}>{title}</span>
          <select
            value={filters[key]}
            disabled={options.length === 0}
            onChange={(e) =>
              key === "kind"
                ? changeEventType(e.target.value)
                : setFilters((f) => ({ ...f, [key]: e.target.value }))
            }
          >
            <option value="">{t("All", "الكل")}</option>
            {options.map((o) => (
              <option value={o.value} key={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </details>
    )
  }
  return (
    <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <section className={styles.hero}>
        <div>
          <h1>{t("Events", "الفعاليات")}</h1>
          <p>{t("Browse all our events", "استعرض جميع فعالياتنا")}</p>
        </div>
      </section>
      <div className={styles.layout}>
        <div className={styles.main}>
          {loading ? (
            <div className={`${styles.panel} ${styles.loading}`} role="status">
              {t("Loading events…", "جارٍ تحميل الفعاليات…")}
            </div>
          ) : error ? (
            <div className={`${styles.panel} ${styles.empty}`} role="alert">
              <h2>{t("Unable to load events", "تعذر تحميل الفعاليات")}</h2>
              <p>
                {t(
                  "Please try again in a moment.",
                  "يرجى المحاولة مرة أخرى بعد قليل."
                )}
              </p>
              <button
                className={styles.details}
                onClick={() => setRetry((r) => r + 1)}
              >
                {t("Try again", "حاول مجدداً")}
              </button>
            </div>
          ) : (
            <>
              {activeFilters && (
                <div className={styles.results} aria-live="polite">
                  <span>
                    {visible.length} {t("events found", "فعالية")}
                    {day && ` · ${dateLabel(parseDate(day))}`}
                  </span>
                  <button onClick={reset}>
                    <X />
                    {t("Clear filters", "مسح الفلاتر")}
                  </button>
                </div>
              )}
              {filters.kind !== "training" &&
                section(
                  t("Public Lectures", "المحاضرات العامة"),
                  visible.filter((e) => e.kind === "lecture"),
                  "/programmes/public_lectures"
                )}
              {filters.kind !== "lecture" &&
                section(
                  t("Training Programmes", "البرامج التدريبية"),
                  visible.filter((e) => e.kind === "training"),
                  "/programmes/training_programmes"
                )}
            </>
          )}
        </div>
        <aside
          className={styles.sidebar}
          aria-label={t("Find events", "البحث عن الفعاليات")}
        >
          <section className={`${styles.panel} ${styles.calendar}`}>
            <h2>
              <CalendarDays />
              {t("Event Calendar", "تقويم الفعاليات")}
            </h2>
            <div className={styles.monthNav}>
              <button
                aria-label={t("Previous month", "الشهر السابق")}
                onClick={() =>
                  setMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeft />
              </button>
              <strong aria-live="polite">
                {month.toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <button
                aria-label={t("Next month", "الشهر التالي")}
                onClick={() =>
                  setMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRight />
              </button>
            </div>
            <div className={styles.calendarGrid} dir="ltr">
              {Array.from({ length: 7 }, (_, i) => (
                <span className={styles.weekday} key={i}>
                  {new Date(2026, 0, 4 + i).toLocaleDateString(locale, {
                    weekday: "short",
                  })}
                </span>
              ))}
              {days.map((d) => {
                const key = dayKey(d)
                const matches = filtered.filter((e) => overlaps(e, key))
                return (
                  <button
                    key={key}
                    className={`${styles.day} ${d.getMonth() !== month.getMonth() ? styles.outside : ""} ${day === key ? styles.selected : ""} ${key === dayKey(new Date(now)) ? styles.today : ""}`}
                    aria-label={`${d.toLocaleDateString(locale, { dateStyle: "full" })}, ${matches.length} ${t("events", "فعاليات")}`}
                    aria-pressed={day === key}
                    onClick={() =>
                      setDay((current) => (current === key ? "" : key))
                    }
                  >
                    <span>{d.getDate()}</span>
                    <span className={styles.dots}>
                      {matches.some((e) => e.kind === "training") && <i />}
                      {matches.some((e) => e.kind === "lecture") && <i />}
                    </span>
                  </button>
                )
              })}
            </div>
            {day && (
              <button className={styles.clearDay} onClick={() => setDay("")}>
                {t("Clear selected date", "إلغاء تحديد التاريخ")}
                <X />
              </button>
            )}
          </section>
          <section className={`${styles.panel} ${styles.searchPanel}`}>
            <h2>
              <label htmlFor="events-search">
                {t("Search Events", "البحث في الفعاليات")}
              </label>
            </h2>
            <form
              className={styles.search}
              onSubmit={(e) => e.preventDefault()}
            >
              <Search />
              <input
                id="events-search"
                type="search"
                value={query}
                placeholder={
                  filters.kind === "lecture"
                    ? t(
                        "Search by title, keyword, speaker…",
                        "ابحث بالعنوان أو الكلمة أو المحاضر…"
                      )
                    : t(
                        "Search by title, keyword, trainer…",
                        "ابحث بالعنوان أو الكلمة أو المدرب…"
                      )
                }
                onChange={(e) => setQuery(e.target.value)}
              />
              <button aria-label={t("Search", "بحث")}>
                <Search />
              </button>
            </form>
          </section>
          <section className={`${styles.panel} ${styles.filters}`}>
            <h2>{t("Filter Events", "تصفية الفعاليات")}</h2>
            {selectFilter(
              "kind",
              t("Event Type", "نوع الفعالية"),
              <GraduationCap />,
              [
                {
                  value: "lecture",
                  label: t("Public Lectures", "المحاضرات العامة"),
                },
                {
                  value: "training",
                  label: t("Training Programmes", "البرامج التدريبية"),
                },
              ]
            )}
            {selectFilter(
              "status",
              t("Status", "الحالة"),
              <Tag />,
              statusOptions
            )}
            {modeOptions.length > 0 &&
              selectFilter(
                "mode",
                t("Mode", "طريقة الحضور"),
                <Monitor />,
                modeOptions
              )}
            {unique("category").length > 0 &&
              selectFilter(
                "category",
                t("Topic / Category", "الموضوع / التصنيف"),
                <Grid2X2 />,
                unique("category")
              )}
            {selectFilter(
              "presenter",
              presenterLabel,
              <UserRound />,
              unique("presenter")
            )}
            {selectFilter(
              "location",
              t("Location", "الموقع"),
              <MapPin />,
              unique("location")
            )}
            <details className={styles.filter}>
              <summary>
                <CalendarDays />
                <span>{t("Date Range", "الفترة الزمنية")}</span>
                <ChevronRight />
              </summary>
              <div className={styles.dateInputs}>
                <label>
                  {t("From", "من")}
                  <input
                    type="date"
                    value={filters.from}
                    max={filters.to || undefined}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, from: e.target.value }))
                    }
                  />
                </label>
                <label>
                  {t("To", "إلى")}
                  <input
                    type="date"
                    value={filters.to}
                    min={filters.from || undefined}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, to: e.target.value }))
                    }
                  />
                </label>
              </div>
            </details>
            {activeFilters && (
              <button className={styles.clearDay} onClick={reset}>
                {t("Reset all filters", "إعادة تعيين الفلاتر")}
                <X />
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
