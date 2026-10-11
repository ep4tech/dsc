"use client"
import { useEffect, useRef, useState } from "react"
import { Accessibility, X } from "lucide-react"
import { useLang } from "@/lib/lang-context"
const defaults = { size: "normal", contrast: false, spacing: false, motion: false }
export function AccessibilityControls() {
  const { lang } = useLang(); const ar = lang === "ar"
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const sizeRef = useRef<HTMLSelectElement>(null)
  function closePanel() {
    setOpen(false)
    toggleRef.current?.focus()
  }
  const [settings, setSettings] = useState(defaults)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dsc-readability") || "null")
      if (saved) setSettings({ size: ["normal", "large", "larger"].includes(saved.size) ? saved.size : "normal", contrast: saved.contrast === true, spacing: saved.spacing === true, motion: saved.motion === true })
    } catch { /* Defaults when storage is unavailable. */ }
    setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!ready) return
    const html = document.documentElement
    html.dataset.readingSize = settings.size
    html.classList.toggle("reading-contrast", settings.contrast)
    html.classList.toggle("reading-spacing", settings.spacing)
    html.classList.toggle("reading-motion", settings.motion)
    window.dispatchEvent(new Event("dsc-readability-changed"))
    try { localStorage.setItem("dsc-readability", JSON.stringify(settings)) } catch { /* Apply for this visit. */ }
  }, [settings, ready])
  useEffect(() => {
    if (!open) return
    sizeRef.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus() } }
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [open])
  return <aside className="fixed bottom-4 end-4 z-50" dir={ar ? "rtl" : "ltr"} aria-label={ar ? "خيارات القراءة" : "Reading options"}>
    {open && <div id="reading-options" className="mb-3 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-xl border bg-white p-5 text-[#0b3d60] shadow-xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{ar ? "خيارات القراءة" : "Reading options"}</h2><button type="button" onClick={closePanel} aria-label={ar ? "إغلاق" : "Close"} className="p-2"><X size={18}/></button></div>
      <label className="mb-4 block"><span className="mb-2 block">{ar ? "حجم النص" : "Text size"}</span><select ref={sizeRef} value={settings.size} onChange={event => setSettings(s => ({ ...s, size: event.target.value }))} className="min-h-11 w-full rounded-md border p-2"><option value="normal">{ar ? "عادي" : "Default"}</option><option value="large">{ar ? "كبير" : "Large"}</option><option value="larger">{ar ? "أكبر" : "Extra large"}</option></select></label>
      {([["contrast", ar ? "تباين عالٍ" : "High contrast"], ["spacing", ar ? "تباعد النص" : "Comfortable text spacing"], ["motion", ar ? "تقليل الحركة" : "Reduce motion"]] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={settings[key]} onChange={event => setSettings(s => ({ ...s, [key]: event.target.checked }))} className="h-5 w-5"/>{label}</label>)}
      <button type="button" onClick={() => setSettings(defaults)} className="mt-4 min-h-11 w-full rounded-md border px-3 py-2 font-semibold">{ar ? "إعادة ضبط الخيارات" : "Reset options"}</button>
    </div>}
    <button ref={toggleRef} type="button" onClick={() => { if (open) closePanel(); else setOpen(true) }} aria-expanded={open} aria-controls="reading-options" className="flex min-h-12 items-center gap-2 rounded-full bg-[#0b3d60] px-4 py-3 text-sm font-semibold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4"><Accessibility size={21}/>{ar ? "خيارات القراءة" : "Reading options"}</button>
  </aside>
}
