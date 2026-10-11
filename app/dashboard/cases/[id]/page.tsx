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
  Calendar,
  Mail,
  Phone,
  User,
  ClipboardList,
  History,
  Eye,
  Pencil,
  Send,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"

const assignmentStatusLabels: Record<
  string,
  { en: string; ar: string }
> = {
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
  const { getProfileById } = useProfiles()
  const { getAssignmentsByCase, getVisibleAssignments } = useAssignments(id)
  const { toolTypes, fetchToolTypes } = useToolTypes()
  const { currentUser } = useAuth()

  const [expertRole, setExpertRole] = useState<string | null>(null)
  const [allowedToolTypeIds, setAllowedToolTypeIds] = useState<string[]>([])

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
      if (!currentUser || !id) return
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
        toast.error(getErrorMessage(error))
      }
    }
    fetchExpertRole()
  }, [currentUser, id])

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "الحالة غير موجودة" : "Case not found"}
        </h2>
        <Link href="/dashboard/cases">
          <Button>{lang === "ar" ? "العودة إلى الحالات" : "Back to Cases"}</Button>
        </Link>
      </div>
    )
  }

  return (
    <PaymentGate profile={profile}>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{profile.name}</h1>
          <p className="text-muted-foreground">
            {lang === "ar" ? `أنشئت في ${formatDate(profile.created)}` : `Created ${formatDate(profile.created)}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
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
                    {lang === "ar" ? "التسجيل في التدريب" : "Training Enrollment"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === "ar" ? "نوع الخدمة" : "Service Type"}
                    </span>
                    <span className="font-medium">
                      {lang === "ar" ? "حضور تدريب" : "Attending Training"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === "ar" ? "نوع المشكلة" : "Issue Type"}
                    </span>
                    <span className="font-medium">
                      {profile.service_type ||
                        profile.sub_category ||
                        (lang === "ar" ? "حضور تدريب" : "Attending Training")}
                    </span>
                  </div>
                  <div className="flex justify-between">
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
                        {lang === "ar" ? "الانضمام للاجتماع" : "Join Meeting"}
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
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {lang === "ar" ? "معلومات الحالة" : "Case Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                      </span>
                      <span className="font-medium">
                        {profile.date_of_birth
                          ? formatDate(profile.date_of_birth)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "الجنس" : "Gender"}
                      </span>
                      <span className="font-medium capitalize">
                        {profile.gender === "male"
                          ? lang === "ar"
                            ? "ذكر"
                            : "male"
                          : profile.gender === "female"
                            ? lang === "ar"
                              ? "أنثى"
                              : "female"
                            : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "الصف الدراسي" : "Grade"}
                      </span>
                      <span className="font-medium capitalize">
                        {profile.grade || "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {profile.notes && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>{lang === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{profile.notes}</p>
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
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {lang === "ar" ? "المهام المكلف بها" : "Assigned Tasks"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "المهام المكلف بها لهذه الحالة"
                  : "Tasks assigned to this profile"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roleFilteredAssignments.length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar" ? "لا توجد مهام مكلف بها" : "No tasks assigned"}
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
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
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
                        <div className="flex items-center gap-2">
                          {!assignment.is_not_template ? (
                            <Link
                              href={`/dashboard/cases/${id}/tasks/${assignment.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                title={lang === "ar" ? "الإجابة" : "Respond"}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/cases/${id}/tasks/${assignment.id}`}
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
                          {assignment.status === "completed" && !assignment.is_not_template && (
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
                            {assignmentStatusLabels[assignment.status]?.[lang] || assignment.status}
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
              <CardTitle className="flex items-center gap-2">
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
              {assignments.filter((a) => a.status === "completed").length ===
              0 ? (
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
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">
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
  )
}
