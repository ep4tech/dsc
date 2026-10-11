"use client"
import { Button } from "./button"
import { useLang } from "@/lib/lang-context"
export function DataError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const { lang } = useLang()
  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm"
    >
      <p className="font-medium text-destructive">
        {lang === "ar"
          ? "تعذر تحميل البيانات. يرجى المحاولة مرة أخرى."
          : "Unable to load data. Please try again."}
      </p>
      <p className="break-words text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </Button>
      )}
    </div>
  )
}
