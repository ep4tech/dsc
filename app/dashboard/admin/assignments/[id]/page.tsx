"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataError } from "@/components/ui/data-error"
import { ExpertTaskAssignment } from "@/components/dashboard/ExpertTaskAssignment"
import { PageLoader } from "@/components/ui/page-loader"
import { useAuth } from "@/hooks/useAuth"
import { useAssignments } from "@/hooks/useAssignments"
import { useProfiles } from "@/hooks/useProfiles"
import { useToolTypes } from "@/hooks/useToolTypes"
import { useLang } from "@/lib/lang-context"
import { formatDate } from "@/lib/format-date"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SurveyPreview } from "@/components/tool-renderers/SurveyPreview"
import { MultipleChoicePreview } from "@/components/tool-renderers/MultipleChoicePreview"
import { MediaPreview } from "@/components/tool-renderers/MediaPreview"
import { PlanPreview } from "@/components/tool-renderers/PlanPreview"
import { ReportPreview } from "@/components/tool-renderers/ReportPreview"
import { ArrowLeft, FileText, Download, Edit } from "lucide-react"
import Link from "next/link"
import type {
  SurveyConfig,
  MultipleChoiceConfig,
  MediaConfig,
  PlanConfig,
  ReportConfig,
} from "@/types/tool"
import type { AssignmentStatus } from "@/types/assignment"
import { getToolTypeLabel, getToolTypeMeta } from "@/lib/tool-types"

const statusColors: Record<AssignmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
}

const statusLabels: Record<AssignmentStatus, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  assigned: { en: "Assigned", ar: "تم التعيين" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
}

interface AssignmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AssignmentDetailPage({
  params,
}: AssignmentDetailPageProps) {
  const { id: assignmentId } = use(params)
  const router = useRouter()
  const { lang } = useLang()
  const {
    assignments,
    updateAssignment,
    loadError: assignmentsError,
    refresh: refreshAssignments,
    isLoading: assignmentsLoading,
  } = useAssignments()
  const { currentUser } = useAuth()
  const { profiles, isLoading: profilesLoading } = useProfiles()
  const {
    toolTypes,
    isLoading: toolTypesLoading,
    fetchToolTypes,
    getToolTypeById,
  } = useToolTypes()

  const assignment = assignments.find((a) => a.id === assignmentId)
  const profile = assignment
    ? profiles.find((p) => p.id === assignment.case)
    : undefined

  useEffect(() => {
    fetchToolTypes()
  }, [fetchToolTypes])

  const toolType = assignment?.type
    ? getToolTypeById(assignment.type)
    : undefined
  const typeName = toolType?.key || "Unknown"

  const config = assignment?.config

  const isLoading = assignmentsLoading || toolTypesLoading || profilesLoading

  if (isLoading) {
    return <PageLoader />
  }

  if (assignmentsError)
    return <DataError message={assignmentsError} onRetry={refreshAssignments} />

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "لم يتم العثور على المهمة" : "Assignment not found"}
        </h2>
        <Button onClick={() => router.push("/dashboard/admin/assignments")}>
          {lang === "ar" ? "العودة إلى المهام" : "Back to Assignments"}
        </Button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "لم يتم العثور على الحالة" : "Case not found"}
        </h2>
        <p className="mb-4 text-muted-foreground">
          {lang === "ar"
            ? "تم حذف الحالة المرتبطة بهذه المهمة."
            : "The linked case for this assignment was deleted."}
        </p>
        <Button onClick={() => router.push("/dashboard/admin/assignments")}>
          {lang === "ar" ? "العودة إلى المهام" : "Back to Assignments"}
        </Button>
      </div>
    )
  }

  const Icon = getToolTypeMeta(typeName)?.icon || FileText
  const canEdit = typeName === "plan" || typeName === "report"

  const renderToolPreview = () => {
    if (!config) return null

    switch (typeName) {
      case "survey":
        return <SurveyPreview config={config as SurveyConfig} />
      case "multiple_answer":
        return <MultipleChoicePreview config={config as MultipleChoiceConfig} />
      case "media_question":
        return <MediaPreview config={config as MediaConfig} />
      case "attachment_request":
        return (
          <div className="rounded-lg border bg-muted/30 p-6">
            <h3 className="text-lg font-semibold">
              {(config as { title?: { en: string; ar: string } }).title?.[
                lang
              ] || (lang === "ar" ? "طلب إرفاق ملف" : "Request for Attachment")}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {lang === "ar"
                ? "سيظهر طلب رفع الملف هنا"
                : "File upload request will appear here"}
            </p>
          </div>
        )
      case "plan":
        return <PlanPreview config={config as PlanConfig} />
      case "report":
        return <ReportPreview config={config as ReportConfig} />
      default:
        return (
          <div className="rounded-lg border bg-muted/30 p-6">
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "المعاينة غير متاحة لهذا النوع من الأدوات"
                : "Preview not available for this tool type"}
            </p>
          </div>
        )
    }
  }

  const renderSurveyResponse = (surveyConfig: SurveyConfig) => {
    const responses = assignment.responses || {}
    const questions = surveyConfig.questions || []

    if (questions.length === 0) {
      return (
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لا توجد أسئلة في هذا الاستبيان."
            : "No questions in this survey."}
        </p>
      )
    }

    return (
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const answer = responses[question.id]
          return (
            <div key={question.id} className="rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  {idx + 1}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium">{question.text}</p>
                  <div className="mt-2 rounded bg-muted/30 p-3">
                    {answer !== undefined &&
                    answer !== null &&
                    answer !== "" ? (
                      <p className="text-sm">{String(answer)}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar" ? "لا إجابة" : "No answer"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMultipleChoiceResponse = (mcConfig: MultipleChoiceConfig) => {
    const responses = assignment.responses || {}
    const questions = mcConfig.questions || []

    if (questions.length === 0) {
      return (
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لا توجد أسئلة في هذا الاستبيان."
            : "No questions in this survey."}
        </p>
      )
    }

    return (
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const answer = responses[question.id]
          return (
            <div key={question.id} className="rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  {idx + 1}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium">{question.text}</p>
                  <div className="mt-2 space-y-1">
                    {answer !== undefined && answer !== null ? (
                      Array.isArray(answer) ? (
                        answer.map((val, i) => (
                          <p key={i} className="text-sm">
                            {question.options?.find((o) => o.value === val)
                              ?.label || val}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm">
                          {question.options?.find((o) => o.value === answer)
                            ?.label || String(answer)}
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {lang === "ar" ? "لا إجابة" : "No answer"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMediaResponse = (mediaConfig: MediaConfig) => {
    const responses = assignment.responses || {}
    const items = mediaConfig.items || []

    if (items.length === 0) {
      return (
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لا توجد عناصر وسائط في هذه المهمة."
            : "No media items in this assignment."}
        </p>
      )
    }

    return (
      <div className="space-y-4">
        {items.map((item, idx) => {
          const answer = responses[item.id]
          return (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  {idx + 1}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium">{item.question}</p>
                  <div className="mt-2 rounded bg-muted/30 p-3">
                    {item.responseType === "text" ? (
                      answer ? (
                        <p className="text-sm">{String(answer)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {lang === "ar" ? "لا إجابة" : "No answer"}
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {answer
                          ? `${lang === "ar" ? "ملف" : "File"}: ${answer}`
                          : lang === "ar"
                            ? "لم يتم رفع ملف"
                            : "No file uploaded"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAttachmentResponse = () => {
    const responses = assignment.responses || {}
    const responseKeys = Object.keys(responses)

    if (
      responseKeys.length === 0 &&
      (!assignment.media || assignment.media.length === 0)
    ) {
      return (
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "لم يتم رفع أي ملفات بعد."
            : "No files uploaded yet."}
        </p>
      )
    }

    return (
      <div className="space-y-4">
        {responseKeys.length > 0 && (
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">
              {lang === "ar" ? "استجابات الملفات" : "File Responses"}
            </h4>
            <ul className="space-y-2">
              {responseKeys.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="text-sm">{key}:</span>
                  <span className="text-sm text-muted-foreground">
                    {String(responses[key])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assignment.media && assignment.media.length > 0 && (
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">
              {lang === "ar" ? "الملفات المرفوعة" : "Uploaded Files"}
            </h4>
            <ul className="space-y-2">
              {assignment.media.map((file, idx) => (
                <li key={idx}>
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    {lang === "ar" ? "ملف" : "File"} {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderGenericResponse = () => {
    return (
      <div className="space-y-4">
        {assignment.media && assignment.media.length > 0 && (
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">
              {lang === "ar" ? "الملفات المرفوعة" : "Uploaded Files"}
            </h4>
            <ul className="space-y-2">
              {assignment.media.map((file, idx) => (
                <li key={idx}>
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    {lang === "ar" ? "ملف" : "File"} {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderResponseView = () => {
    if (assignment.status !== "completed") {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            {lang === "ar" ? "لم تكتمل بعد" : "Not Yet Completed"}
          </h3>
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "هذه المهمة لا تزال قيد الانتظار. ستظهر الردود هنا بمجرد اكتمال الحالة لها."
              : "This assignment is still pending. Responses will appear here once the case completes it."}
          </p>
        </div>
      )
    }

    if (
      !assignment.responses ||
      Object.keys(assignment.responses).length === 0
    ) {
      if (!assignment.media || assignment.media.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {lang === "ar" ? "لا توجد ردود" : "No Responses"}
            </h3>
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "لا توجد بيانات استجابة متاحة لهذه المهمة."
                : "No response data available for this assignment."}
            </p>
          </div>
        )
      }
    }

    switch (typeName) {
      case "survey":
        return (
          <SurveyPreview
            config={config as SurveyConfig}
            responses={assignment.responses}
            readOnly
          />
        )
      case "multiple_answer":
        return (
          <MultipleChoicePreview
            config={config as MultipleChoiceConfig}
            responses={assignment.responses}
            readOnly
          />
        )
      case "media_question":
        return (
          <MediaPreview
            config={config as MediaConfig}
            responses={assignment.responses as Record<string, string>}
            readOnly
          />
        )
      case "attachment_request":
        return renderAttachmentResponse()
      default:
        return renderGenericResponse()
    }
  }

  return (
    <div className="space-y-6">
      {(currentUser?.role === "admin" ||
        currentUser?.role === "super_admin") && (
        <ExpertTaskAssignment
          key={assignment.id}
          task={assignment}
          onSaved={updateAssignment}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/assignments")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "تفاصيل المهمة" : "Assignment Details"}
            </h1>
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "عرض المهمة والردود"
                : "View assignment and responses"}
            </p>
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/admin/tools/${typeName}/edit/${assignmentId}`}
          >
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              {lang === "ar" ? "تعديل" : "Edit"}
            </Button>
          </Link>
        )}
      </div>

      {/* Assignment Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {lang === "ar" ? "معلومات المهمة" : "Assignment Information"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {lang === "ar" ? "الحالة" : "Case"}
              </span>
              <p>
                <Link
                  href={`/dashboard/cases/${profile.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {profile.name}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {lang === "ar" ? "المهمة" : "Assignment"}
              </span>
              <p>
                {assignment.name_en ||
                  (lang === "ar" ? "مهمة بدون اسم" : "Unnamed Assignment")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {lang === "ar" ? "النوع" : "Type"}
              </span>
              <div>
                <Badge variant="outline">
                  {getToolTypeLabel(toolType, lang)}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                {lang === "ar" ? "الحالة" : "Status"}
              </span>
              <div>
                <Badge className={statusColors[assignment.status]}>
                  {statusLabels[assignment.status][lang]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  {lang === "ar" ? "تاريخ التعيين" : "Assigned Date"}
                </span>
                <p>
                  {formatDate(assignment.assigned_at || assignment.created)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  {lang === "ar" ? "مرئي للمستخدم" : "Visible to User"}
                </span>
                <p>
                  {assignment.is_visible_to_user
                    ? lang === "ar"
                      ? "نعم"
                      : "Yes"
                    : lang === "ar"
                      ? "لا"
                      : "No"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">
            {lang === "ar" ? "عرض" : "View"}
          </TabsTrigger>
          <TabsTrigger value="response">
            {lang === "ar" ? "الرد" : "Response"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "معاينة الأداة" : "Tool Preview"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "كيف تظهر الأداة للحالة (باستخدام لقطة الإعدادات)"
                  : "How the tool appears to the case (using config snapshot)"}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderToolPreview()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "ar" ? "الرد" : "Response"}</CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "الردود المقدمة والملفات المرفوعة"
                  : "Submitted responses and uploaded files"}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderResponseView()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
