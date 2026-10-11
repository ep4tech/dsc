"use client"

import Link from "next/link"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { usePortals } from "@/hooks/usePortals"
import Image from "next/image"

export function FooterSection() {
  const { lang } = useLang()
  const { portals: PORTALS } = usePortals()

  return (
    <footer id="contact" className="scroll-mt-16" style={{ backgroundColor: "#0b1a30" }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-4">
        <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="DSC Logo" width={32} height={32} className="object-contain" />
              <div>
                <span className="text-lg font-bold text-white">DSC</span>
                <p className="text-xs" style={{ color: "#00a4e4" }}>
                  {t(
                          {
                            en: "Development Secrets Consultancy",
                            ar: "استشارية أسرار التطور",
                          },
                          lang
                        )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://wa.me/message/XGN76UVRTVL7C1"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-[#00a4e4] transition-colors text-base md:h-auto md:w-auto"
              >
                <i className="fab fa-whatsapp" />
              </a>
              <a
                href="https://www.facebook.com/share/17cqyrgK7t/"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-[#00a4e4] transition-colors text-base md:h-auto md:w-auto"
              >
                <i className="fab fa-facebook-f" />
              </a>
              <a
                href="https://www.instagram.com/drgeniusdsc?igsh=MXI2eHl5djJ2N2phbA=="
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-[#00a4e4] transition-colors text-base md:h-auto md:w-auto"
              >
                <i className="fab fa-instagram" />
              </a>
              <a
                href="https://x.com/DrGeniusDSC"
                aria-label="X"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-[#00a4e4] transition-colors text-base md:h-auto md:w-auto"
              >
                <i className="fab fa-twitter" />
              </a>
              <a
                href="https://www.linkedin.com/in/radwan-abusaif-ab5089323?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-[#00a4e4] transition-colors text-base md:h-auto md:w-auto"
              >
                <i className="fab fa-linkedin-in" />
              </a>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-start md:text-center text-white">
              {t({ en: "Main Portals", ar: "البوابات الرئيسية" }, lang)}
            </h3>
            <nav className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:gap-x-4">
              {PORTALS.map((portal, i) => (
                <Link
                  key={i}
                  href={`/portal/${portal.id}`}
                  className="inline-flex min-h-11 items-center text-sm text-white/75 transition-colors hover:text-white md:min-h-0"
                >
                  {t(portal.portalName, lang)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-start text-white md:text-center">
              {t({ en: "Contact Us", ar: "تواصل معنا" }, lang)}
            </h3>
            <div className="grid grid-cols-1 gap-y-1 text-sm text-white/60 md:grid-cols-2 md:gap-x-4">
              <p>
                <a
                  href="tel:+962780127435"
                  className="hover:text-[#00a4e4]"
                >
                  {t(
                    {
                      en: "+962 78012 7435",
                      ar: "+962 78012 7435",
                    },
                    lang
                  )}
                </a>
              </p>
              <p> 
              <a 
                href="mailto:support@dsc.ac"
                className="hover:text-[#00a4e4]"
              >
              support@dsc.ac
              </a>
              </p>
              <p>www.dsc.ac</p>
              <p>
                {t(
                  {
                     en: "Amman / Jordan",
                      ar: "عمان / الأردن",
                  },
                  lang
                )}
              </p>
            </div>

          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-3 text-center text-xs text-white/40 md:mt-3 md:pt-2">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-[#00a4e4]"
            >
              {t({ en: "Privacy Policy", ar: "سياسة الخصوصية" }, lang)}
            </Link>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <Link
              href="/terms"
              className="transition-colors hover:text-[#00a4e4]"
            >
              {t({ en: "Terms of Service", ar: "شروط الخدمة" }, lang)}
            </Link>
          </div>
          <div className="mt-1">
            © 2026 Development Secrets Consultancy.{" "}
            {t({ en: "All rights reserved.", ar: "جميع الحقوق محفوظة." }, lang)}
          </div>
        </div>
      </div>
    </footer>
  )
}
