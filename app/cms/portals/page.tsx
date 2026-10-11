"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react"
import pb, { getErrorMessage } from "@/lib/pb"
import { usePortals } from "@/hooks/usePortals"
import { useLang } from "@/lib/lang-context"
import type { Portal } from "@/lib/portals"
import { PortalIcon, portalIcons } from "@/components/portal/PortalIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/ui/page-loader"
import { DataError } from "@/components/ui/data-error"
type Draft = {
  key: string
  en: string
  ar: string
  descriptionEn: string
  descriptionAr: string
  icon: string
  registration: string
  accent: string
  order: number
}
const iconLabels: Record<string, [string, string]> = {
  heartHandshake: ["Support", "الدعم"],
  brain: ["Mind", "العقل"],
  graduationCap: ["Education", "التعليم"],
  building2: ["Organization", "المؤسسة"],
  heart: ["Wellbeing", "العافية"],
  users: ["Community", "المجتمع"],
  bookOpen: ["Learning", "التعلم"],
  lightbulb: ["Ideas", "الأفكار"],
  briefcase: ["Work", "العمل"],
  globe: ["Global", "العالم"],
}
const empty: Draft = {
  key: "",
  en: "",
  ar: "",
  descriptionEn: "",
  descriptionAr: "",
  icon: "globe",
  registration: "individual",
  accent: "#0b3d60",
  order: 0,
}
export default function CmsPortalsPage() {
  const { lang } = useLang()
  const ar = lang === "ar"
  const text = (en: string, arabic: string) => (ar ? arabic : en)
  const { portals, isLoading, error, reload } = usePortals(true)
  const [editing, setEditing] = useState<Portal | null | undefined>(undefined),
    [draft, setDraft] = useState<Draft>(empty),
    [picture, setPicture] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [removePicture, setRemovePicture] = useState(false),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(""),
    [pictureError, setPictureError] = useState(""),
    [showRemoved, setShowRemoved] = useState(false)
  useEffect(() => {
    const url = picture ? URL.createObjectURL(picture) : ""
    const timer = window.setTimeout(() => setPreview(url), 0)
    return () => {
      window.clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [picture])
  const start = (p: Portal | null) => {
    setEditing(p)
    setDraft(
      p
        ? {
            key: p.id,
            en: p.title.en,
            ar: p.title.ar,
            descriptionEn: p.tagline.en,
            descriptionAr: p.tagline.ar,
            icon: p.icon || "globe",
            registration: p.registrationType || "individual",
            accent: p.accent,
            order: p.order || 0,
          }
        : { ...empty, order: portals.length }
    )
    setPicture(null)
    setPictureError("")
    setRemovePicture(false)
    setFailure("")
    setNotice("")
  }
  const update = (field: keyof Draft, value: string | number) =>
    setDraft({ ...draft, [field]: value })
  const changed = async () => {
    await reload()
    window.dispatchEvent(new Event("portals-updated"))
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setFailure("")
    setNotice("")
    if (!/^[a-z0-9-]{1,80}$/.test(draft.key)) {
      setFailure(
        text(
          "Use lowercase letters, numbers and hyphens for the portal address.",
          "استخدم الحروف الإنجليزية الصغيرة والأرقام والشرطات لعنوان البوابة."
        )
      )
      return
    }
    if (
      [draft.en, draft.ar].some((s) => s.trim().length < 2) ||
      [draft.descriptionEn, draft.descriptionAr].some((s) => !s.trim())
    ) {
      setFailure(
        text(
          "Enter both titles and descriptions.",
          "أدخل العنوان والوصف باللغتين."
        )
      )
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries({
        portal_key: draft.key,
        title_en: draft.en.trim(),
        title_ar: draft.ar.trim(),
        description_en: draft.descriptionEn.trim(),
        description_ar: draft.descriptionAr.trim(),
        icon: draft.icon,
        registration_type: draft.registration,
        accent: draft.accent,
        order: draft.order,
      }).forEach(([key, value]) => data.append(key, String(value)))
      if (picture) data.append("picture", picture)
      else if (removePicture) data.append("picture", "")
      if (editing?.recordId)
        await pb.collection("portals").update(editing.recordId, data)
      else await pb.collection("portals").create(data)
      await changed()
      setEditing(undefined)
      setNotice(text("Portal saved.", "تم حفظ البوابة."))
    } catch (e) {
      setFailure(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }
  const archive = async (p: Portal) => {
    setSaving(true)
    setFailure("")
    try {
      await pb
        .collection("portals")
        .update(p.recordId!, { is_deleted: !p.isDeleted })
      await changed()
      setNotice(
        p.isDeleted
          ? text("Portal restored.", "تمت استعادة البوابة.")
          : text(
              "Portal removed. You can restore it below.",
              "تم حذف البوابة. يمكنك استعادتها أدناه."
            )
      )
    } catch (e) {
      setFailure(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }
  const image = preview || (!removePicture && editing?.picture) || ""
  return (
    <div className="mx-auto max-w-6xl space-y-6" dir={ar ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-[#9b7621]">
            CMS
          </p>
          <h1 className="text-3xl font-bold text-[#0b3d60]">
            {text("Portals", "البوابات")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            {text(
              "Manage the support areas displayed on your website. Edit their names, descriptions and visual identity.",
              "إدارة مجالات الدعم المعروضة على موقعك. عدّل الأسماء والأوصاف والصورة أو الأيقونة."
            )}
          </p>
        </div>
        <Button onClick={() => start(null)} disabled={saving}>
          <Plus size={16} />
          {text("Add portal", "إضافة بوابة")}
        </Button>
      </header>
      {notice && (
        <p
          role="status"
          className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {failure && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {failure}
        </p>
      )}
      {editing === undefined && isLoading ? (
        <PageLoader />
      ) : editing === undefined && error ? (
        <DataError
          message={text("Unable to load portals.", "تعذر تحميل البوابات.")}
          onRetry={() => void reload()}
        />
      ) : editing !== undefined ? (
        <form
          onSubmit={save}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <div className="min-w-0 space-y-6 rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="text-xl font-semibold">
              {editing
                ? text("Edit portal", "تعديل البوابة")
                : text("New portal", "بوابة جديدة")}
            </h2>
            <div className="space-y-2">
              <Label htmlFor="portal-key">
                {text("Portal address", "عنوان البوابة")}
              </Label>
              <Input
                id="portal-key"
                dir="ltr"
                value={draft.key}
                readOnly={!!editing}
                maxLength={80}
                onChange={(e) => update("key", e.target.value)}
                placeholder="family-support"
                required
              />
              <p className="text-xs text-slate-500" dir="ltr">
                /portal/{draft.key || "family-support"}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {(["en", "ar"] as const).map((language) => (
                <fieldset
                  key={language}
                  className="min-w-0 space-y-4"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  <legend className="mb-3 text-sm font-semibold text-[#0b3d60]">
                    {language === "en" ? "English" : "العربية"}
                  </legend>
                  <div className="space-y-2">
                    <Label htmlFor={`title-${language}`}>
                      {language === "en" ? "Title" : "العنوان"}
                    </Label>
                    <Input
                      id={`title-${language}`}
                      value={draft[language]}
                      onChange={(e) => update(language, e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${language}`}>
                      {language === "en" ? "Description" : "الوصف"}
                    </Label>
                    <Textarea
                      id={`description-${language}`}
                      value={
                        language === "en"
                          ? draft.descriptionEn
                          : draft.descriptionAr
                      }
                      onChange={(e) =>
                        update(
                          language === "en" ? "descriptionEn" : "descriptionAr",
                          e.target.value
                        )
                      }
                      required
                      maxLength={600}
                      rows={5}
                    />
                    <p className="text-xs text-slate-500">
                      {
                        (language === "en"
                          ? draft.descriptionEn
                          : draft.descriptionAr
                        ).length
                      }
                      /600
                    </p>
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portal-icon">{text("Icon", "الأيقونة")}</Label>
                <select
                  id="portal-icon"
                  className="h-11 w-full rounded-md border px-3"
                  value={draft.icon}
                  onChange={(e) => update("icon", e.target.value)}
                >
                  {Object.keys(portalIcons).map((name) => (
                    <option key={name} value={name}>
                      {text(...iconLabels[name])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-color">
                  {text("Accent color", "لون البوابة")}
                </Label>
                <Input
                  id="portal-color"
                  type="color"
                  value={draft.accent}
                  onChange={(e) => update("accent", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-picture">
                {text("Picture (optional)", "الصورة (اختياري)")}
              </Label>
              <Input
                id="portal-picture"
                type="file"
                aria-invalid={!!pictureError}
                aria-describedby="portal-picture-help portal-picture-error"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (
                    file &&
                    (file.size > 5 * 1024 * 1024 ||
                      ![
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/gif",
                      ].includes(file.type))
                  ) {
                    setPictureError(
                      text(
                        "Choose a JPG, PNG, WebP or GIF up to 5 MB.",
                        "اختر صورة JPG أو PNG أو WebP أو GIF بحجم لا يتجاوز 5 ميجابايت."
                      )
                    )
                    e.target.value = ""
                    return
                  }
                  setPictureError("")
                  setPicture(file)
                  setRemovePicture(false)
                }}
              />
              {pictureError && (
                <p id="portal-picture-error" role="alert" className="text-sm text-red-700">
                  {pictureError}
                </p>
              )}
              {picture && (
                <p role="status" className="text-sm text-emerald-700">
                  {picture.name} — {text("Selected. Click Save portal to upload.", "تم اختيار الصورة. اضغط حفظ البوابة لرفعها.")}
                </p>
              )}
              <p id="portal-picture-help" className="text-xs text-slate-500">
                {text(
                  "Maximum 5 MB. A picture replaces the icon and appears on the portal page.",
                  "الحد الأقصى 5 ميجابايت. تحل الصورة محل الأيقونة وتظهر في صفحة البوابة."
                )}
              </p>
              {(editing?.picture || picture) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPicture(null)
                    setRemovePicture(true)
                  }}
                >
                  {text("Remove picture", "حذف الصورة")}
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portal-registration">
                  {text("Registration account type", "نوع حساب التسجيل")}
                </Label>
                <select
                  id="portal-registration"
                  className="h-11 w-full rounded-md border px-3"
                  value={draft.registration}
                  onChange={(e) => update("registration", e.target.value)}
                >
                  {[
                    ["parent", "Parent", "ولي أمر"],
                    ["individual", "Individual", "فرد"],
                    ["organization", "Organization", "مؤسسة"],
                    ["expert", "Expert", "خبير"],
                  ].map(([key, en, arabic]) => (
                    <option key={key} value={key}>
                      {text(en, arabic)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-order">
                  {text("Display order", "ترتيب العرض")}
                </Label>
                <Input
                  id="portal-order"
                  type="number"
                  min={0}
                  step={1}
                  value={draft.order}
                  onChange={(e) => update("order", Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 border-t pt-5">
              <Button disabled={saving}>
                {saving
                  ? text("Saving…", "جارٍ الحفظ…")
                  : text("Save portal", "حفظ البوابة")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setEditing(undefined)}
              >
                {text("Cancel", "إلغاء")}
              </Button>
            </div>
          </div>
          <aside className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600">
              {text("Card preview", "معاينة البطاقة")}
            </h3>
            <div
              className={`min-w-0 overflow-hidden rounded-xl border bg-white p-6 ${image ? "min-h-[432px]" : ""}`}
              style={{ borderTop: `4px solid ${draft.accent}` }}
            >
              <div
                className={image
                  ? "-mx-6 -mt-6 mb-5 h-54 overflow-hidden bg-slate-50"
                  : "mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-50"}
                style={{ color: draft.accent }}
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PortalIcon name={draft.icon} size={32} />
                )}
              </div>
              <h3 className="text-lg font-bold break-words text-[#0b3d60]">
                {(ar ? draft.ar : draft.en) ||
                  text("Portal title", "عنوان البوابة")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed break-words text-slate-600">
                {(ar ? draft.descriptionAr : draft.descriptionEn) ||
                  text(
                    "Your description appears here.",
                    "يظهر وصف البوابة هنا."
                  )}
              </p>
              <div
                className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold"
                style={{ color: draft.accent }}
              >
                <span>{text("Explore support →", "استكشف المجال ←")}</span>
              </div>
            </div>
          </aside>
        </form>
      ) : (
        <>
          <div className="space-y-3">
            {portals
              .filter((p) => !p.isDeleted)
              .map((p) => (
                <article
                  key={p.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 sm:p-5"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50"
                    style={{ color: p.accent }}
                  >
                    {p.picture ? (
                      <img
                        src={p.picture}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PortalIcon name={p.icon} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <h2 className="text-lg font-semibold break-words text-[#0b3d60]">
                      {p.title[lang]}
                    </h2>
                    <p className="mt-1 text-sm break-words text-slate-600">
                      {p.tagline[lang]}
                    </p>
                    <p className="mt-2 text-xs text-slate-500" dir="ltr">
                      /portal/{p.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => start(p)}
                      disabled={saving}
                    >
                      <Pencil size={15} />
                      {text("Edit", "تعديل")}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/portal/${p.id}`} target="_blank">
                        {text("View", "عرض")}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void archive(p)}
                      disabled={saving}
                    >
                      <Trash2 size={15} />
                      {text("Remove", "حذف")}
                    </Button>
                  </div>
                </article>
              ))}
          </div>
          {!portals.some((p) => !p.isDeleted) && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <h2 className="font-semibold">
                {text("No active portals", "لا توجد بوابات نشطة")}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {text(
                  "Add your first portal or restore a removed one.",
                  "أضف بوابة جديدة أو استعد إحدى البوابات المحذوفة."
                )}
              </p>
            </div>
          )}
          {portals.some((p) => p.isDeleted) && (
            <section className="border-t pt-5">
              <Button
                variant="outline"
                onClick={() => setShowRemoved(!showRemoved)}
              >
                {text("Removed portals", "البوابات المحذوفة")} (
                {portals.filter((p) => p.isDeleted).length})
              </Button>
              {showRemoved && (
                <div className="mt-4 space-y-3">
                  {portals
                    .filter((p) => p.isDeleted)
                    .map((p) => (
                      <article
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 p-4"
                      >
                        <h3 className="min-w-0 font-medium break-words">
                          {p.title[lang]}
                        </h3>
                        <Button
                          variant="outline"
                          onClick={() => void archive(p)}
                          disabled={saving}
                        >
                          <RotateCcw size={15} />
                          {text("Restore", "استعادة")}
                        </Button>
                      </article>
                    ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
