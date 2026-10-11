"use client"

import { useState, type FormEvent } from "react"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmailInput } from "@/components/ui/email-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  Mail,
  MapPin,
  Loader2,
  Send,
  MessageCircle,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { COUNTRY_CODES } from "@/lib/country-codes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { validateContact, type ContactValues } from "@/lib/contact-validation"
import { normalizeEmail } from "@/lib/validators"
import styles from "./contact.module.css"

export default function ContactPage() {
  const { lang } = useLang()
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactValues, string>>
  >({})
  const currentValidation = validateContact(
    { name, email, countryCode, phoneNumber, description },
    lang
  )
  const visibleFieldErrors = Object.fromEntries(
    Object.keys(fieldErrors).map((key) => [
      key,
      currentValidation[key as keyof ContactValues],
    ])
  ) as Partial<Record<keyof ContactValues, string>>
  const fieldError = (key: keyof ContactValues) =>
    visibleFieldErrors[key] ? (
      <p
        id={`contact-${key}-error`}
        role="alert"
        className="mt-1 text-sm text-destructive"
      >
        {visibleFieldErrors[key]}
      </p>
    ) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (submitting) return
    const errors = validateContact(
      { name, email, countryCode, phoneNumber, description },
      lang
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setSubmitting(true)

    try {
      const cleanName = name.trim()
      const cleanEmail = normalizeEmail(email)

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          countryCode,
          phoneNumber,
          description,
          lang,
        }),
      })

      if (!response.ok) {
        const { error: errMsg } = await response.json()
        throw new Error(errMsg || "Failed to send message")
      }

      toast.success(
        t(
          {
            en: "Message sent successfully.",
            ar: "تم إرسال الرسالة بنجاح.",
          },
          lang
        )
      )
      setDone(true)
    } catch {
      const message =
        lang === "ar"
          ? "تعذر إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقًا."
          : "Unable to send your message. Please try again later."
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const contacts = [
    {
      label: { en: "Phone", ar: "الهاتف" },
      value: "+962 78012 7435",
      href: "tel:+962780127435",
      icon: Phone,
    },
    {
      label: { en: "WhatsApp", ar: "واتساب" },
      value: "+962 788 689123",
      href: "https://wa.me/962788689123",
      icon: MessageCircle,
    },
    {
      label: { en: "Telephone", ar: "الهاتف الثابت" },
      value: "+962 6 5652527",
      href: "tel:+96265652527",
      icon: Phone,
    },
    {
      label: { en: "Email", ar: "البريد الإلكتروني" },
      value: "support@dsc.ac",
      href: "mailto:support@dsc.ac",
      icon: Mail,
    },
  ]

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <section className={styles.hero} aria-labelledby="contact-title">
        <span className={styles.goldRule} aria-hidden="true" />
        <h1 id="contact-title">
          {t({ en: "Contact Us", ar: "اتصل بنا" }, lang)}
        </h1>
      </section>
      <section className={styles.content}>
        <div className={styles.layout}>
          <section className={styles.info} aria-labelledby="contact-info-title">
            <div className={styles.heading}>
              <h2 id="contact-info-title">
                {t({ en: "Get in Touch", ar: "تواصل معنا" }, lang)}
              </h2>
              <p>
                {t(
                  {
                    en: "We are here to help and answer your questions. We look forward to hearing from you.",
                    ar: "نحن هنا لمساعدتك والإجابة عن أسئلتك. يسعدنا تواصلك معنا.",
                  },
                  lang
                )}
              </p>
            </div>
            <div className={styles.contactCard}>
              {contacts.map(({ label, value, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className={styles.contactRow}
                  {...(href.startsWith("https:")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <span className={styles.iconTile}>
                    <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className={styles.contactText}>
                    <strong>{t(label, lang)}</strong>
                    <bdi dir="ltr">{value}</bdi>
                  </span>
                  <ArrowUpRight
                    className={styles.linkArrow}
                    size={17}
                    aria-hidden="true"
                  />
                </a>
              ))}
              <div className={styles.contactRow}>
                <span className={styles.iconTile}>
                  <MapPin size={21} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className={styles.contactText}>
                  <strong>{t({ en: "Address", ar: "العنوان" }, lang)}</strong>
                  <span>
                    {t({ en: "Alhubaihah", ar: "الجبيهة" }, lang)}
                    <br />
                    {t(
                      { en: "Amman, 11118, Jordan", ar: "عمان، 11118، الأردن" },
                      lang
                    )}
                  </span>
                </span>
              </div>
            </div>
          </section>
          <section
            className={styles.formColumn}
            aria-labelledby="contact-form-title"
          >
            <div className={styles.heading}>
              <h2 id="contact-form-title">
                {t({ en: "Contact Form", ar: "نموذج التواصل" }, lang)}
              </h2>
              <p>
                {t(
                  {
                    en: "Have a question or want to work with us? Tell us how we can help using the form below.",
                    ar: "هل لديك سؤال أو ترغب في العمل معنا؟ أخبرنا كيف يمكننا مساعدتك عبر النموذج أدناه.",
                  },
                  lang
                )}
              </p>
            </div>
            <div className={styles.formCard}>
              {done ? (
                <div className={styles.success} role="status">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: "#22c55e" }}
                  >
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {t(
                      {
                        en: "Message Sent Successfully!",
                        ar: "تم إرسال الرسالة بنجاح!",
                      },
                      lang
                    )}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      {
                        en: "Thank you for reaching out. Your message has been received.",
                        ar: "شكرًا على تواصلك. تم استلام رسالتك.",
                      },
                      lang
                    )}
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => {
                      setDone(false)
                      setName("")
                      setCountryCode("")
                      setPhoneNumber("")
                      setEmail("")
                      setDescription("")
                    }}
                  >
                    {t(
                      { en: "Send Another Message", ar: "إرسال رسالة أخرى" },
                      lang
                    )}
                  </Button>
                </div>
              ) : (
                <form
                  noValidate
                  onSubmit={handleSubmit}
                  className={styles.form}
                  aria-busy={submitting}
                >
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium"
                    >
                      {t({ en: "Name", ar: "الاسم" }, lang)}
                    </label>
                    <Input
                      id="contact-name"
                      placeholder={
                        lang === "ar" ? "اسمك الكامل" : "Your full name"
                      }
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!visibleFieldErrors.name}
                      aria-describedby={`contact-name-help${visibleFieldErrors.name ? " contact-name-error" : ""}`}
                    />
                    {fieldError("name")}
                    <p
                      id="contact-name-help"
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {lang === "ar" ? "من 2 إلى 100 حرف" : "2–100 characters"}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-2 block text-sm font-medium"
                    >
                      {t({ en: "Phone Number", ar: "رقم الهاتف" }, lang)}
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={countryCode}
                        onValueChange={setCountryCode}
                      >
                        <SelectTrigger
                          aria-label={
                            lang === "ar" ? "رمز البلد" : "Country code"
                          }
                          className="w-full sm:w-40"
                          aria-invalid={!!visibleFieldErrors.countryCode}
                          aria-describedby={
                            visibleFieldErrors.countryCode
                              ? "contact-countryCode-error"
                              : undefined
                          }
                        >
                          <SelectValue
                            placeholder={
                              lang === "ar" ? "اختر رمز البلد" : "Country code"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60">
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.value} value={c.dialCode}>
                              {t(c.label, lang)} ({c.dialCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="contact-phone"
                        placeholder={
                          lang === "ar" ? "رقم هاتفك" : "Your phone number"
                        }
                        type="tel"
                        required
                        minLength={7}
                        maxLength={15}
                        autoComplete="tel-national"
                        inputMode="tel"
                        dir="ltr"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        aria-invalid={!!visibleFieldErrors.phoneNumber}
                        aria-describedby={`contact-phone-help${visibleFieldErrors.phoneNumber ? " contact-phoneNumber-error" : ""}`}
                        className="min-w-0 flex-1"
                      />
                    </div>
                    {fieldError("countryCode")}
                    {fieldError("phoneNumber")}
                    <p
                      id="contact-phone-help"
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {lang === "ar"
                        ? "من 7 إلى 15 رقمًا، دون رمز البلد"
                        : "7–15 digits, excluding country code"}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium"
                    >
                      {t({ en: "Email", ar: "البريد الإلكتروني" }, lang)}
                    </label>
                    <EmailInput
                      id="contact-email"
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                      value={email}
                      onChange={setEmail}
                      error={visibleFieldErrors.email}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-description"
                      className="mb-2 block text-sm font-medium"
                    >
                      {t({ en: "Message", ar: "الرسالة" }, lang)}
                    </label>
                    <Textarea
                      id="contact-description"
                      placeholder={
                        lang === "ar"
                          ? "كيف يمكننا مساعدتك؟"
                          : "How can we help you?"
                      }
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      aria-invalid={!!visibleFieldErrors.description}
                      aria-describedby={`contact-message-help${visibleFieldErrors.description ? " contact-description-error" : ""}`}
                    />
                    {fieldError("description")}
                    <p
                      id="contact-message-help"
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {lang === "ar"
                        ? "من 10 إلى 2000 حرف"
                        : "10–2000 characters"}{" "}
                      · {description.length}/2000
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className={styles.error}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className={styles.submit}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t({ en: "Sending...", ar: "جاري الإرسال..." }, lang)}
                      </>
                    ) : (
                      <>
                        {t({ en: "Send Message", ar: "إرسال الرسالة" }, lang)}
                        <Send
                          className="h-4 w-4 rtl:rotate-180"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
