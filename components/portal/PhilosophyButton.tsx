"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import styles from "@/components/internal/internal-theme.module.css"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import type { BilingualString } from "@/types/form"

interface PhilosophyButtonProps {
  philosophy: BilingualString
  compact?: boolean
  className?: string
}

export function PhilosophyButton({
  philosophy,
  compact = false,
  className,
}: PhilosophyButtonProps) {
  const { lang } = useLang()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={compact ? "sm" : "lg"}
          variant={compact ? "outline" : "default"}
          className={
            className ||
            (compact
              ? "h-auto min-h-9 px-2 py-2 text-xs font-semibold whitespace-normal text-current"
              : "px-4 py-3 text-xs font-semibold shadow-lg hover:bg-white/20 lg:px-15 lg:py-6 lg:text-base")
          }
          style={
            compact
              ? undefined
              : {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.7)",
                }
          }
        >
          {t({ en: "Portal Philosophy", ar: "فلسفة البوابة" }, lang)}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={styles.dialog}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <DialogHeader className={styles.dialogHeader}>
          <DialogTitle>
            {t({ en: "Portal Philosophy", ar: "فلسفة البوابة" }, lang)}
          </DialogTitle>
          <DialogDescription>
            {t(
              {
                en: "The principles that guide our support and your journey.",
                ar: "المبادئ التي توجه دعمنا ورحلتك.",
              },
              lang
            )}
          </DialogDescription>
        </DialogHeader>
        <div className={`${styles.dialogBody} ${styles.reading}`}>
          {t(philosophy, lang)}
        </div>
      </DialogContent>
    </Dialog>
  )
}
