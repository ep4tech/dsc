"use client"

import { boundedFullList } from "@/lib/bounded-records"
import { useEffect, useState } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import { useLang } from "@/lib/lang-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/ui/page-loader"
import { specializationLabel } from "@/components/team/team-labels"
import { toStringList } from "@/hooks/useExpertProfile"
import type { CaseTool } from "@/types/assignment"
import { toast } from "sonner"

export function ExpertTaskAssignment({
  task,
  onSaved,
}: {
  task: CaseTool
  onSaved: (id: string, data: Partial<CaseTool>) => Promise<void>
}) {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [experts, setExperts] = useState<
    { id: string; name: string; specialties: string[] }[]
  >([])
  const [specialty, setSpecialty] = useState(task.specialization || "")
  const [expert, setExpert] = useState(task.assigned_expert || "")
  const [brief, setBrief] = useState(task.task_brief || "")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    Promise.all([
      boundedFullList(pb
        .collection("case_experts"), {
          filter: pb.filter("case_id = {:id}", { id: task.case }),
          expand: "expert_id",
        }),
      boundedFullList(pb.collection("expert_profiles")),
    ])
      .then(([allocations, profiles]) => {
        if (active)
          setExperts(
            allocations
              .filter((a) => a.expand?.expert_id?.is_active)
              .map((a) => ({
                id: a.expert_id,
                name: a.expand?.expert_id?.name || "",
                specialties: toStringList(
                  profiles.find((p) => p.user === a.expert_id)
                    ?.specialization_type
                ),
              }))
              .filter((e, i, all) => all.findIndex((v) => v.id === e.id) === i)
          )
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, lang))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [task.case, lang])
  async function save() {
    if (saving) return
    if (!specialty || !expert || brief.trim().length < 10) {
      setError(
        ar
          ? "اختر التخصص والخبير وأدخل وصفًا من 10 إلى 3000 حرف."
          : "Select a specialization and expert, and enter a task brief of 10–3000 characters."
      )
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSaved(task.id, {
        assigned_expert: expert,
        specialization: specialty,
        task_brief: brief.trim(),
      })
      toast.success(ar ? "تم إسناد المهمة" : "Task assigned")
    } catch (e) {
      setError(getErrorMessage(e, lang))
    } finally {
      setSaving(false)
    }
  }
  const specialties = [...new Set(experts.flatMap((e) => e.specialties))]
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {ar ? "إسناد المهمة حسب التخصص" : "Assign task by specialization"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <PageLoader minHeight="min-h-24" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {ar
                ? "أضف الخبراء إلى الحالة أولًا من صفحة إسناد الحالات."
                : "First add experts to this case on the case allocation page."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="task-specialty">
                  {ar ? "التخصص" : "Specialization"}
                </Label>
                <select
                  id="task-specialty"
                  className="mt-2 h-11 w-full rounded-md border bg-background px-3"
                  value={specialty}
                  onChange={(e) => {
                    setSpecialty(e.target.value)
                    setExpert("")
                  }}
                >
                  <option value="">
                    {ar ? "اختر التخصص" : "Select specialization"}
                  </option>
                  {specialties.map((v) => (
                    <option key={v} value={v}>
                      {specializationLabel(v, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="task-expert">{ar ? "الخبير" : "Expert"}</Label>
                <select
                  id="task-expert"
                  className="mt-2 h-11 w-full rounded-md border bg-background px-3"
                  value={expert}
                  onChange={(e) => setExpert(e.target.value)}
                >
                  <option value="">
                    {ar ? "اختر الخبير" : "Select expert"}
                  </option>
                  {experts
                    .filter((e) => e.specialties.includes(specialty))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <Label htmlFor="task-brief">
              {ar ? "وصف المهمة" : "Task brief"}
            </Label>
            <Textarea
              id="task-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              minLength={10}
              maxLength={3000}
            />
            <Button disabled={saving || !experts.length} onClick={save}>
              {saving
                ? ar
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : ar
                  ? "حفظ الإسناد"
                  : "Save assignment"}
            </Button>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
