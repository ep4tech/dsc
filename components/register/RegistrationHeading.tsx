"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import type { BilingualString } from "@/types/form"
import styles from "@/components/internal/internal-theme.module.css"

export function RegistrationHeading({ title }: { title: BilingualString }) {
  const { lang } = useLang()
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft
  return (
    <header className={styles.pageHeading} dir={lang === "ar" ? "rtl" : "ltr"}>
      <Link href="/register">
        <BackIcon className="me-1 h-4 w-4" />
        {t({ en: "Back", ar: "رجوع" }, lang)}
      </Link>
      <span className={styles.eyebrow}>
        {t({ en: "Your DSC journey", ar: "رحلتك مع DSC" }, lang)}
      </span>
      <h1>{t(title, lang)}</h1>
      <p>
        {t(
          {
            en: "Create your account and tell us a little about yourself. Your next step starts here.",
            ar: "أنشئ حسابك وأخبرنا قليلاً عن نفسك. خطوتك التالية تبدأ هنا.",
          },
          lang
        )}
      </p>
    </header>
  )
}
