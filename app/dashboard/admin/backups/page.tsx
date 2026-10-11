"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, DatabaseBackup, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/lang-context"
import pb, { getErrorMessage } from "@/lib/pb"

type Backup = { name: string; size: number; modified: string }

export default function BackupsPage() {
  const { lang } = useLang()
  const ar = lang === "ar"
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await pb.send<Backup[]>("/api/dsc/backups", { method: "GET", requestKey: null })
      setBackups(result)
    } catch (err) {
      setError(getErrorMessage(err, lang))
    } finally {
      setLoading(false)
    }
  }, [lang])
  useEffect(() => { void load() }, [load])

  async function createBackup() {
    setCreating(true)
    setError("")
    setNotice("")
    try {
      await pb.send<{ name: string }>("/api/dsc/backups", { method: "POST", body: {}, requestKey: null })
      setNotice(ar ? "تم إنشاء النسخة الاحتياطية. يمكنك تنزيلها الآن." : "Backup created. You can download it now.")
      await load()
    } catch (err) {
      setError(getErrorMessage(err, lang))
    } finally {
      setCreating(false)
    }
  }

  async function downloadBackup(name: string) {
    setDownloading(name)
    setError("")
    try {
      const response = await fetch(`${pb.baseURL}/api/dsc/backups/download`, {
        method: "POST",
        headers: { Authorization: pb.authStore.token, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const failure = await response.json().catch(() => null)
        throw new Error(failure?.message || (ar ? "تعذّر تنزيل النسخة الاحتياطية." : "Unable to download backup."))
      }
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = name
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice(ar ? "بدأ تنزيل النسخة الاحتياطية." : "Backup download started.")
    } catch (err) {
      setError(getErrorMessage(err, lang))
    } finally {
      setDownloading(null)
    }
  }

  function formatSize(size: number) {
    return new Intl.NumberFormat(ar ? "ar" : "en", { maximumFractionDigits: 1 }).format(size / 1024 / 1024) + " MB"
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6" dir={ar ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#927013]">{ar ? "إدارة البيانات" : "Data management"}</p>
          <h1 className="text-3xl font-bold text-[#0b3d60]">{ar ? "النسخ الاحتياطية لقاعدة البيانات" : "Database backups"}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{ar ? "احفظ نسخة من بيانات النظام والملفات المرفوعة، ثم نزّلها للاحتفاظ بها في مكان آمن." : "Create a snapshot of your system data and uploaded files, then download it for safekeeping."}</p>
        </div>
        <Button onClick={createBackup} disabled={creating || loading || downloading !== null} className="min-h-11 gap-2 bg-[#0b3d60]">
          {creating ? <Loader2 className="size-4 animate-spin" /> : <DatabaseBackup className="size-4" />}
          {creating ? (ar ? "جارٍ إنشاء النسخة…" : "Creating backup…") : (ar ? "إنشاء نسخة احتياطية" : "Create backup")}
        </Button>
      </header>

      <aside className="flex gap-3 border-s-4 border-[#caa522] bg-[#fffaf0] p-4 text-sm leading-6 text-[#4c421f]">
        <ShieldCheck className="mt-1 size-5 shrink-0" />
        <p>{ar ? "تتضمن النسخة قاعدة البيانات والملفات المحلية المرفوعة. لا يؤدي إنشاؤها أو تنزيلها إلى تغيير البيانات الحالية. احتفظ بالملف بشكل خاص لأنه قد يحتوي على معلومات شخصية. الاستعادة غير متاحة من هذه الصفحة." : "Backups include the database and local uploaded files. Creating or downloading one does not change current data. Keep the file private because it may contain personal information. This page does not restore backups."}</p>
      </aside>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-[#0b3d60]">{ar ? "النسخ المحفوظة" : "Saved backups"}</h2>
          <Button variant="ghost" onClick={() => void load()} disabled={loading || creating || downloading !== null} className="gap-2">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />{ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 py-14 text-sm text-slate-600"><Loader2 className="size-5 animate-spin" />{ar ? "جارٍ تحميل النسخ…" : "Loading backups…"}</div> : backups.length === 0 ? (
          <div className="px-5 py-14 text-center"><Archive className="mx-auto mb-4 size-9 text-[#927013]" /><h3 className="font-semibold text-[#0b3d60]">{ar ? "لا توجد نسخ احتياطية بعد" : "No backups yet"}</h3><p className="mt-2 text-sm text-slate-600">{ar ? "أنشئ النسخة الأولى باستخدام الزر أعلاه." : "Create your first snapshot using the button above."}</p></div>
        ) : <ul className="divide-y divide-slate-200">{backups.map((backup) => (
          <li key={backup.name} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="break-all font-medium text-[#0b3d60]" dir="ltr">{backup.name}</p><p className="mt-1 text-sm text-slate-600">{Number.isNaN(Date.parse(backup.modified)) ? backup.modified : new Date(backup.modified).toLocaleString(ar ? "ar" : "en")} · <span dir="ltr">{formatSize(backup.size)}</span></p></div>
            <Button variant="outline" className="min-h-11 shrink-0 gap-2" disabled={downloading !== null || creating} onClick={() => void downloadBackup(backup.name)}>
              {downloading === backup.name ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}{downloading === backup.name ? (ar ? "جارٍ التنزيل…" : "Downloading…") : (ar ? "تنزيل ZIP" : "Download ZIP")}
            </Button>
          </li>
        ))}</ul>}
      </div>
    </section>
  )
}
