"use client"

import { useEffect, useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getTeamExperts } from "@/lib/team-experts"
import { saveExpertOrder } from "@/lib/expert-display-order"
import { getErrorMessage } from "@/lib/pb"
import { useLang } from "@/lib/lang-context"
import type { TeamExpert } from "@/types/team"
import { DataError } from "@/components/ui/data-error"
import { PageLoader } from "@/components/ui/page-loader"

export function ExpertDisplayOrder() {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [experts, setExperts] = useState<TeamExpert[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    getTeamExperts({ all: true, throwOnError: true }).then((data) => {
      if (active) {
        setExperts(data)
        setLoading(false)
      }
    }).catch(error => { if (active) { setError(getErrorMessage(error, lang)); setLoading(false) } })
    return () => {
      active = false
    }
  }, [lang])
  function move(index: number, direction: number) {
    setExperts((current) => {
      const result = [...current]
      const next = index + direction
      if (next < 0 || next >= result.length) return current
      ;[result[index], result[next]] = [result[next], result[index]]
      return result
    })
    setDirty(true)
  }
  async function save() {
    setSaving(true)
    try {
      await saveExpertOrder(experts.map((expert) => expert.id))
      setDirty(false)
      toast.success(ar ? "تم حفظ ترتيب الخبراء" : "Expert display order saved")
    } catch (error) {
      toast.error(getErrorMessage(error, lang))
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">
        {ar ? "ترتيب الخبراء في الصفحة الرئيسية" : "Landing page expert order"}
      </h2>
      <p className="text-muted-foreground">
        {ar
          ? "رتّب الخبراء النشطين ثم احفظ. سيبدأ عرض الشرائح بالخبير الأول."
          : "Move active experts into order, then save. The carousel starts with the first expert."}
      </p>
      {error ? <DataError message={error} /> : loading ? (
        <PageLoader minHeight="min-h-24" />
      ) : experts.length === 0 ? (
        <p>{ar ? "لا يوجد خبراء نشطون" : "No active experts to display"}</p>
      ) : (
        <ol className="divide-y rounded-lg border">
          {experts.map((expert, index) => (
            <li key={expert.id} className="flex items-center gap-3 p-4">
              <span className="w-8 text-muted-foreground">{index + 1}</span>
              <span className="flex-1 font-medium">{expert.name}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={saving || index === 0}
                onClick={() => move(index, -1)}
                aria-label={
                  ar ? `رفع ${expert.name}` : `Move ${expert.name} up`
                }
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={saving || index === experts.length - 1}
                onClick={() => move(index, 1)}
                aria-label={
                  ar ? `خفض ${expert.name}` : `Move ${expert.name} down`
                }
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <Button disabled={loading || saving || !dirty} onClick={save}>
        {saving
          ? ar
            ? "جارٍ الحفظ..."
            : "Saving..."
          : ar
            ? "حفظ الترتيب"
            : "Save order"}
      </Button>
    </section>
  )
}
