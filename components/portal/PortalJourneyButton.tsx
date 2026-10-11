"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { portalJourneyHref } from "@/lib/portal-journey"
import type { BilingualString } from "@/types/form"

export function PortalJourneyButton({
  portalId,
  registrationType,
  label,
  className,
  style,
}: {
  portalId: string
  registrationType?: "parent" | "individual" | "organization" | "expert"
  label: BilingualString
  className?: string
  style?: CSSProperties
}) {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  const { lang } = useLang()
  const router = useRouter()
  return (
    <Button
      size="lg"
      className={className}
      style={style}
      disabled={isLoading}
      onClick={() =>
        router.push(
          portalJourneyHref(
            portalId,
            isAuthenticated ? currentUser?.role : undefined,
            registrationType
          )
        )
      }
    >
      {t(label, lang)}
    </Button>
  )
}
