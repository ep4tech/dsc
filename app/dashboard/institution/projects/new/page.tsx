"use client"

import { useState } from "react"
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
import { useLang } from "@/lib/lang-context"
import { projectCaseData, validateProject } from "@/lib/project-validation"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"

export default function NewProjectPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const { lang } = useLang()
  const { addProfile } = useProfiles()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [projectType, setProjectType] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !currentUser ||
      !["organization", "admin", "super_admin"].includes(currentUser.role)
    ) {
      setError(
        lang === "ar"
          ? "لا تملك صلاحية إنشاء مشروع."
          : "You do not have permission to create a project."
      )
      return
    }
    const draft = { name, projectType, description, startDate, endDate }
    const validation = validateProject(draft, lang)
    setError(validation)
    if (validation) return

    setIsSubmitting(true)

    try {
      const profileId = await addProfile({
        user: currentUser.id,
        ...projectCaseData(draft),
        status: "pending",
      })

      toast.success(
        lang === "ar"
          ? "تم إنشاء المشروع بنجاح"
          : "Project created successfully"
      )

      router.push(`/dashboard/institution/projects/${profileId}`)
    } catch (error) {
      console.error("Failed to create project:", error)
      setError(getErrorMessage(error, lang))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {lang === "ar" ? "إنشاء مشروع جديد" : "Create New Project"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "املأ تفاصيل المشروع"
            : "Fill in the project details"}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle>
              {lang === "ar" ? "معلومات المشروع" : "Project Information"}
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? "التفاصيل الأساسية حول المشروع"
                : "Basic details about the project"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {lang === "ar" ? "اسم المشروع" : "Project Name"}
                <span className="ms-1 text-red-500">*</span>
              </Label>
              <Input
                id="name"
                minLength={3}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  {lang === "ar" ? "تاريخ البدء" : "Start Date"}
                  <span className="ms-1 text-red-500">*</span>
                </Label>
                <DateInput
                  id="start_date"
                  value={startDate}
                  onChange={setStartDate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">
                  {lang === "ar" ? "تاريخ الانتهاء" : "End Date"}
                </Label>
                <DateInput
                  id="end_date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">
                {lang === "ar" ? "نوع المشروع" : "Project Type"}
              </Label>
              <Input
                id="project_type"
                maxLength={100}
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder={
                  lang === "ar"
                    ? "مثال: استشاري، تدريبي، بحثي"
                    : "e.g. Consulting, Training, Research"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {lang === "ar" ? "الوصف" : "Description"}
              </Label>
              <Textarea
                id="description"
                maxLength={3000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  lang === "ar"
                    ? "اشرح تفاصيل المشروع..."
                    : "Describe the project details..."
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? lang === "ar"
                ? "جارٍ الإنشاء..."
                : "Creating..."
              : lang === "ar"
                ? "إنشاء مشروع"
                : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  )
}
