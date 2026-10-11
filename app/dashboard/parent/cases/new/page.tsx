"use client"

import pb from "@/lib/pb"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfiles } from "@/hooks/useProfiles"
import { useAuth } from "@/hooks/useAuth"
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
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { usePortals } from "@/hooks/usePortals"
import { trainingProgramsCollection } from "@/lib/pb-training"
import type { TrainingProgram } from "@/types/training"
import { type PortalServiceValue } from "@/components/register/PortalServiceSelector"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"

const OTHER_VALUE = "other"
const TRAINING_SERVICE_ID = "attending-training"

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

export default function NewProfilePage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const { lang } = useLang()
  const { portals: PORTALS } = usePortals()
  const { addProfile } = useProfiles()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    gender: "",
    grade: "",
    relationship: "",
    notes: "",
  })

  const [portalService, setPortalService] = useState<PortalServiceValue>({
    categoryId: "",
    subCategoryId: "",
    customCategory: "",
    customSubCategory: "",
  })

  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>(
    []
  )
  const [trainingProgramsLoading, setTrainingProgramsLoading] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState("")

  const isTrainingSelected =
    portalService.categoryId === TRAINING_SERVICE_ID ||
    portalService.subCategoryId === TRAINING_SERVICE_ID

  const isIndividual = currentUser?.role === "individual"
  const showBasicDetails = !isIndividual

  useEffect(() => {
    if (!isTrainingSelected) {
      setSelectedProgramId("")
      setTrainingPrograms([])
      return
    }
    let cancelled = false
    setTrainingProgramsLoading(true)
    trainingProgramsCollection
      .getPublished()
      .then((data) => {
        if (cancelled) return
        const today = new Date().toISOString().slice(0, 10)
        const running = data
          .filter((p) => today <= p.schedule.endDate)
          .sort((a, b) =>
            a.schedule.endDate < b.schedule.endDate ? -1 : 1
          )
        setTrainingPrograms(running)
      })
      .catch((err) => {
        console.error("Failed to load training programs:", err)
      })
      .finally(() => {
        if (!cancelled) setTrainingProgramsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isTrainingSelected])

  const handleServiceTypeChange = (value: string) => {
    if (value === TRAINING_SERVICE_ID) {
      setPortalService({
        categoryId: TRAINING_SERVICE_ID,
        subCategoryId: "",
        customCategory: "",
        customSubCategory: "",
      })
    } else {
      setPortalService({
        categoryId: value,
        subCategoryId: "",
        customCategory: "",
        customSubCategory: "",
      })
    }
  }

  const handleCaseTypeChange = (value: string) => {
    if (isTrainingSelected) {
      setSelectedProgramId(value)
    } else {
      setPortalService({
        ...portalService,
        subCategoryId: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsSubmitting(true)

    try {
      const isTraining = isTrainingSelected && selectedProgramId
      const selectedProgram = isTraining
        ? trainingPrograms.find((p) => p.id === selectedProgramId)
        : null

      const profileId = await addProfile({
        user: currentUser.id,
        name: isTraining
          ? selectedProgram?.title[lang] ||
            (lang === "ar" ? "التسجيل في التدريب" : "Training Enrollment")
          : formData.name,
        date_of_birth: isTraining ? "" : formData.date_of_birth,
        gender: isTraining ? undefined : (formData.gender as "male" | "female"),
        grade: isTraining ? "" : formData.grade,
        relationship: isTraining ? undefined : formData.relationship,
        notes: formData.notes,
        portal_type: isTraining ? "Attending Training" : portalService.categoryId,
        service_type: isTraining
          ? selectedProgram?.title[lang]
          : portalService.subCategoryId.trim(),
        program_id: isTraining ? selectedProgramId : undefined,
        training_link: isTraining
          ? selectedProgram?.meetingLink ||
            `/programmes/training_programmes/${selectedProgramId}`
          : undefined,
        program_status: isTraining ? "enrolled" : undefined,
        status: "pending",
        user_details: isTraining
          ? {
              name: currentUser.name,
              email: currentUser.email,
              contact: currentUser.contact_number,
            }
          : undefined,
        case_details: isTraining
          ? undefined
          : {
              custom_category:
                portalService.categoryId === OTHER_VALUE
                  ? portalService.customCategory
                  : undefined,
              custom_sub_category:
                portalService.subCategoryId.trim() || undefined,
            },
      })

      const caseName = isTraining
        ? selectedProgram?.title[lang] ||
          (lang === "ar" ? "التسجيل في التدريب" : "Training Enrollment")
        : formData.name

      fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pb.authStore.token}` },
        body: JSON.stringify({
          text: [
            "*New Case Needs Payment Amount*",
            "",
            `*Case:* ${caseName}`,
            `*User:* ${currentUser.name} (${currentUser.email})`,
            `*Service:* ${portalService.subCategoryId || portalService.categoryId || "-"}`,
          ].join("\n"),
        }),
      }).catch(() => {})

      router.push(`/dashboard/parent/cases/${profileId}`)
    } catch (error) {
      console.error("Failed to create profile:", error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {lang === "ar" ? "إنشاء حالة جديدة" : "Create New Case"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar" ? "املأ تفاصيل الحالة" : "Fill in the case details"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {showBasicDetails && (
          <Card>
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "معلومات الحالة" : "Case Information"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "التفاصيل الأساسية حول الحالة"
                  : "Basic details about the case"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {lang === "ar" ? "اسم الحالة" : "Case Name"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">
                    {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                  </Label>
                  <DateInput
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={(v) =>
                      setFormData({ ...formData, date_of_birth: v })
                    }
                    maxDate={new Date()}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    {lang === "ar" ? "الجنس" : "Gender"}
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          lang === "ar" ? "اختر الجنس" : "Select gender"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">
                        {lang === "ar" ? "ذكر" : "Male"}
                      </SelectItem>
                      <SelectItem value="female">
                        {lang === "ar" ? "أنثى" : "Female"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">
                  {lang === "ar" ? "الصف الدراسي" : "Grade"}
                </Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={lang === "ar" ? "اختر الصف" : "Select grade"}
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
                <Label htmlFor="relationship">
                  {lang === "ar" ? "صلة القرابة بالطفل" : "Relationship to Child"}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) =>
                    setFormData({ ...formData, relationship: e.target.value })
                  }
                  placeholder={lang === "ar" ? "مثال: أب" : "e.g. Father"}
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={showBasicDetails ? "mt-6" : ""}>
          <CardHeader>
            <CardTitle>
              {t({ en: "Service Type", ar: "نوع الخدمة" }, lang)}
            </CardTitle>
            <CardDescription>
              {t(
                {
                  en: "Select the service this case belongs to",
                  ar: "اختر الخدمة التي تنتمي إليها هذه الحالة",
                },
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
                  <SelectItem value={TRAINING_SERVICE_ID}>
                    {t(
                      { en: "Attending Training", ar: "حضور تدريب" },
                      lang
                    )}
                  </SelectItem>
                  <SelectItem value={OTHER_VALUE}>
                    {t({ en: "Other", ar: "أخرى" }, lang)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTrainingSelected ? (
              <div className="space-y-2">
                <Label>
                  {t({ en: "Case Type", ar: "نوع الحالة" }, lang)}
                  <span className="text-red-500 ms-1">*</span>
                </Label>
                <Select
                  value={selectedProgramId}
                  onValueChange={handleCaseTypeChange}
                  disabled={trainingProgramsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        trainingProgramsLoading
                          ? t(
                              { en: "Loading...", ar: "جاري التحميل..." },
                              lang
                            )
                          : t(
                              {
                                en: "Select a training program",
                                ar: "اختر برنامج تدريبي",
                              },
                              lang
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingPrograms.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        {t(
                          {
                            en: "No programs with open enrollment",
                            ar: "لا توجد برامج مفتوحة للتسجيل",
                          },
                          lang
                        )}
                      </SelectItem>
                    ) : (
                      trainingPrograms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title[lang]}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {portalService.categoryId === OTHER_VALUE && (
                  <div className="space-y-2">
                    <Label>
                      {t(
                        {
                          en: "Custom service type",
                          ar: "اسم نوع الخدمة المخصص",
                        },
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

                {portalService.categoryId && (
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
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {t({ en: "Explain more", ar: "اشرح أكثر" }, lang)}  <span className="text-red-500 ms-1">*</span>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                id="notes"
                value={formData.notes}
                required
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
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (isTrainingSelected && !selectedProgramId)
            }
          >
            {isSubmitting
              ? lang === "ar"
                ? "جارٍ الإنشاء..."
                : "Creating..."
              : lang === "ar"
                ? "إنشاء الحالة"
                : "Create Case"}
          </Button>
        </div>
      </form>
    </div>
  )
}
