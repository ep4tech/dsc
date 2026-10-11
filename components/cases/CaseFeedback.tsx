"use client"
import { useCallback, useEffect, useState } from "react"
import { Star, MessageSquare } from "lucide-react"
import pb, { getErrorMessage } from "@/lib/pb"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataError } from "@/components/ui/data-error"
import type { RecordModel } from "pocketbase"
export function CaseFeedback({ caseId, ownerId }: { caseId: string; ownerId: string }) {
  const { currentUser } = useAuth()
  const { lang } = useLang()
  const ar = lang === "ar"
  const [items, setItems] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const mine = items.find(item => item.author === currentUser?.id)
  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const records = await pb.collection("case_feedback").getFullList({ filter: pb.filter("case = {:id}", { id: caseId }), sort: "-created", requestKey: null })
      setItems(records)
      const own = records.find(item => item.author === currentUser?.id)
      if (own) { setRating(own.rating); setComment(own.comment || "") }
      return true
    } catch (e) { setError(getErrorMessage(e, lang)); return false }
    finally { setLoading(false) }
  }, [caseId, currentUser?.id, lang])
  useEffect(() => { void load() }, [load])
  async function save() {
    if (!currentUser || saving) return
    setSaving(true); setError(""); setSaved(false)
    try {
      const data = { rating, comment: comment.trim() }
      if (mine) await pb.collection("case_feedback").update(mine.id, data)
      else await pb.collection("case_feedback").create({ ...data, case: caseId, author: currentUser.id })
      setSaved(await load())
    } catch (e) { setError(getErrorMessage(e, lang)) }
    finally { setSaving(false) }
  }
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />{ar ? "تقييم الحالة" : "Case feedback"}</CardTitle><p className="text-sm text-muted-foreground">{ar ? "شارك تجربتك لمساعدتنا على تحسين الدعم." : "Share your experience to help us improve your support."}</p></CardHeader><CardContent className="space-y-4">
    {error && <DataError message={error} onRetry={load} />}
    {loading ? <p role="status">{ar ? "جارٍ تحميل التقييم…" : "Loading feedback…"}</p> : error ? null : currentUser?.id === ownerId ? <div className="space-y-3">
      <fieldset><legend className="mb-2 text-sm font-medium">{ar ? "التقييم من ٥" : "Rating out of 5"}</legend><div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(n => <button key={n} type="button" disabled={saving} onClick={() => { setRating(n); setSaved(false) }} aria-label={ar ? `${n} من ٥` : `${n} out of 5`} aria-pressed={rating === n} className="flex h-11 w-11 items-center justify-center rounded-lg border focus-visible:outline-2 focus-visible:outline-primary"><Star className={n <= rating ? "h-6 w-6 fill-amber-400 text-amber-600" : "h-6 w-6 text-muted-foreground"} /></button>)}</div></fieldset>
      <Label htmlFor={`feedback-${caseId}`}>{ar ? "ملاحظاتك (اختياري)" : "Your comments (optional)"}</Label><Textarea id={`feedback-${caseId}`} value={comment} maxLength={2000} disabled={saving} onChange={e => { setComment(e.target.value); setSaved(false) }} rows={4}/><p className="text-xs text-muted-foreground">{comment.length}/2000</p><Button disabled={saving} onClick={save}>{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ التقييم" : "Save feedback")}</Button>{saved && <p role="status" className="text-sm text-green-700">{ar ? "تم حفظ تقييمك. شكرًا لك." : "Your feedback was saved. Thank you."}</p>}
    </div> : items.length ? items.map(item => <article key={item.id} className="space-y-2 border-b pb-4 last:border-0"><p className="font-semibold">{item.rating}/5 <span className="text-sm font-normal text-muted-foreground">{ar ? "تقييم صاحب الحالة" : "Case owner feedback"}</span></p><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{item.comment}</p><time className="text-xs text-muted-foreground">{new Date(item.updated || item.created).toLocaleDateString(ar ? "ar" : "en")}</time></article>) : <p className="text-sm text-muted-foreground">{ar ? "لم يرسل صاحب الحالة تقييمًا بعد." : "The case owner has not submitted feedback yet."}</p>}
  </CardContent></Card>
}
