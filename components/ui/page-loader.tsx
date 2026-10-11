"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang-context"

interface PageLoaderProps {
  text?: string
  className?: string
  minHeight?: string
}

export function PageLoader({
  text,
  className,
  minHeight = "min-h-[400px]",
}: PageLoaderProps) {
  const { lang } = useLang()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center",
        minHeight,
        className
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">
        {text ?? (lang === "ar" ? "جارٍ التحميل..." : "Loading...")}
      </p>
    </div>
  )
}
