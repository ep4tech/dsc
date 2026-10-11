"use client"

import { useState } from "react"
import { useLang } from "@/lib/lang-context"
import { useAuth } from "@/hooks/useAuth"
import { useProfiles } from "@/hooks/useProfiles"
import { usePaymentSettings } from "@/hooks/usePaymentSettings"
import { formatAmount, paymentStatusLabels } from "@/lib/payment"
import type { Profile } from "@/types/profile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Landmark,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  Loader2,
} from "lucide-react"
import pb, { getErrorMessage } from "@/lib/pb"

function Panel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

export function PaymentGate({
  profile,
  noun = "case",
  children,
}: {
  profile: Profile
  noun?: "case" | "project"
  children?: React.ReactNode
}) {
  const { lang } = useLang()
  const { currentUser } = useAuth()
  const { submitPaymentSlip } = useProfiles()
  const { bankDetails } = usePaymentSettings()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = profile.status
  const isStaff =
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin" ||
    currentUser?.role === "expert"

  // Staff and already-active (or legacy undefined-status) cases pass through
  if (isStaff || status === "active" || !status) {
    return <>{children}</>
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setIsSubmitting(true)
    setError(null)
    try {
      await submitPaymentSlip(profile.id, selectedFile)
      fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pb.authStore.token}` },
        body: JSON.stringify({
          text: [
            "*Payment Slip Uploaded - Needs Review*",
            "",
            `*Case:* ${profile.name}`,
            `*User:* ${currentUser?.name || "-"}`,
          ].join("\n"),
        }),
      }).catch(() => {})
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "pending") {
    return (
      <Panel
        icon={<Clock className="h-6 w-6 text-primary" />}
        title={
          lang === "ar"
            ? noun === "project" ? "مشروعك قيد المراجعة" : "حالتك قيد المراجعة"
            : noun === "project" ? "Your project is being reviewed" : "Your case is being reviewed"
        }
        description={
          lang === "ar"
            ? noun === "project"
              ? "نحن نجهز تفاصيل الدفع لمشروعك. ستصلك رسالة عند توفرها."
              : "نحن نجهز تفاصيل الدفع لحالتك. ستصلك رسالة عند توفرها."
            : noun === "project"
              ? "We are preparing the payment details for your project. You will be notified once they are ready."
              : "We are preparing the payment details for your case. You will be notified once they are ready."
        }
      />
    )
  }

  if (status === "awaiting_payment") {
    return (
      <Panel
        icon={<ReceiptText className="h-6 w-6 text-primary" />}
        title={
          lang === "ar"
            ? noun === "project" ? "مطلوب الدفع لإتمام المشروع" : "مطلوب الدفع لإتمام الحالة"
            : noun === "project" ? "Payment required to activate your project" : "Payment required to activate your case"
        }
        description={
          lang === "ar"
            ? "يرجى تحويل المبلغ ورفع إيصال التحويل البنكي أدناه."
            : "Please transfer the amount and upload your bank transfer receipt below."
        }
      >
        <div className="space-y-4">
          {profile.payment_reject_reason && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">
                  {lang === "ar"
                    ? "تم رفض إيصال الدفع السابق"
                    : "Your previous receipt was rejected"}
                </p>
                <p>{profile.payment_reject_reason}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">
              {lang === "ar" ? "المبلغ المطلوب" : "Amount due"}
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatAmount(profile.payment_amount, bankDetails.currency)}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              {lang === "ar" ? "بيانات التحويل البنكي" : "Bank transfer details"}
            </p>
            <div className="space-y-2 text-sm">
              {bankDetails.bank_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "البنك" : "Bank"}
                  </span>
                  <span className="font-medium">{bankDetails.bank_name}</span>
                </div>
              )}
              {bankDetails.beneficiary && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "اسم المستفيد" : "Beneficiary"}
                  </span>
                  <span className="font-medium">{bankDetails.beneficiary}</span>
                </div>
              )}
              {bankDetails.account_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "رقم الحساب" : "Account number"}
                  </span>
                  <span className="font-medium">{bankDetails.account_number}</span>
                </div>
              )}
              {bankDetails.iban && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN</span>
                  <span className="font-medium" dir="ltr">
                    {bankDetails.iban}
                  </span>
                </div>
              )}
              {!bankDetails.bank_name &&
                !bankDetails.account_number &&
                !bankDetails.iban &&
                !bankDetails.beneficiary && (
                  <p className="text-muted-foreground">
                    {lang === "ar"
                      ? "سيتم توفير بيانات التحويل قريبًا."
                      : "Bank transfer details will be available soon."}
                  </p>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_slip">
              {lang === "ar" ? "إيصال التحويل" : "Transfer receipt"}
            </Label>
            <Input
              id="payment_slip"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "صورة أو ملف PDF للإيصال البنكي."
                : "An image or PDF of the bank receipt."}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="me-2 h-4 w-4" />
            )}
            {isSubmitting
              ? lang === "ar"
                ? "جارٍ الرفع..."
                : "Uploading..."
              : lang === "ar"
                ? "رفع الإيصال وإرسال"
                : "Upload Receipt & Submit"}
          </Button>
        </div>
      </Panel>
    )
  }

  if (status === "under_review") {
    const slipUrl = profile.payment_slip
      ? pb.files.getURL(
          { collectionId: "cases", id: profile.id },
          profile.payment_slip
        )
      : null
    return (
      <Panel
        icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
        title={
          lang === "ar"
            ? "الدفع قيد المراجعة"
            : paymentStatusLabels.under_review[lang]
        }
        description={
          lang === "ar"
            ? noun === "project"
              ? "تم استلام إيصالك ونحن نتحقق منه. سيتم تفعيل مشروعك فور التأكيد."
              : "تم استلام إيصالك ونحن نتحقق منه. سيتم تفعيل حالتك فور التأكيد."
            : noun === "project"
              ? "We received your receipt and are verifying it. Your project will be activated once confirmed."
              : "We received your receipt and are verifying it. Your case will be activated once confirmed."
        }
      >
        {slipUrl && (
          <a
            href={slipUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline"
          >
            {lang === "ar" ? "عرض الإيصال المرفوع" : "View uploaded receipt"}
          </a>
        )}
      </Panel>
    )
  }

  return <>{children}</>
}
