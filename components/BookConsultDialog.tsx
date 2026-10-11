"use client"

import { useState, type FormEvent } from "react"
import styles from "@/components/internal/internal-theme.module.css"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { Input } from "@/components/ui/input"
import { EmailInput } from "@/components/ui/email-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { COUNTRY_CODES } from "@/lib/country-codes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Loader2 } from "lucide-react"
import {
  PortalServiceSelector,
  type PortalServiceValue,
} from "@/components/register/PortalServiceSelector"
import { usePortals } from "@/hooks/usePortals"
import { formatDate } from "@/lib/format-date"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { getErrorMessage } from "@/lib/pb"
import {
  EMAIL_INVALID_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validators"
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookConsultDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [contact, setContact] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [consultationType, setConsultationType] = useState<
    "online" | "face-to-face" | ""
  >("")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [portalService, setPortalService] = useState<PortalServiceValue>({
    categoryId: "",
    subCategoryId: "",
    customCategory: "",
    customSubCategory: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { lang } = useLang()
  const { portals: PORTALS } = usePortals()
  const getPortalById = (id: string) =>
    PORTALS.find((portal) => portal.id === id)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (!isValidEmail(email)) {
      setError(t(EMAIL_INVALID_MESSAGE, lang))
      return
    }

    setSubmitting(true)

    try {
      const { categoryId, subCategoryId, customCategory } = portalService

      const portal = getPortalById(categoryId)

      const caseType = customCategory || portal?.title?.[lang] || ""
      const issueType = subCategoryId.trim()
      const cleanName = name.trim()
      const cleanEmail = normalizeEmail(email)
      const cleanContact = `${countryCode} ${contact.trim()}`.trim()

      const message_response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${cleanName}`,
          contact: `${cleanContact}`,
          email: `${cleanEmail}`,
          issueType: `${issueType}`,
          caseType: `${caseType}`,
          consultationType: `${consultationType}`,
          preferredDate: `${formatDate(preferredDate)}`,
          preferredTime: `${preferredTime}`,
          description: `${description.trim()}`,
        }),
      })

      if (!message_response.ok) {
        throw new Error(
          t({ en: "Failed to send request", ar: "فشل إرسال الطلب" }, lang)
        )
      }

      setDone(true)
      router.push("https://wa.me/message/XGN76UVRTVL7C1")
    } catch (err) {
      setError(getErrorMessage(err, lang))
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    // reset after dialog closes
    setTimeout(() => {
      setName("")
      setCountryCode("")
      setContact("")
      setEmail("")
      setDescription("")
      setConsultationType("")
      setPreferredDate("")
      setPreferredTime("")
      setPortalService({
        categoryId: "",
        subCategoryId: "",
        customCategory: "",
        customSubCategory: "",
      })
      setDone(false)
      setError("")
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={styles.dialog}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <DialogHeader className={styles.dialogHeader}>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t(
              { en: "Quick Free Consultation", ar: "استشارة مجانية سريعة" },
              lang
            )}
          </DialogTitle>

          <DialogDescription>
            {t(
              {
                en: "Fill in your details and we'll get back to you.",
                ar: "املأ بياناتك وسنعاود التواصل معك.",
              },
              lang
            )}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className={styles.success}>
            {t(
              {
                en: "Your consultation request has been sent successfully! We'll contact you within 48 hours.",
                ar: "تم إرسال طلب الاستشارة بنجاح! سنتواصل معك خلال 48 ساعة.",
              },
              lang
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`${styles.dialogBody} ${styles.form} space-y-5`}
            noValidate
          >
            <div>
              <label
                htmlFor="consult-name"
                className="mb-1 block text-sm font-medium"
              >
                {t({ en: "Name", ar: "الاسم" }, lang)}
              </label>
              <Input
                id="consult-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder={t({ en: "Your name", ar: "اسمك" }, lang)}
              />
            </div>
            <div>
              <label
                htmlFor="consult-contact"
                className="mb-1 block text-sm font-medium"
              >
                {t({ en: "Contact", ar: "التواصل" }, lang)}
              </label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger
                    aria-label={t(
                      { en: "Country calling code", ar: "رمز الاتصال الدولي" },
                      lang
                    )}
                    className={`w-40 ${styles.phoneCode}`}
                  >
                    <SelectValue placeholder="+966" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="max-h-60! w-40 overflow-y-auto"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.dialCode}>
                        {t(c.label, lang)} ({c.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  id="consult-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={t(
                    { en: "Phone number", ar: "رقم الهاتف" },
                    lang
                  )}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="consult-email"
                className="mb-1 block text-sm font-medium"
              >
                {t({ en: "Email", ar: "البريد الإلكتروني" }, lang)}
              </label>
              <EmailInput
                id="consult-email"
                required
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
              />
            </div>

            <PortalServiceSelector
              value={portalService}
              onChange={setPortalService}
              required
              issueTypeMode="text"
            />

            <div className="space-y-4 border-t border-border pt-5">
              <p className="text-sm font-medium">
                {t(
                  { en: "Consultation Preferences", ar: "تفضيلات الاستشارة" },
                  lang
                )}
              </p>
              <div>
                <Label
                  htmlFor="consult-type"
                  className="mb-1 block text-sm font-medium"
                >
                  {t({ en: "Type", ar: "النوع" }, lang)}
                </Label>
                <Select
                  value={consultationType}
                  onValueChange={(v: "online" | "face-to-face") =>
                    setConsultationType(v)
                  }
                >
                  <SelectTrigger id="consult-type" className="w-full">
                    <SelectValue
                      placeholder={t(
                        { en: "Select type", ar: "اختر النوع" },
                        lang
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="overflow-y-auto"
                  >
                    <SelectItem value="online">
                      {t({ en: "Online", ar: "أونلاين" }, lang)}
                    </SelectItem>
                    <SelectItem value="face-to-face">
                      {t({ en: "Face to Face", ar: "وجهاً لوجه" }, lang)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="consult-date"
                  className="mb-1 block text-sm font-medium"
                >
                  {t({ en: "Preferred Date", ar: "التاريخ المفضل" }, lang)}
                </Label>
                <DateInput
                  id="consult-date"
                  value={preferredDate}
                  onChange={setPreferredDate}
                  className="w-full"
                  minDate={new Date()}
                />
              </div>
              <div>
                <Label
                  htmlFor="consult-time"
                  className="mb-1 block text-sm font-medium"
                >
                  {t({ en: "Preferred Time", ar: "الوقت المفضل" }, lang)}
                </Label>
                <Input
                  id="consult-time"
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="consult-description"
                className="mb-1 block text-sm font-medium"
              >
                {t({ en: "Description", ar: "الوصف" }, lang)}
              </label>
              <Textarea
                id="consult-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  {
                    en: "Briefly describe what you need help with",
                    ar: "صف بإيجاز ما تحتاج مساعدة فيه",
                  },
                  lang
                )}
                rows={4}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t({ en: "Sending...", ar: "جارٍ الإرسال..." }, lang)}
                </>
              ) : (
                t({ en: "Submit", ar: "إرسال" }, lang)
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
