"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { EmailInput } from "@/components/ui/email-input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { COUNTRY_CODES } from "@/lib/country-codes"
import PocketBase from "pocketbase"
import pb, { getErrorMessage, getFieldErrors } from "@/lib/pb"
import {
  ageGroupLabel,
  consultationModeLabel,
  ACADEMIC_DEGREES,
  AGE_GROUPS,
  CONSULTATION_MODES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/expert-options"
import {
  SPECIALIZATION_OPTIONS,
  specializationLabel,
  degreeLabel,
} from "@/components/team/team-labels"
import { Check, ChevronsUpDown, Paperclip, X } from "lucide-react"
import {
  EMAIL_INVALID_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validators"
import { toast } from "sonner"
import {
  ExpertPublicDetailsFields,
  type ExpertPublicDetails,
} from "@/components/expert/ExpertPublicDetailsFields"
import { isValidIban, normalizeIban } from "@/lib/iban"

export function ExpertApplicationForm({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) {
  const { lang } = useLang()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)

  // user fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  // Extra fields
  const [residence, setResidence] = useState("")
  const [city, setCity] = useState("")
  const [highestAcademicDegree, setHighestAcademicDegree] = useState("")
  const [degreeTitle, setDegreeTitle] = useState("")
  const [fieldOfStudy, setFieldOfStudy] = useState("")
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [ageGroup, setAgeGroup] = useState<string[]>([])
  const [specialization, setSpecialization] = useState<string[]>([])
  const [consultationMode, setConsultationMode] = useState("")
  const [fee, setFee] = useState("")
  const [iban, setIban] = useState("")
  const [availability, setAvailability] = useState("")
  const [publicDetails, setPublicDetails] = useState<ExpertPublicDetails>({
    publicNameEn: "",
    publicNameAr: "",
    publicQualificationEn: "",
    publicQualificationAr: "",
    publicSpecialtyEn: "",
    publicSpecialtyAr: "",
  })
  const [bioEn, setBioEn] = useState("")
  const [bioAr, setBioAr] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)

  // Booleans
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)

  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordsMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm

  const fieldErrorNode = (...keys: string[]) => {
    const msg = keys.map((k) => fieldErrors[k]).find(Boolean)
    return msg ? <p className="text-xs text-red-500">{msg}</p> : null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles([file])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfilePhoto(e.target.files?.[0] ?? null)
  }

  const removeProfilePhoto = () => {
    setProfilePhoto(null)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const required = t(
      { en: "This field is required.", ar: "هذا الحقل مطلوب." },
      lang
    )

    if (!name.trim()) errs.name = required
    if (!email.trim()) errs.email = required
    else if (!isValidEmail(email)) errs.email = t(EMAIL_INVALID_MESSAGE, lang)
    if (!password) errs.password = required
    else if (password.length < 8)
      errs.password = t(
        {
          en: "Password must be at least 8 characters.",
          ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
        },
        lang
      )
    if (!passwordConfirm) errs.passwordConfirm = required
    else if (password !== passwordConfirm)
      errs.passwordConfirm = t(
        { en: "Passwords do not match", ar: "كلمات المرور غير متطابقة" },
        lang
      )

    if (bioEn.length > 250 || bioAr.length > 250)
      errs.biography = t(
        {
          en: "Each biography must be at most 250 characters.",
          ar: "يجب ألا تتجاوز كل نبذة 250 حرفًا.",
        },
        lang
      )
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError("")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validate()) return

    window.scrollTo({
      top: 0,
    })
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validate()) return
    if (iban.trim() && !isValidIban(iban)) {
      setFieldErrors({
        iban:
          lang === "ar"
            ? "يرجى إدخال رقم IBAN صحيح"
            : "Please enter a valid IBAN",
      })
      return
    }

    const totalSize =
      files.reduce((sum, f) => sum + f.size, 0) + (profilePhoto?.size ?? 0)
    if (totalSize > MAX_ATTACHMENT_BYTES) {
      setError(
        t(
          {
            en: "Total attachment size exceeds 35MB. Please reduce the number or size of files.",
            ar: "يتجاوز الحجم الإجمالي للمرفقات 35 ميجابايت. يرجى تقليل عدد الملفات أو حجمها.",
          },
          lang
        )
      )
      return
    }

    setIsSubmitting(true)

    try {
      const cleanName = name.trim()
      const cleanEmail = normalizeEmail(email)
      if (iban.trim()) {
        // Do not create an account if the backend cannot securely persist its IBAN.
        const config = await pb.send<{ iban: boolean }>(
          "/api/dsc/expert-registration-config",
          { method: "GET" }
        )
        if (!config.iban)
          throw new Error(
            lang === "ar"
              ? "حفظ IBAN غير متاح حالياً"
              : "IBAN storage is not configured"
          )
      }

      const userFormData = new FormData()
      const extraFormData = new FormData()

      // User Form
      userFormData.set("email", cleanEmail)
      userFormData.set("emailVisibility", "true")
      userFormData.set("password", password)
      userFormData.set("passwordConfirm", passwordConfirm)
      userFormData.set("name", cleanName)
      userFormData.set("role", "expert")
      userFormData.set("is_active", "false")
      if (iban.trim()) userFormData.set("expert_iban", normalizeIban(iban))

      // Create user record
      const user = await pb.collection("users").create(userFormData)

      const profileClient = pb.authStore.isValid
        ? pb
        : new PocketBase(pb.baseURL)
      if (!profileClient.authStore.isValid)
        await profileClient
          .collection("users")
          .authWithPassword(cleanEmail, password)

      // Extra fields
      extraFormData.set("user", user.id)
      if (profilePhoto) extraFormData.append("profile_photo", profilePhoto)

      extraFormData.set("country_of_residence", residence)
      extraFormData.set("city", city)
      extraFormData.set("whatsapp_country_code", whatsappCountryCode)
      extraFormData.set("whatsapp_number", whatsappNumber)
      extraFormData.set("highest_academic_degree", highestAcademicDegree)
      extraFormData.set("degree_title", degreeTitle)
      extraFormData.set("field_of_study", fieldOfStudy)

      extraFormData.set("age_group", JSON.stringify(ageGroup))
      extraFormData.set("specialization_type", JSON.stringify(specialization))
      extraFormData.set("consultation_mode", consultationMode)

      files.forEach((file) => extraFormData.append("cv", file))

      extraFormData.set("public_name_en", publicDetails.publicNameEn.trim())
      extraFormData.set("public_name_ar", publicDetails.publicNameAr.trim())
      extraFormData.set(
        "public_qualification_en",
        publicDetails.publicQualificationEn.trim()
      )
      extraFormData.set(
        "public_qualification_ar",
        publicDetails.publicQualificationAr.trim()
      )
      extraFormData.set(
        "public_specialty_en",
        publicDetails.publicSpecialtyEn.trim()
      )
      extraFormData.set(
        "public_specialty_ar",
        publicDetails.publicSpecialtyAr.trim()
      )
      extraFormData.set("short_bio_en", bioEn)
      extraFormData.set("short_bio_ar", bioAr)
      extraFormData.set("availability", availability)
      extraFormData.set("fee", fee)

      // Create extra record
      await profileClient.collection("expert_profiles").create(extraFormData)

      const response = await fetch("/api/expert-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profileClient.authStore.token}`,
        },
        body: JSON.stringify({}),
      })

      toast.success(
        t(
          {
            en: "Application submitted successfully.",
            ar: "تم إرسال الطلب بنجاح.",
          },
          lang
        )
      )

      if (onSuccess) {
        onSuccess()
      } else if (!response.ok) {
        router.push("/login?expert_pending=1&warn=1")
      } else {
        router.push("/login?expert_pending=1")
      }
    } catch (err) {
      const fieldErrs = getFieldErrors(err, lang)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
        setStep(1)
      } else {
        setError(getErrorMessage(err, lang))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1
              ? t({ en: "Personal Information", ar: "المعلومات الشخصية" }, lang)
              : t({ en: "Client Preferences", ar: "تفضيلات العميل" }, lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>
                  {t({ en: "Full Name", ar: "الاسم الكامل" }, lang)}
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  aria-invalid={fieldErrors.name ? true : undefined}
                  placeholder={t(
                    {
                      en: "e.g. Dr. Ahmed Al-Rashid",
                      ar: "مثال: د. أحمد الراشد",
                    },
                    lang
                  )}
                />
                {fieldErrorNode("name")}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {t({ en: "Country of Residence", ar: "بلد الإقامة" }, lang)}
                  </Label>
                  <Select value={residence} onValueChange={setResidence}>
                    <SelectTrigger className="w-full">
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
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.value} value={c.label.en}>
                          {t(c.label, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {t({ en: "City of Residence", ar: "مدينة الإقامة" }, lang)}
                  </Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t(
                      { en: "e.g. Riyadh", ar: "مثال: الرياض" },
                      lang
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {t(
                      {
                        en: "Highest Academic Degree",
                        ar: "أعلى مؤهل أكاديمي",
                      },
                      lang
                    )}
                  </Label>
                  <Select
                    value={highestAcademicDegree}
                    onValueChange={setHighestAcademicDegree}
                  >
                    <SelectTrigger className="w-full">
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
                </div>

                <div className="space-y-2">
                  <Label>
                    {t({ en: "Degree Title", ar: "عنوان الشهادة" }, lang)}
                  </Label>
                  <Input
                    value={degreeTitle}
                    onChange={(e) => setDegreeTitle(e.target.value)}
                    placeholder={t(
                      {
                        en: "e.g. Bachelor of Education",
                        ar: "مثال: بكالوريوس تربية",
                      },
                      lang
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    {t({ en: "Field of Study", ar: "مجال الدراسة" }, lang)}
                  </Label>
                  <Input
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder={t(
                      {
                        en: "e.g. Special Education",
                        ar: "مثال: التربية الخاصة",
                      },
                      lang
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {t({ en: "Email", ar: "البريد الإلكتروني" }, lang)}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <EmailInput
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    {t({ en: "WhatsApp Number", ar: "رقم الواتساب" }, lang)}
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={whatsappCountryCode}
                      onValueChange={setWhatsappCountryCode}
                    >
                      <SelectTrigger className="w-30">
                        <SelectValue placeholder="+966" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="max-h-60! max-w-30"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.value} value={c.dialCode}>
                            {t(c.label, lang)} ({c.dialCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder={t(
                        { en: "e.g. 55 000 0000", ar: "مثال: 55 000 0000" },
                        lang
                      )}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {t({ en: "Password", ar: "كلمة المرور" }, lang)}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    placeholder={t(
                      { en: "Min 8 characters", ar: "8 أحرف على الأقل" },
                      lang
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      { en: "Minimum 8 characters", ar: "8 أحرف على الأقل" },
                      lang
                    )}
                  </p>
                  {fieldErrorNode("password")}
                  {!fieldErrors.password && passwordTooShort && (
                    <p className="text-xs text-red-500">
                      {t(
                        {
                          en: "Password must be at least 8 characters",
                          ar: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
                        },
                        lang
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    {t(
                      { en: "Confirm Password", ar: "تأكيد كلمة المرور" },
                      lang
                    )}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <PasswordInput
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    aria-invalid={
                      fieldErrors.passwordConfirm ? true : undefined
                    }
                    placeholder={t(
                      {
                        en: "Re-enter your password",
                        ar: "أعد إدخال كلمة المرور",
                      },
                      lang
                    )}
                  />
                  {fieldErrorNode("passwordConfirm")}
                  {!fieldErrors.passwordConfirm && passwordsMismatch && (
                    <p className="text-xs text-red-500">
                      {t(
                        {
                          en: "Passwords do not match",
                          ar: "كلمتا المرور غير متطابقتين",
                        },
                        lang
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button type="button" className="w-full p-4" onClick={handleNext}>
                {t({ en: "Next", ar: "التالي" }, lang)}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {t({ en: "Age Group", ar: "الفئة العمرية" }, lang)}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="h-auto min-h-10 w-full justify-between"
                      >
                        <div className="flex flex-wrap gap-1">
                          {ageGroup.length > 0 ? (
                            ageGroup.map((value) => {
                              return (
                                <Badge
                                  key={value}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {ageGroupLabel(value, lang)}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setAgeGroup(
                                        ageGroup.filter((v) => v !== value)
                                      )
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
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[400px] max-w-[calc(100vw-2rem)] p-0"
                      align="start"
                    >
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
                                onSelect={() => {
                                  setAgeGroup(
                                    ageGroup.includes(option.value)
                                      ? ageGroup.filter(
                                          (v) => v !== option.value
                                        )
                                      : [...ageGroup, option.value]
                                  )
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    ageGroup.includes(option.value)
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
                </div>

                <div className="space-y-2">
                  <Label>
                    {t({ en: "Consultation Mode", ar: "وضع الاستشارة" }, lang)}
                  </Label>
                  <Select
                    value={consultationMode}
                    onValueChange={setConsultationMode}
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
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {t(
                    {
                      en: "Field of Service Provision",
                      ar: "مجال تقديم الخدمات",
                    },
                    lang
                  )}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="h-auto min-h-10 w-full justify-between"
                    >
                      <div className="flex flex-wrap gap-1">
                        {specialization.length > 0 ? (
                          specialization.map((value) => (
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
                                  setSpecialization(
                                    specialization.filter(
                                      (item) => item !== value
                                    )
                                  )
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
                  <PopoverContent
                    className="w-80 max-w-[calc(100vw-2rem)] p-0"
                    align="start"
                  >
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
                                setSpecialization(
                                  specialization.includes(option.value)
                                    ? specialization.filter(
                                        (item) => item !== option.value
                                      )
                                    : [...specialization, option.value]
                                )
                              }
                            >
                              <Check
                                className={cn(
                                  "me-2 h-4 w-4",
                                  specialization.includes(option.value)
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
              </div>

              <div className="space-y-2">
                <Label>
                  {t(
                    { en: "First Session Fee", ar: "رسوم الجلسة الأولى" },
                    lang
                  )}
                </Label>
                <Input
                  type="text"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder={t(
                    { en: "e.g. 500 per session", ar: "مثال: 500" },
                    lang
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expert-iban">
                  {lang === "ar"
                    ? "رقم الحساب المصرفي الدولي (IBAN)"
                    : "IBAN number"}
                </Label>
                <Input
                  id="expert-iban"
                  dir="ltr"
                  value={iban}
                  maxLength={42}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) =>
                    setIban(event.target.value.toUpperCase())
                  }
                  aria-invalid={!!fieldErrors.iban}
                  aria-describedby="expert-iban-help"
                />
                {fieldErrorNode("iban")}
                <p
                  id="expert-iban-help"
                  className="text-sm text-muted-foreground"
                >
                  {lang === "ar"
                    ? "اختياري. يُحفظ بشكل خاص لبيانات الدفع."
                    : "Optional. Stored privately for payment details."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  {t({ en: "Availability", ar: "أوقات التوفر" }, lang)}
                </Label>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder={t(
                    {
                      en: "e.g. Weekdays 9am-5pm",
                      ar: "مثال: أيام الأسبوع 9ص-5م",
                    },
                    lang
                  )}
                />
              </div>

              <ExpertPublicDetailsFields
                values={publicDetails}
                onChange={(change) =>
                  setPublicDetails((current) => ({ ...current, ...change }))
                }
              />

              {(
                [
                  {
                    key: "short_bio_en",
                    label: t(
                      {
                        en: "Short biography (English)",
                        ar: "نبذة قصيرة بالإنجليزية",
                      },
                      lang
                    ),
                    value: bioEn,
                    set: setBioEn,
                    dir: "ltr",
                  },
                  {
                    key: "short_bio_ar",
                    label: t(
                      {
                        en: "Short biography (Arabic)",
                        ar: "نبذة قصيرة بالعربية",
                      },
                      lang
                    ),
                    value: bioAr,
                    set: setBioAr,
                    dir: "rtl",
                  },
                ] as const
              ).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Textarea
                    id={field.key}
                    dir={field.dir}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    maxLength={250}
                    rows={4}
                    aria-describedby={`${field.key}-count`}
                  />
                  <p
                    id={`${field.key}-count`}
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
                </div>
              ))}
              <div className="space-y-2">
                <Label>
                  {t({ en: "Profile Photo", ar: "الصورة الشخصية" }, lang)}
                </Label>
                <div className="rounded-lg border-2 border-dashed border-border p-4">
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Paperclip className="h-5 w-5" />
                    <span>
                      {t(
                        {
                          en: "Click to upload your profile photo",
                          ar: "انقر لرفع صورتك الشخصية",
                        },
                        lang
                      )}
                    </span>
                  </label>
                </div>

                {profilePhoto && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                      <Paperclip className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">
                        {profilePhoto.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeProfilePhoto}
                        className="transition-colors hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  {t({ en: "Upload CV", ar: "رفع السيرة الذاتية" }, lang)}
                </Label>
                <div className="rounded-lg border-2 border-dashed border-border p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Paperclip className="h-5 w-5" />
                    <span>
                      {t(
                        {
                          en: "Click to upload your CV",
                          ar: "انقر لرفع سيرتك الذاتية",
                        },
                        lang
                      )}
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[150px] truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="transition-colors hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.scrollTo({ top: 0 })
                    setStep(1)
                  }}
                >
                  {t({ en: "Back", ar: "رجوع" }, lang)}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t({ en: "Submitting...", ar: "جارٍ الإرسال..." }, lang)
                    : t({ en: "Submit Application", ar: "إرسال الطلب" }, lang)}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t(
                  {
                    en: "Your application will be reviewed by our team. You will receive an email once your account is approved.",
                    ar: "سيتم مراجعة طلبك من قبل فريقنا. ستتلقى بريدًا إلكترونيًا بمجرد الموافقة على حسابك.",
                  },
                  lang
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
