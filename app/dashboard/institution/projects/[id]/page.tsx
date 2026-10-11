"use client"
import { CaseFeedback } from "@/components/cases/CaseFeedback"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfiles } from "@/hooks/useProfiles"
import { useAssignments } from "@/hooks/useAssignments"
import { useToolTypes } from "@/hooks/useToolTypes"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { getToolTypeLabel } from "@/lib/tool-types"
import { formatDate } from "@/lib/format-date"
import { caseExpertsCollection } from "@/lib/pb-collections"
import { getAllowedToolTypesForRole } from "@/lib/pb-collections"
import { PaymentGate } from "@/components/cases/PaymentGate"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  User,
  ClipboardList,
  History,
  Eye,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { PageLoader } from "@/components/ui/page-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateInput } from "@/components/ui/date-input"
import {
  projectCaseData,
  validateProject,
  type ProjectDraft,
} from "@/lib/project-validation"
import { getErrorMessage } from "@/lib/pb"

const assignmentStatusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  assigned: { en: "Assigned", ar: "تم التعيين" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
}

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { lang } = useLang()
  const { getProfileById, updateProfile, isLoading } = useProfiles()
  const { getAssignmentsByCase, getVisibleAssignments } = useAssignments(id)
  const { toolTypes, fetchToolTypes } = useToolTypes()
  const { currentUser } = useAuth()

  const [expertRole, setExpertRole] = useState<string | null>(null)
  const [allowedToolTypeIds, setAllowedToolTypeIds] = useState<string[]>([])

  const [draft, setDraft] = useState<ProjectDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const profile = getProfileById(id)
  const assignments = getAssignmentsByCase(id)
  const visibleAssignments = getVisibleAssignments(id)

  // Filter visible assignments by role-based tool type permissions
  const roleFilteredAssignments =
    expertRole && allowedToolTypeIds.length > 0
      ? visibleAssignments.filter((a) => allowedToolTypeIds.includes(a.type))
      : visibleAssignments

  useEffect(() => {
    fetchToolTypes()
  }, [fetchToolTypes])

  useEffect(() => {
    async function fetchExpertRole() {
      if (!currentUser || !id || currentUser.role !== "expert") return
      try {
        const caseExpert = await caseExpertsCollection.getByCaseAndExpert(
          id,
          currentUser.id
        )
        if (caseExpert?.role) {
          setExpertRole(caseExpert.role)
          const allowed = await getAllowedToolTypesForRole(caseExpert.role)
          setAllowedToolTypeIds(allowed)
        }
      } catch (error) {
        console.error("Failed to fetch expert role:", error)
        toast.error(getErrorMessage(error, lang))
      }
    }
    fetchExpertRole()
  }, [currentUser, id, lang])

  const canEdit =
    !!profile &&
    !!currentUser &&
    (currentUser.role === "admin" ||
      currentUser.role === "super_admin" ||
      (currentUser.role === "organization" && profile.user === currentUser.id))
  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft || !profile || !canEdit) return
    const validation = validateProject(draft, lang)
    setSaveError(validation)
    if (validation) return
    setSaving(true)
    try {
      await updateProfile(
        profile.id,
        projectCaseData(draft, profile.case_details)
      )
      setDraft(null)
      toast.success(lang === "ar" ? "تم حفظ المشروع." : "Project saved.")
    } catch (error) {
      setSaveError(getErrorMessage(error, lang))
    } finally {
      setSaving(false)
    }
  }
  if (isLoading)
    return (
      <PageLoader
        text={lang === "ar" ? "جارٍ تحميل المشروع..." : "Loading project..."}
      />
    )
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "المشروع غير موجود" : "Project not found"}
        </h2>
        <Link href="/dashboard/institution/projects">
          <Button>
            {lang === "ar" ? "العودة إلى المشاريع" : "Back to Projects"}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {canEdit && profile.portal_type !== "Attending Training" && (
        <Card className="mb-6">
          <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
            <div>
              <CardTitle>
                {lang === "ar"
                  ? "إدارة تفاصيل المشروع"
                  : "Manage project details"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "يمكنك تعديل التفاصيل دون تغيير المدفوعات أو المهام."
                  : "Update project details while keeping payments and tasks."}
              </CardDescription>
            </div>
            {!draft && (
              <Button
                variant="outline"
                onClick={() => {
                  setSaveError(null)
                  setDraft({
                    name: profile.name,
                    projectType: profile.grade || "",
                    description: profile.notes || "",
                    startDate: String(
                      profile.case_details?.start_date ||
                        profile.date_of_birth ||
                        ""
                    ).slice(0, 10),
                    endDate: String(profile.case_details?.end_date || "").slice(
                      0,
                      10
                    ),
                  })
                }}
              >
                <Pencil className="me-2 h-4 w-4" />
                {lang === "ar" ? "تعديل" : "Edit"}
              </Button>
            )}
          </CardHeader>
          {draft && (
            <CardContent>
              <form noValidate onSubmit={saveProject} className="space-y-4">
                {saveError && (
                  <p
                    role="alert"
                    className="rounded-md bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {saveError}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-project-name">
                    {lang === "ar" ? "اسم المشروع" : "Project name"}
                  </Label>
                  <Input
                    id="edit-project-name"
                    required
                    minLength={3}
                    maxLength={120}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-start">
                      {lang === "ar" ? "تاريخ البدء" : "Start date"}
                    </Label>
                    <DateInput
                      id="edit-project-start"
                      value={draft.startDate}
                      onChange={(startDate) =>
                        setDraft({ ...draft, startDate })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-end">
                      {lang === "ar" ? "تاريخ الانتهاء" : "End date"}
                    </Label>
                    <DateInput
                      id="edit-project-end"
                      value={draft.endDate}
                      minDate={draft.startDate || undefined}
                      onChange={(endDate) => setDraft({ ...draft, endDate })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-type">
                    {lang === "ar" ? "نوع المشروع" : "Project type"}
                  </Label>
                  <Input
                    id="edit-project-type"
                    maxLength={100}
                    value={draft.projectType}
                    onChange={(e) =>
                      setDraft({ ...draft, projectType: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-description">
                    {lang === "ar" ? "الوصف" : "Description"}
                  </Label>
                  <Textarea
                    id="edit-project-description"
                    maxLength={3000}
                    rows={4}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setDraft(null)}
                  >
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button disabled={saving}>
                    {saving
                      ? lang === "ar"
                        ? "جارٍ الحفظ..."
                        : "Saving..."
                      : lang === "ar"
                        ? "حفظ التغييرات"
                        : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}
      <PaymentGate profile={profile} noun="project">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="min-w-0 text-2xl font-bold text-primary [overflow-wrap:anywhere]">
                {profile.name}
              </h1>
              <p className="text-muted-foreground">
                {lang === "ar"
                  ? `أنشئت في ${formatDate(profile.created)}`
                  : `Created ${formatDate(profile.created)}`}
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="overview">
                {lang === "ar" ? "نظرة عامة" : "Overview"}
              </TabsTrigger>
              <TabsTrigger value="tasks">
                {lang === "ar" ? "المهام" : "Tasks"}
                {roleFilteredAssignments.length > 0 && (
                  <Badge variant="secondary" className="ms-2">
                    {roleFilteredAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="case-file">
                {lang === "ar" ? "السجل" : "History"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 lg:grid-cols-2">
                {profile.portal_type === "Attending Training" ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {lang === "ar"
                          ? "التسجيل في التدريب"
                          : "Training Enrollment"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex min-w-0 flex-wrap justify-between gap-2">
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "نوع الخدمة" : "Service Type"}
                        </span>
                        <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
                          {lang === "ar" ? "حضور تدريب" : "Attending Training"}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-wrap justify-between gap-2">
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "نوع المشكلة" : "Issue Type"}
                        </span>
                        <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
                          {profile.service_type ||
                            profile.sub_category ||
                            (lang === "ar"
                              ? "حضور تدريب"
                              : "Attending Training")}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-wrap justify-between gap-2">
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "الحالة" : "Status"}
                        </span>
                        <Badge variant="secondary">
                          {profile.program_status === "enrolled"
                            ? lang === "ar"
                              ? "مسجل"
                              : "enrolled"
                            : profile.program_status}
                        </Badge>
                      </div>
                      {profile.training_link && (
                        <Link
                          href={profile.training_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block"
                        >
                          <Button variant="default" className="w-full">
                            {lang === "ar"
                              ? "الانضمام للاجتماع"
                              : "Join Meeting"}
                          </Button>
                        </Link>
                      )}
                      {profile.program_id && (
                        <Link
                          href={`/programmes/training_programmes/${profile.program_id}`}
                          className="mt-2 block"
                        >
                          <Button variant="outline" className="w-full">
                            {lang === "ar"
                              ? "عرض البرنامج التدريبي"
                              : "View Training Program"}
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                          <User className="h-5 w-5" />
                          {lang === "ar"
                            ? "معلومات المشروع"
                            : "Project Information"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex min-w-0 flex-wrap justify-between gap-2">
                          <span className="text-muted-foreground">
                            {lang === "ar" ? "تاريخ البدء" : "Start Date"}
                          </span>
                          <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
                            {profile.date_of_birth
                              ? formatDate(profile.date_of_birth)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-wrap justify-between gap-2">
                          <span className="text-muted-foreground">
                            {lang === "ar" ? "تاريخ الانتهاء" : "End Date"}
                          </span>
                          <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
                            {(() => {
                              const endDate = (
                                profile.case_details as Record<string, unknown>
                              )?.end_date
                              return endDate
                                ? formatDate(endDate as string)
                                : "—"
                            })()}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-wrap justify-between gap-2">
                          <span className="text-muted-foreground">
                            {lang === "ar" ? "نوع المشروع" : "Project Type"}
                          </span>
                          <span className="min-w-0 font-medium capitalize [overflow-wrap:anywhere]">
                            {profile.grade || "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {profile.notes && (
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle>
                            {lang === "ar" ? "الوصف" : "Description"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="min-w-0 whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">
                            {profile.notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    {lang === "ar" ? "المهام المكلف بها" : "Assigned Tasks"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar"
                      ? "المهام المكلف بها لهذا المشروع"
                      : "Tasks assigned to this profile"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roleFilteredAssignments.length === 0 ? (
                    <div className="py-8 text-center">
                      <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-medium">
                        {lang === "ar"
                          ? "لا توجد مهام مكلف بها"
                          : "No tasks assigned"}
                      </h3>
                      <p className="text-muted-foreground">
                        {lang === "ar"
                          ? "ستظهر المهام هنا بمجرد تكليفها من قبل المشرف"
                          : "Tasks will appear here once assigned by an admin"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roleFilteredAssignments.map((assignment) => {
                        const toolType = toolTypes.find(
                          (t) => t.id === assignment.type
                        )
                        const toolTypeName = getToolTypeLabel(toolType, lang)
                        return (
                          <div
                            key={assignment.id}
                            className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <p className="min-w-0 font-medium [overflow-wrap:anywhere]">
                                  {lang === "ar"
                                    ? assignment.name_ar || assignment.name_en
                                    : assignment.name_en}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {toolTypeName}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              {!assignment.is_not_template ? (
                                <Link
                                  href={`/dashboard/institution/projects/${id}/tasks/${assignment.id}`}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title={
                                      lang === "ar" ? "الإجابة" : "Respond"
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                              ) : (
                                <Link
                                  href={`/dashboard/institution/projects/${id}/tasks/${assignment.id}`}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title={lang === "ar" ? "عرض" : "View"}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {assignment.status === "completed" &&
                                !assignment.is_not_template && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const responses = assignment.responses
                                      if (
                                        responses &&
                                        Object.keys(responses).length > 0
                                      ) {
                                        const printWindow = window.open(
                                          "",
                                          "_blank",
                                          "width=800,height=600"
                                        )
                                        if (printWindow) {
                                          printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${assignment.name_en || (lang === "ar" ? "الردود" : "Responses")}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; padding: 20px; }
                                          h1 { margin-bottom: 10px; }
                                          .meta { color: #666; margin-bottom: 20px; }
                                          .response { margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
                                          .question { font-weight: bold; margin-bottom: 5px; }
                                          @media print { .no-print { display: none; } }
                                        </style>
                                      </head>
                                      <body>
                                        <h1>${assignment.name_en || (lang === "ar" ? "الردود" : "Responses")}</h1>
                                        <p class="meta">${lang === "ar" ? "الحالة" : "Profile"}: ${profile.name} | ${lang === "ar" ? "التاريخ" : "Date"}: ${formatDate(assignment.updated)}</p>
                                        <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 4px;">${JSON.stringify(responses, null, 2)}</pre>
                                        <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">${lang === "ar" ? "طباعة / حفظ كـ PDF" : "Print / Save as PDF"}</button>
                                      </body>
                                    </html>
                                  `)
                                          printWindow.document.close()
                                        }
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              <Badge
                                variant={
                                  assignment.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {assignmentStatusLabels[assignment.status]?.[
                                  lang
                                ] || assignment.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="case-file">
              <Card>
                <CardHeader>
                  <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                    <History className="h-5 w-5" />
                    {lang === "ar" ? "السجل" : "History"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar"
                      ? "ستكون المهام المكتملة هنا"
                      : "Completed Tasks will be here"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignments.filter((a) => a.status === "completed")
                    .length === 0 ? (
                    <div className="py-8 text-center">
                      <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-medium">
                        {lang === "ar" ? "لا يوجد سجل بعد" : "No history yet"}
                      </h3>
                      <p className="text-muted-foreground">
                        {lang === "ar"
                          ? "ستظهر المهام المكتملة هنا"
                          : "Completed tasks will appear here"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments
                        .filter((a) => a.status === "completed")
                        .map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <div>
                              <p className="min-w-0 font-medium [overflow-wrap:anywhere]">
                                {lang === "ar"
                                  ? assignment.name_ar || assignment.name_en
                                  : assignment.name_en}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {lang === "ar" ? "أكملت في" : "Completed"}{" "}
                                {assignment.updated &&
                                  formatDate(assignment.updated)}
                              </p>
                            </div>
                            <Badge variant="default">
                              {lang === "ar" ? "مكتمل" : "Completed"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <CaseFeedback caseId={profile.id} ownerId={profile.user} />
        </div>
      </PaymentGate>
    </>
  )
}
