"use client"

import { ExpertPublicDetailsFields } from "@/components/expert/ExpertPublicDetailsFields"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Briefcase,
  Camera,
  Check,
  ChevronsUpDown,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { COUNTRY_CODES } from "@/lib/country-codes"
import {
  ACADEMIC_DEGREES,
  AGE_GROUPS,
  CONSULTATION_MODES,
  ageGroupLabel,
  consultationModeLabel,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
} from "@/lib/expert-options"
import { ProfileAvatar } from "@/components/profile/ProfileAvatar"
import {
  SPECIALIZATION_OPTIONS,
  specializationLabel,
  degreeLabel,
} from "@/components/team/team-labels"
import type { ExpertProfileDraft } from "@/types/expert"

interface ExpertProfileEditorProps {
  draft: ExpertProfileDraft
  onChange: (next: ExpertProfileDraft) => void
  /** Shown read-only: changing an account email goes through support. */
  email: string
  /** URL of the stored photo, used until a new file is picked. */
  photoUrl: string
  /** Maps a PocketBase field name to a translated validation message. */
  fieldErrors: Record<string, string>
  isSaving: boolean
  onCancel: () => void
  onSubmit: () => void
  /** Overrides the heading when an admin edits someone else's profile. */
  title?: string
  subtitle?: string
}

export function ExpertProfileEditor({
  draft,
  onChange,
  email,
  photoUrl,
  fieldErrors,
  isSaving,
  onCancel,
  onSubmit,
  title,
  subtitle,
}: ExpertProfileEditorProps) {
  const { lang } = useLang()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const [cvTooLarge, setCvTooLarge] = useState(false)

  const previewUrl = useMemo(
    () => (draft.newPhoto ? URL.createObjectURL(draft.newPhoto) : ""),
    [draft.newPhoto]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const patch = (part: Partial<ExpertProfileDraft>) =>
    onChange({ ...draft, ...part })

  const errorFor = (field: string) =>
    fieldErrors[field] ? (
      <p className="text-xs text-destructive">{fieldErrors[field]}</p>
    ) : null

  const pendingSize = useMemo(
    () =>
      (draft.newPhoto?.size ?? 0) +
      draft.newCv.reduce((sum, file) => sum + file.size, 0),
    [draft.newPhoto, draft.newCv]
  )

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) patch({ newPhoto: file, removePhoto: false })
    event.target.value = ""
  }

  const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length === 0) return

    const next = [...draft.newCv, ...picked]
    const size = next.reduce((sum, file) => sum + file.size, 0)
    if (size > MAX_ATTACHMENT_BYTES) {
      setCvTooLarge(true)
    } else {
      setCvTooLarge(false)
      patch({ newCv: next })
    }
    event.target.value = ""
  }

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {title ?? t({ en: "Edit Profile", ar: "تعديل الملف الشخصي" }, lang)}
        </h1>
        <p className="text-muted-foreground">
          {subtitle ??
            t(
              {
                en: "Update the details you submitted when you applied.",
                ar: "حدّث البيانات التي أدخلتها عند التقديم.",
              },
              lang
            )}
        </p>
      </div>

      {/* Photo */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <CardTitle>
            {t({ en: "Profile Photo", ar: "الصورة الشخصية" }, lang)}
          </CardTitle>
          <CardDescription>
            {t(
              {
                en: "Shown on your public expert profile.",
                ar: "تظهر في ملفك الشخصي العام كخبير.",
              },
              lang
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="group relative shrink-0">
            <ProfileAvatar
              photoUrl={previewUrl || (draft.removePhoto ? "" : photoUrl)}
              name={draft.name}
              className="h-24 w-24"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label={t({ en: "Change photo", ar: "تغيير الصورة" }, lang)}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera className="me-2 h-4 w-4" />
              {draft.newPhoto
                ? t(
                    { en: "Choose a different photo", ar: "اختر صورة أخرى" },
                    lang
                  )
                : t({ en: "Upload photo", ar: "رفع صورة" }, lang)}
            </Button>
            {(draft.newPhoto || photoUrl) && !draft.removePhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patch({ newPhoto: null, removePhoto: true })}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t({ en: "Remove", ar: "إزالة" }, lang)}
              </Button>
            )}
            {draft.removePhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patch({ removePhoto: false })}
              >
                {t({ en: "Undo remove", ar: "تراجع عن الإزالة" }, lang)}
              </Button>
            )}
            {draft.newPhoto && (
              <span className="text-xs text-muted-foreground">
                {draft.newPhoto.name}
              </span>
            )}
            {draft.removePhoto && (
              <span className="text-xs text-muted-foreground">
                {t(
                  {
                    en: "The photo will be removed when you save.",
                    ar: "سيتم حذف الصورة عند الحفظ.",
                  },
                  lang
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal & contact */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <CardTitle>
            {t(
              { en: "Personal & Contact", ar: "البيانات الشخصية والتواصل" },
              lang
            )}
          </CardTitle>
          <CardDescription>
            {t(
              {
                en: "How clients can reach you",
                ar: "كيف يمكن للعملاء التواصل معك",
              },
              lang
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">
              {t({ en: "Full Name", ar: "الاسم الكامل" }, lang)}
              <span className="ms-1 text-destructive">*</span>
            </Label>
            <Input
              id="profile-name"
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
              autoComplete="name"
              aria-invalid={fieldErrors.name ? true : undefined}
              placeholder={t(
                { en: "e.g. Dr. Ahmed Al-Rashid", ar: "مثال: د. أحمد الراشد" },
                lang
              )}
            />
            {errorFor("name")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">
              {t({ en: "Email", ar: "البريد الإلكتروني" }, lang)}
            </Label>
            <Input id="profile-email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              {t(
                {
                  en: "Contact support to change your email.",
                  ar: "تواصل مع الدعم لتغيير بريدك الإلكتروني.",
                },
                lang
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-country">
              {t({ en: "Country of Residence", ar: "بلد الإقامة" }, lang)}
            </Label>
            <Select
              value={draft.countryOfResidence}
              onValueChange={(value) => patch({ countryOfResidence: value })}
            >
              <SelectTrigger id="profile-country" className="w-full">
                <SelectValue
                  placeholder={t(
                    {
                      en: "Select country of residence...",
                      ar: "اختر بلد الإقامة...",
                    },
                    lang
                  )}
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60!">
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.value} value={country.label.en}>
                    {t(country.label, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("country_of_residence")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-city">
              {t({ en: "City of Residence", ar: "مدينة الإقامة" }, lang)}
            </Label>
            <Input
              id="profile-city"
              value={draft.city}
              onChange={(event) => patch({ city: event.target.value })}
              placeholder={t({ en: "e.g. Riyadh", ar: "مثال: الرياض" }, lang)}
            />
            {errorFor("city")}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-whatsapp">
              {t({ en: "WhatsApp Number", ar: "رقم الواتساب" }, lang)}
            </Label>
            <div className="flex gap-2">
              <Select
                value={draft.whatsappCountryCode}
                onValueChange={(value) => patch({ whatsappCountryCode: value })}
              >
                <SelectTrigger className="w-32 shrink-0">
                  <SelectValue placeholder="+966" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60! max-w-32">
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.value} value={country.dialCode}>
                      {t(country.label, lang)} ({country.dialCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="profile-whatsapp"
                type="tel"
                className="flex-1"
                value={draft.whatsappNumber}
                onChange={(event) =>
                  patch({ whatsappNumber: event.target.value })
                }
                placeholder={t(
                  { en: "e.g. 55 000 0000", ar: "مثال: 55 000 0000" },
                  lang
                )}
              />
            </div>
            {errorFor("whatsapp_number")}
          </div>
        </CardContent>
      </Card>

      {/* Academic */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>
                {t({ en: "Academic Background", ar: "الخلفية العلمية" }, lang)}
              </CardTitle>
              <CardDescription>
                {t({ en: "Your qualifications", ar: "مؤهلاتك العلمية" }, lang)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-degree">
              {t(
                { en: "Highest Academic Degree", ar: "أعلى مؤهل أكاديمي" },
                lang
              )}
            </Label>
            <Select
              value={draft.highestAcademicDegree}
              onValueChange={(value) => patch({ highestAcademicDegree: value })}
            >
              <SelectTrigger id="profile-degree" className="w-full">
                <SelectValue
                  placeholder={t(
                    { en: "Select degree...", ar: "اختر المؤهل..." },
                    lang
                  )}
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60!">
                {ACADEMIC_DEGREES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {degreeLabel(option.value, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("highest_academic_degree")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-degree-title">
              {t({ en: "Degree Title", ar: "عنوان الشهادة" }, lang)}
            </Label>
            <Input
              id="profile-degree-title"
              value={draft.degreeTitle}
              onChange={(event) => patch({ degreeTitle: event.target.value })}
              placeholder={t(
                {
                  en: "e.g. Bachelor of Education",
                  ar: "مثال: بكالوريوس تربية",
                },
                lang
              )}
            />
            {errorFor("degree_title")}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-field">
              {t({ en: "Field of Study", ar: "مجال الدراسة" }, lang)}
            </Label>
            <Input
              id="profile-field"
              value={draft.fieldOfStudy}
              onChange={(event) => patch({ fieldOfStudy: event.target.value })}
              placeholder={t(
                { en: "e.g. Special Education", ar: "مثال: التربية الخاصة" },
                lang
              )}
            />
            {errorFor("field_of_study")}
          </div>
        </CardContent>
      </Card>

      {/* Professional */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>
                {t(
                  { en: "Professional Details", ar: "البيانات المهنية" },
                  lang
                )}
              </CardTitle>
              <CardDescription>
                {t(
                  {
                    en: "What you offer and when you are available",
                    ar: "ما تقدمه ومتى تكون متاحاً",
                  },
                  lang
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {t(
                { en: "Field of Service Provision", ar: "مجال تقديم الخدمات" },
                lang
              )}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-invalid={
                    fieldErrors.specialization_type ? true : undefined
                  }
                  className="h-auto min-h-10 w-full justify-between"
                >
                  <div className="flex flex-wrap gap-1">
                    {draft.specialization.length > 0 ? (
                      draft.specialization.map((value) => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {specializationLabel(value, lang)}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation()
                              patch({
                                specialization: draft.specialization.filter(
                                  (item) => item !== value
                                ),
                              })
                            }}
                          />
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        {t(
                          {
                            en: "Select the services you provide...",
                            ar: "اختر الخدمات التي تقدمها...",
                          },
                          lang
                        )}
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={t(
                      {
                        en: "Search services...",
                        ar: "البحث عن الخدمات...",
                      },
                      lang
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t(
                        {
                          en: "No service found.",
                          ar: "لم يتم العثور على خدمة.",
                        },
                        lang
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {SPECIALIZATION_OPTIONS.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label.en}
                          onSelect={() =>
                            patch({
                              specialization: draft.specialization.includes(
                                option.value
                              )
                                ? draft.specialization.filter(
                                    (item) => item !== option.value
                                  )
                                : [...draft.specialization, option.value],
                            })
                          }
                        >
                          <Check
                            className={cn(
                              "me-2 h-4 w-4",
                              draft.specialization.includes(option.value)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {t(option.label, lang)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errorFor("specialization_type")}
          </div>

          <div className="space-y-2">
            <Label>
              {t({ en: "Consultation Mode", ar: "وضع الاستشارة" }, lang)}
            </Label>
            <Select
              value={draft.consultationMode}
              onValueChange={(value) => patch({ consultationMode: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    { en: "Select mode...", ar: "اختر الوضع..." },
                    lang
                  )}
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60!">
                {CONSULTATION_MODES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {consultationModeLabel(option.value, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("consultation_mode")}
          </div>

          <div className="space-y-2">
            <Label>{t({ en: "Age Group", ar: "الفئة العمرية" }, lang)}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-invalid={fieldErrors.age_group ? true : undefined}
                  className="h-auto min-h-10 w-full justify-between"
                >
                  <div className="flex flex-wrap gap-1">
                    {draft.ageGroup.length > 0 ? (
                      draft.ageGroup.map((value) => {
                        const option = AGE_GROUPS.find(
                          (item) => item.value === value
                        )
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {option ? option.label : value}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation()
                                patch({
                                  ageGroup: draft.ageGroup.filter(
                                    (item) => item !== value
                                  ),
                                })
                              }}
                            />
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">
                        {t(
                          {
                            en: "Select age groups...",
                            ar: "اختر الفئات العمرية...",
                          },
                          lang
                        )}
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={t(
                      {
                        en: "Search age groups...",
                        ar: "البحث عن الفئات...",
                      },
                      lang
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t(
                        {
                          en: "No age group found.",
                          ar: "لم يتم العثور على فئة.",
                        },
                        lang
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {AGE_GROUPS.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() =>
                            patch({
                              ageGroup: draft.ageGroup.includes(option.value)
                                ? draft.ageGroup.filter(
                                    (item) => item !== option.value
                                  )
                                : [...draft.ageGroup, option.value],
                            })
                          }
                        >
                          <Check
                            className={cn(
                              "me-2 h-4 w-4",
                              draft.ageGroup.includes(option.value)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {ageGroupLabel(option.value, lang)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errorFor("age_group")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-fee">
              {t({ en: "First Session Fee", ar: "رسوم الجلسة الأولى" }, lang)}
            </Label>
            <Input
              id="profile-fee"
              value={draft.fee}
              onChange={(event) => patch({ fee: event.target.value })}
              placeholder={t(
                { en: "e.g. 500 per session", ar: "مثال: 500" },
                lang
              )}
            />
            {errorFor("fee")}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-availability">
              {t({ en: "Availability", ar: "أوقات التوفر" }, lang)}
            </Label>
            <Input
              id="profile-availability"
              value={draft.availability}
              onChange={(event) => patch({ availability: event.target.value })}
              placeholder={t(
                {
                  en: "e.g. Weekdays 9am-5pm",
                  ar: "مثال: أيام الأسبوع 9ص-5م",
                },
                lang
              )}
            />
            {errorFor("availability")}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-4 w-4" />
            </span>
            <CardTitle>{t({ en: "About Me", ar: "نبذة عني" }, lang)}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <ExpertPublicDetailsFields values={draft} onChange={patch} />
          </div>
          <div className="space-y-5">
            {(
              [
                {
                  key: "short_bio_en",
                  draftKey: "shortBioEn",
                  value: draft.shortBioEn,
                  dir: "ltr",
                  label: t(
                    {
                      en: "Short biography (English)",
                      ar: "نبذة قصيرة بالإنجليزية",
                    },
                    lang
                  ),
                },
                {
                  key: "short_bio_ar",
                  draftKey: "shortBioAr",
                  value: draft.shortBioAr,
                  dir: "rtl",
                  label: t(
                    {
                      en: "Short biography (Arabic)",
                      ar: "نبذة قصيرة بالعربية",
                    },
                    lang
                  ),
                },
              ] as const
            ).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`profile-${field.key}`}>{field.label}</Label>
                <Textarea
                  id={`profile-${field.key}`}
                  dir={field.dir}
                  rows={4}
                  maxLength={250}
                  value={field.value}
                  onChange={(event) =>
                    patch({ [field.draftKey]: event.target.value })
                  }
                  aria-describedby={`profile-${field.key}-count`}
                />
                <p
                  id={`profile-${field.key}-count`}
                  className="text-xs text-muted-foreground"
                >
                  {field.value.length}/250 ·{" "}
                  {t(
                    {
                      en: "Maximum 250 characters, including spaces and punctuation.",
                      ar: "250 حرفًا كحد أقصى، بما في ذلك المسافات وعلامات الترقيم.",
                    },
                    lang
                  )}
                </p>
                {errorFor(field.key)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="gap-5 py-5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>
                {t(
                  { en: "CV & Documents", ar: "السيرة الذاتية والمستندات" },
                  lang
                )}
              </CardTitle>
              <CardDescription>
                {t(
                  {
                    en: `Add, replace, or remove files. Total uploads are capped at ${MAX_ATTACHMENT_MB}MB.`,
                    ar: `يمكنك إضافة أو استبدال أو إزالة الملفات. الحد الأقصى للرفع ${MAX_ATTACHMENT_MB} ميجابايت.`,
                  },
                  lang
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={cvInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleCvChange}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cvInputRef.current?.click()}
            >
              <Plus className="me-2 h-4 w-4" />
              {t(
                { en: "Add CV files", ar: "إضافة ملفات السيرة الذاتية" },
                lang
              )}
            </Button>
            {pendingSize > 0 && (
              <span className="text-xs text-muted-foreground">
                {t(
                  { en: "Pending uploads:", ar: "ملفات بانتظار الرفع:" },
                  lang
                )}{" "}
                {(pendingSize / 1024 / 1024).toFixed(1)}MB
              </span>
            )}
          </div>

          {cvTooLarge && (
            <p className="text-xs text-destructive">
              {t(
                {
                  en: `Total attachment size exceeds ${MAX_ATTACHMENT_MB}MB. Please reduce the number or size of files.`,
                  ar: `يتجاوز الحجم الإجمالي للمرفقات ${MAX_ATTACHMENT_MB} ميجابايت. يرجى تقليل عدد الملفات أو حجمها.`,
                },
                lang
              )}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {draft.keptCv.map((filename) => (
              <div
                key={filename}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {filename}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={t(
                    { en: `Remove ${filename}`, ar: `إزالة ${filename}` },
                    lang
                  )}
                  onClick={() =>
                    patch({
                      keptCv: draft.keptCv.filter((item) => item !== filename),
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {draft.newCv.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2"
              >
                <Plus className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={t(
                    { en: `Remove ${file.name}`, ar: `إزالة ${file.name}` },
                    lang
                  )}
                  onClick={() =>
                    patch({ newCv: draft.newCv.filter((_, i) => i !== index) })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {draft.keptCv.length === 0 && draft.newCv.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t(
                  {
                    en: "No documents uploaded yet.",
                    ar: "لم يتم رفع أي مستندات بعد.",
                  },
                  lang
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="sticky bottom-4 gap-0 py-3 shadow-lg">
        <CardFooter className="justify-end gap-2 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            {t({ en: "Cancel", ar: "إلغاء" }, lang)}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isSaving
              ? t({ en: "Saving...", ar: "جارٍ الحفظ..." }, lang)
              : t({ en: "Save Changes", ar: "حفظ التغييرات" }, lang)}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
