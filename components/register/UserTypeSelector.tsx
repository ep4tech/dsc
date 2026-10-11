"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLang } from "@/lib/lang-context"
import pb from "@/lib/pb"
import type { LookupEntry } from "@/types/lookup"
import { registrationRoles } from "./registration-journeys"
import styles from "./registration.module.css"

export function UserTypeSelector() {
  const { lang } = useLang()
  const [userTypes, setUserTypes] = useState<LookupEntry[]>([])
  const ar = lang === "ar"

  useEffect(() => {
    let active = true
    // The four supported forms remain available if optional CMS labels are unavailable.
    boundedFullList(pb.collection("lookups"), { filter: 'type = "user_types"', requestKey: null })
      .then((data) => {
        if (active) setUserTypes(data as unknown as LookupEntry[])
      })
      .catch(() => {
        /* Use the localized labels below. */
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section
      className={styles.landing}
      dir={ar ? "rtl" : "ltr"}
      aria-labelledby="registration-title"
    >
      <div className={styles.landscape} aria-hidden="true" />
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          {ar ? "انضم إلى مجتمعنا" : "JOIN OUR COMMUNITY"}
        </p>
        <h1 id="registration-title">
          {ar ? "ابدأ رحلتك مع DSC" : "Start Your Journey with DSC"}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? "أنشئ حساباً يناسب دورك للوصول إلى برامجنا وفعالياتنا ومواردنا، والحصول على الدعم الذي يلبي احتياجاتك."
            : "Create an account that matches your role and get access to our programmes, events, resources and support tailored to your needs."}
        </p>
      </header>
      <div className={styles.roles}>
        {registrationRoles.map((role) => {
          const lookup = userTypes.find((entry) => entry.key === role.key)
          const label =
            (ar ? lookup?.label_ar : lookup?.label_en) || role.name[lang]
          const registerLabel = ar
            ? `التسجيل ${role.registerAs}`
            : `Register as ${label}`
          return (
            <article
              key={role.key}
              className={`${styles.role} ${styles[role.key]}`}
            >
              <Image
                className={styles.photo}
                src={`/images/register/${role.key}.webp`}
                width={740}
                height={306}
                alt={role.imageAlt[lang]}
                priority
              />
              <div className={styles.body}>
                <h2>{label}</h2>
                <p className={styles.description}>{role.description[lang]}</p>
                <div className={styles.journeyHeading}>
                  <h3>{ar ? "رحلتك معنا" : "Your Journey"}</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className={styles.details}
                        aria-label={
                          ar
                            ? `عرض تفاصيل رحلة ${label}`
                            : `View ${label} journey details`
                        }
                      >
                        {ar ? "عرض التفاصيل" : "View Details"}
                        <ArrowRight size={16} />
                      </button>
                    </DialogTrigger>
                    <DialogContent
                      className={styles.dialog}
                      dir={ar ? "rtl" : "ltr"}
                    >
                      <DialogHeader>
                        <DialogTitle className={styles.dialogTitle}>
                          {ar
                            ? `رحلتك معنا: ${label}`
                            : `Your Journey: ${label}`}
                        </DialogTitle>
                        <DialogDescription>
                          {role.description[lang]}
                        </DialogDescription>
                      </DialogHeader>
                      <ol className={styles.detailSteps}>
                        {role.steps.map((step, index) => (
                          <li key={step.en}>
                            <span>{index + 1}</span>
                            <div>
                              <h3>
                                {index === 0 ? (
                                  <Link
                                    className={styles.stepLink}
                                    href={`/register/${role.key}`}
                                  >
                                    {step[lang]}
                                  </Link>
                                ) : (
                                  step[lang]
                                )}
                              </h3>
                              <p>{step.detail[lang]}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <Link
                        className={`${styles.register} ${styles[role.key]}`}
                        href={`/register/${role.key}`}
                      >
                        {registerLabel}
                        <ArrowRight size={20} />
                      </Link>
                    </DialogContent>
                  </Dialog>
                </div>
                <ol className={styles.steps}>
                  {role.steps.map((step, index) => (
                    <li key={step.en}>
                      <span aria-hidden="true">{index + 1}</span>
                      {index === 0 ? (
                        <Link
                          className={styles.stepLink}
                          href={`/register/${role.key}`}
                        >
                          {step[lang]}
                        </Link>
                      ) : (
                        <span>{step[lang]}</span>
                      )}
                    </li>
                  ))}
                </ol>
                <Link
                  className={styles.register}
                  href={`/register/${role.key}`}
                >
                  {registerLabel}
                  <ArrowRight size={21} />
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      <p className={styles.login}>
        {ar ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
        <Link href="/login">{ar ? "تسجيل الدخول" : "Log in"}</Link>
      </p>
    </section>
  )
}
