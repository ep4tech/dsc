"use client"
import { CaseFeedback } from "@/components/cases/CaseFeedback"
import { use, useState } from "react"
import Link from "next/link"
import { useProfiles } from "@/hooks/useProfiles"
import { useAssignments } from "@/hooks/useAssignments"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { getErrorMessage } from "@/lib/pb"
import { specializationLabel } from "@/components/team/team-labels"
import { PageLoader } from "@/components/ui/page-loader"
import { DataError } from "@/components/ui/data-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CaseTool } from "@/types/assignment"
import { toast } from "sonner"
function TaskResponse({
  task,
  save,
}: {
  task: CaseTool
  save: (id: string, data: Partial<CaseTool>) => Promise<void>
}) {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [note, setNote] = useState(
    typeof task.responses?.expert_note === "string"
      ? task.responses.expert_note
      : ""
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  async function submit(status: CaseTool["status"]) {
    if (saving) return
    setSaving(true)
    setError("")
    try {
      await save(task.id, {
        responses: { ...task.responses, expert_note: note.trim() },
        status,
      })
      toast.success(ar ? "تم تحديث المهمة" : "Task updated")
    } catch (e) {
      setError(getErrorMessage(e, lang))
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-3">
      <Label htmlFor={`note-${task.id}`}>
        {ar ? "ملاحظات التنفيذ" : "Progress notes"}
      </Label>
      <Textarea
        id={`note-${task.id}`}
        maxLength={3000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={saving}
          variant="outline"
          onClick={() => submit("in_progress")}
        >
          {ar ? "حفظ التقدم" : "Save progress"}
        </Button>
        <Button disabled={saving} onClick={() => submit("completed")}>
          {ar ? "إكمال المهمة" : "Complete task"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
export default function ExpertCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { profiles, isLoading, loadError, refresh } = useProfiles()
  const {
    assignments,
    isLoading: tasksLoading,
    loadError: taskError,
    updateAssignment,
    refresh: refreshTasks,
  } = useAssignments(id)
  const { currentUser } = useAuth()
  const { lang } = useLang()
  const ar = lang === "ar"
  if (isLoading || tasksLoading) return <PageLoader />
  if (loadError || taskError)
    return (
      <DataError
        message={loadError || taskError}
        onRetry={() => {
          refresh()
          refreshTasks()
        }}
      />
    )
  const profile = profiles.find((p) => p.id === id)
  if (!profile)
    return (
      <p role="alert">
        {ar ? "الحالة غير متاحة لك." : "This case is not available to you."}
      </p>
    )
  const statuses: Record<string, string> = ar
    ? {
        pending: "قيد الانتظار",
        assigned: "مسندة",
        in_progress: "قيد التنفيذ",
        completed: "مكتملة",
      }
    : {
        pending: "Pending",
        assigned: "Assigned",
        in_progress: "In progress",
        completed: "Completed",
      }
  return (
    <div className="space-y-6">
      <Link className="text-primary underline" href="/dashboard/expert/cases">
        {ar ? "العودة إلى الحالات" : "Back to cases"}
      </Link>
      <h1 className="text-2xl font-bold [overflow-wrap:anywhere]">
        {profile.name}
      </h1>
      <h2 className="text-lg font-semibold">{ar ? "المهام" : "Tasks"}</h2>
      {!assignments.length && (
        <p>{ar ? "لا توجد مهام متاحة بعد." : "No tasks available yet."}</p>
      )}
      {assignments.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle className="[overflow-wrap:anywhere]">
              {(ar ? task.name_ar : task.name_en) ||
                task.name_en ||
                task.name_ar ||
                (ar ? "مهمة" : "Task")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {statuses[task.status]}
              {task.specialization &&
                ` · ${specializationLabel(task.specialization, lang)}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
              {task.task_brief}
            </p>
            {task.assigned_expert === currentUser?.id && (
              <TaskResponse key={task.id} task={task} save={updateAssignment} />
            )}
          </CardContent>
        </Card>
      ))}
      <CaseFeedback caseId={profile.id} ownerId={profile.user} />
    </div>
  )
}
