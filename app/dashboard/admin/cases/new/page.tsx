"use client"

import pb from "@/lib/pb"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfiles } from "@/hooks/useProfiles"
import { useUsers } from "@/hooks/useUsers"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { usePortals } from "@/hooks/usePortals"
import { getErrorMessage } from "@/lib/pb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link2 } from "lucide-react"

const OTHER_VALUE = "other"

const GRADES = [
  { value: "kg1", label: { en: "KG 1", ar: "روضة 1" } },
  { value: "kg2", label: { en: "KG 2", ar: "روضة 2" } },
  { value: "grade1", label: { en: "Grade 1", ar: "الصف الأول" } },
  { value: "grade2", label: { en: "Grade 2", ar: "الصف الثاني" } },
  { value: "grade3", label: { en: "Grade 3", ar: "الصف الثالث" } },
  { value: "grade4", label: { en: "Grade 4", ar: "الصف الرابع" } },
  { value: "grade5", label: { en: "Grade 5", ar: "الصف الخامس" } },
  { value: "grade6", label: { en: "Grade 6", ar: "الصف السادس" } },
  { value: "grade7", label: { en: "Grade 7", ar: "الصف السابع" } },
  { value: "grade8", label: { en: "Grade 8", ar: "الصف الثامن" } },
  { value: "grade9", label: { en: "Grade 9", ar: "الصف التاسع" } },
  { value: "grade10", label: { en: "Grade 10", ar: "الصف العاشر" } },
  { value: "grade11", label: { en: "Grade 11", ar: "الصف الحادي عشر" } },
  { value: "grade12", label: { en: "Grade 12", ar: "الصف الثاني عشر" } },
  { value: "university", label: { en: "University", ar: "الجامعة" } },
]

export default function AdminNewCasePage() {
  const router = useRouter()
  const { lang } = useLang()
  const { portals: PORTALS } = usePortals()
  const { addProfile } = useProfiles()
  const { users } = useUsers()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    gender: "" as "male" | "female" | "",
    grade: "",
    notes: "",
  })

  const [paymentAmount, setPaymentAmount] = useState("")

  const [portalService, setPortalService] = useState({
    categoryId: "",
    subCategoryId: "",
    customCategory: "",
    customSubCategory: "",
  })

  const [existingUserId, setExistingUserId] = useState("")

  const [result, setResult] = useState<{
    caseId: string
    caseName: string
  } | null>(null)

  const linkableUsers = users.filter(
    (u) => !["admin", "super_admin", "expert"].includes(u.role)
  )

  const handleServiceTypeChange = (value: string) => {
    setPortalService({
      categoryId: value,
      subCategoryId: "",
      customCategory: "",
      customSubCategory: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!portalService.categoryId) {
      setFormError(
        t({ en: "Service type is required.", ar: "نوع الخدمة مطلوب." }, lang)
      )
      return
    }
    if (portalService.categoryId === OTHER_VALUE && !portalService.customCategory) {
      setFormError(
        t({ en: "Custom issue type is required.", ar: "اسم نوع المشكلة المخصص مطلوب." }, lang)
      )
      return
    }
    if (portalService.categoryId !== OTHER_VALUE && !portalService.subCategoryId.trim()) {
      setFormError(
        t({ en: "Case type is required.", ar: "نوع الحالة مطلوب." }, lang)
      )
      return
    }

    setIsSubmitting(true)
    try {
      const userId = existingUserId

      const caseName =
        formData.name ||
        (lang === "ar" ? "حالة جديدة" : "New Case")

      const hasAmount = paymentAmount.trim() !== ""
      const amount = hasAmount ? Number(paymentAmount) : undefined

      const caseId = await addProfile(
        {
          name: caseName,
          date_of_birth: formData.date_of_birth || undefined,
          gender: formData.gender || undefined,
          grade: formData.grade,
          notes: formData.notes,
          portal_type: portalService.categoryId,
          service_type: portalService.subCategoryId.trim(),
          status: hasAmount ? "awaiting_payment" : "pending",
          payment_amount: amount,
          case_details: {
            custom_category:
              portalService.categoryId === OTHER_VALUE
                ? portalService.customCategory
                : undefined,
            custom_sub_category:
              portalService.subCategoryId.trim() || undefined,
          },
        },
        userId
      )

      if (!hasAmount) {
        fetch("/api/telegram-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${pb.authStore.token}` },
          body: JSON.stringify({
            text: [
              "*New Case Needs Payment Amount*",
              "",
              `*Case:* ${caseName}`,
              `*Created by:* admin`,
              `*Service:* ${portalService.subCategoryId || portalService.categoryId || "-"}`,
            ].join("\n"),
          }),
        }).catch(() => {})
      }

      setResult({ caseId, caseName })
    } catch (error) {
      setFormError(
        getErrorMessage(error) ||
          t(
            { en: "Failed to create case. Please try again.", ar: "فشل إنشاء الحالة. حاول مرة أخرى." },
            lang
          )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t({ en: "Case created", ar: "تم إنشاء الحالة" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                { en: "The case has been created and linked to a user.", ar: "تم إنشاء الحالة وربطها بمستخدم." },
                lang
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between rounded-lg border p-4">
              <span className="text-muted-foreground">
                {t({ en: "Case", ar: "الحالة" }, lang)}
              </span>
              <span className="font-medium">{result.caseName}</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/admin/cases")}>
                {t({ en: "Back to Cases", ar: "العودة إلى الحالات" }, lang)}
              </Button>
              <Button onClick={() => router.push(`/dashboard/admin/cases/${result.caseId}`)}>
                {t({ en: "View Case", ar: "عرض الحالة" }, lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t({ en: "Create New Case", ar: "إنشاء حالة جديدة" }, lang)}
        </h1>
        <p className="text-muted-foreground">
          {t(
            { en: "Create a case and link it to a user", ar: "أنشئ حالة واربطها بمستخدم" },
            lang
          )}
        </p>
      </div>

      {formError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t({ en: "Case Information", ar: "معلومات الحالة" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                { en: "Basic details about the case", ar: "التفاصيل الأساسية حول الحالة" },
                lang
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t({ en: "Case Name", ar: "اسم الحالة" }, lang)}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">
                  {t({ en: "Date of Birth", ar: "تاريخ الميلاد" }, lang)}
                </Label>
                <DateInput
                  id="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={(v) =>
                    setFormData({ ...formData, date_of_birth: v })
                  }
                  maxDate={new Date()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">
                  {t({ en: "Gender", ar: "الجنس" }, lang)}
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: value as "male" | "female",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        { en: "Select gender", ar: "اختر الجنس" },
                        lang
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">
                      {t({ en: "Male", ar: "ذكر" }, lang)}
                    </SelectItem>
                    <SelectItem value="female">
                      {t({ en: "Female", ar: "أنثى" }, lang)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">
                {t({ en: "Grade", ar: "الصف الدراسي" }, lang)}
              </Label>
              <Select
                value={formData.grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      { en: "Select grade", ar: "اختر الصف" },
                      lang
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_amount">
                {t({ en: "Payment Amount (optional)", ar: "مبلغ الدفع (اختياري)" }, lang)}
              </Label>
              <Input
                id="payment_amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={t(
                  { en: "Enter amount", ar: "أدخل المبلغ" },
                  lang
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  {
                    en: "If left empty, the case stays in 'awaiting payment' status until you set the amount from the Payments page.",
                    ar: "إذا تُرك فارغًا، تبقى الحالة في انتظار تحديد المبلغ من صفحة المدفوعات.",
                  },
                  lang
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t({ en: "Service Type", ar: "نوع الخدمة" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                { en: "Select the service this case belongs to", ar: "اختر الخدمة التي تنتمي إليها هذه الحالة" },
                lang
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t({ en: "Service Type", ar: "نوع الخدمة" }, lang)}
                <span className="text-red-500 ms-1">*</span>
              </Label>
              <Select
                value={portalService.categoryId}
                onValueChange={handleServiceTypeChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      { en: "Select service type", ar: "اختر نوع الخدمة" },
                      lang
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PORTALS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {lang === "ar"
                        ? p.portalName.ar.replace(/^بوابة /, "")
                        : p.title.en}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_VALUE}>
                    {t({ en: "Other", ar: "أخرى" }, lang)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {portalService.categoryId === OTHER_VALUE && (
              <div className="space-y-2">
                <Label>
                  {t(
                    { en: "Custom service type", ar: "اسم نوع الخدمة المخصص" },
                    lang
                  )}
                  <span className="text-red-500 ms-1">*</span>
                </Label>
                <Input
                  value={portalService.customCategory}
                  onChange={(e) =>
                    setPortalService({
                      ...portalService,
                      customCategory: e.target.value,
                    })
                  }
                  placeholder={t(
                    { en: "Enter service type", ar: "أدخل اسم نوع الخدمة" },
                    lang
                  )}
                />
              </div>
            )}

            {portalService.categoryId &&
              portalService.categoryId !== OTHER_VALUE && (
                <div className="space-y-2">
                  <Label>
                    {t({ en: "Issue Type", ar: "نوع المشكلة" }, lang)}
                    <span className="text-red-500 ms-1">*</span>
                  </Label>
                  <Input
                    value={portalService.subCategoryId}
                    onChange={(e) =>
                      setPortalService({
                        ...portalService,
                        subCategoryId: e.target.value,
                        customSubCategory: "",
                      })
                    }
                    placeholder={t(
                      { en: "Enter issue type", ar: "أدخل اسم نوع المشكلة" },
                      lang
                    )}
                  />
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t({ en: "Link to User", ar: "ربط بمستخدم" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                {
                  en: "Optional — assign this case to a registered user",
                  ar: "اختياري — خصص هذه الحالة لمستخدم مسجل",
                },
                lang
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">            
              <div className="space-y-2">
                <Label>
                  {t({ en: "User", ar: "المستخدم" }, lang)}
                </Label>
                <Select
                  value={existingUserId}
                  onValueChange={setExistingUserId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        { en: "Select a user", ar: "اختر مستخدمًا" },
                        lang
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {linkableUsers.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        {t(
                          { en: "No users available", ar: "لا يوجد مستخدمون" },
                          lang
                        )}
                      </SelectItem>
                    ) : (
                      linkableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
           
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t({ en: "Explain more", ar: "اشرح أكثر" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                {
                  en: "Add any extra context that will help us handle this case",
                  ar: "أضف أي سياق إضافي يساعدنا في التعامل مع هذه الحالة",
                },
                lang
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder={t(
                {
                  en: "Provide more details about the case...",
                  ar: "قدم مزيداً من التفاصيل حول الحالة...",
                },
                lang
              )}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t({ en: "Cancel", ar: "إلغاء" }, lang)}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t({ en: "Creating...", ar: "جارٍ الإنشاء..." }, lang)
              : t({ en: "Create Case", ar: "إنشاء الحالة" }, lang)}
          </Button>
        </div>
      </form>
    </div>
  )
}
