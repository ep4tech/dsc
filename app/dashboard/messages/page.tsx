"use client"
import { useCallback, useEffect, useState } from "react"
import type { RecordModel } from "pocketbase"
import { Send, MessageSquare } from "lucide-react"
import pb, { getErrorMessage } from "@/lib/pb"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { PageLoader } from "@/components/ui/page-loader"
import { DataError } from "@/components/ui/data-error"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
type Contact = { id: string; name: string; role: string }
export default function MessagesPage() {
  const { currentUser, isAdmin, isLoading: authLoading } = useAuth()
  const { lang } = useLang()
  const ar = lang === "ar"
  const allowed = isAdmin || currentUser?.role === "expert"
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<RecordModel[]>([])
  const [selected, setSelected] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [notice, setNotice] = useState("")
  const refresh = useCallback(async (quiet = false) => {
    if (!currentUser || !allowed) return
    if (!quiet) setLoading(true)
    setError("")
    try {
      const [contactData, records] = await Promise.all([
        pb.send<{ contacts: Contact[] } | Contact[]>("/api/dsc/message-contacts", { method: "GET", requestKey: null }),
        pb.collection("internal_messages").getFullList({ sort: "created", requestKey: null }),
      ])
      setContacts(Array.isArray(contactData) ? contactData : contactData.contacts)
      setMessages(records)
    } catch (e) { setError(getErrorMessage(e, lang)) }
    finally { setLoading(false) }
  }, [currentUser, allowed, lang])
  useEffect(() => { if (!authLoading && allowed) { void refresh(); const timer = setInterval(() => refresh(true), 15000); return () => clearInterval(timer) } }, [refresh, authLoading, allowed])
  useEffect(() => {
    if (!selected || !currentUser) return
    const unread = messages.filter(item => item.sender === selected && item.recipient === currentUser.id && !item.read)
    if (!unread.length) return
    let active = true
    Promise.all(unread.map(item => pb.collection("internal_messages").update(item.id, { read: true }, { requestKey: null }))).then(() => {
      if (active) setMessages(items => items.map(item => unread.some(u => u.id === item.id) ? { ...item, read: true } : item))
      window.dispatchEvent(new Event("messages-updated"))
    }).catch(e => { if (active) setSendError(getErrorMessage(e, lang)) })
    return () => { active = false }
  }, [selected, messages, currentUser, lang])
  async function send() {
    if (!currentUser || !selected || !body.trim() || sending) return
    setSending(true); setSendError(""); setNotice("")
    try {
      const record = await pb.collection("internal_messages").create({ sender: currentUser.id, recipient: selected, body: body.trim(), read: false })
      setMessages(items => [...items, record]); setBody(""); setNotice(ar ? "تم إرسال الرسالة." : "Message sent.")
      window.dispatchEvent(new Event("messages-updated"))
    } catch (e) { setSendError(getErrorMessage(e, lang)) }
    finally { setSending(false) }
  }
  if (authLoading) return <PageLoader />
  if (!allowed) return <p role="alert">{ar ? "الرسائل متاحة للخبراء والمسؤولين فقط." : "Messages are available to experts and administrators."}</p>
  const contact = contacts.find(item => item.id === selected)
  const thread = messages.filter(item => item.sender === selected || item.recipient === selected)
  return <div className="mx-auto max-w-6xl space-y-6" dir={ar ? "rtl" : "ltr"}>
    <header><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">DSC</p><h1 className="text-3xl font-bold text-primary">{ar ? "الرسائل الداخلية" : "Internal messages"}</h1><p className="mt-2 text-muted-foreground">{ar ? "تواصل مباشرة مع فريق الإدارة والخبراء. تظهر الرسائل الجديدة في قائمة الرسائل." : "Coordinate directly with administrators and experts. New messages appear in your Messages badge."}</p></header>
    {error && <DataError message={error} onRetry={() => refresh()} />}
    {loading ? <PageLoader /> : <div className="grid min-w-0 overflow-hidden rounded-xl border bg-white md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b p-4 md:border-e md:border-b-0"><Label htmlFor="message-contact">{ar ? "اختر المستلم" : "Choose a recipient"}</Label><select id="message-contact" value={selected} onChange={e => { setSelected(e.target.value); setBody(""); setNotice(""); setSendError("") }} className="mt-3 min-h-11 w-full rounded-md border bg-white px-3 text-sm"><option value="">{ar ? "اختر شخصًا…" : "Select a person…"}</option>{contacts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="mt-4 hidden space-y-1 md:block">{contacts.map(item => { const unread = messages.filter(m => m.sender === item.id && m.recipient === currentUser?.id && !m.read).length; return <button key={item.id} onClick={() => { setSelected(item.id); setBody(""); setNotice(""); setSendError("") }} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm ${selected === item.id ? "bg-primary text-white" : "hover:bg-slate-100"}`}><span className="min-w-0 break-words">{item.name}</span>{unread > 0 && <span className="rounded-full bg-amber-300 px-2 text-xs font-bold text-slate-900">{unread}</span>}</button> })}</div>
        {!contacts.length && <p className="mt-4 text-sm text-muted-foreground">{ar ? "لا يوجد مستلمون متاحون حاليًا." : "No recipients are available yet."}</p>}
      </aside>
      <section className="min-w-0 p-4 sm:p-6">{!contact ? <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center text-muted-foreground"><MessageSquare className="h-10 w-10 text-primary"/><p>{ar ? "اختر شخصًا لعرض المحادثة أو إرسال رسالة." : "Choose a person to view your conversation or send a message."}</p></div> : <>
        <h2 className="border-b pb-4 text-xl font-semibold text-primary">{contact.name}</h2><div className="my-5 max-h-[55vh] space-y-4 overflow-y-auto pe-2" aria-live="polite">{!thread.length && <p className="py-8 text-center text-sm text-muted-foreground">{ar ? "ابدأ المحادثة برسالتك الأولى." : "Start the conversation with your first message."}</p>}{thread.map(item => <article key={item.id} className={`max-w-[95%] rounded-lg border p-4 sm:max-w-[85%] ${item.sender === currentUser?.id ? "ms-auto border-primary/15 bg-primary/5" : "me-auto bg-slate-50"}`}><p className="mb-2 text-xs font-semibold text-primary">{item.sender === currentUser?.id ? (ar ? "أنت" : "You") : contact.name}</p><p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{item.body}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><time>{new Date(item.created).toLocaleString(ar ? "ar" : "en")}</time>{item.sender === currentUser?.id && <span>{item.read ? (ar ? "مقروءة" : "Read") : (ar ? "مرسلة" : "Sent")}</span>}</div></article>)}</div>
        <div className="space-y-3 border-t pt-4"><Label htmlFor="message-body">{ar ? "رسالتك" : "Your message"}</Label><Textarea id="message-body" rows={4} value={body} disabled={sending} maxLength={4000} onChange={e => { setBody(e.target.value); setNotice("") }} /><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{body.length}/4000</span><Button onClick={send} disabled={sending || !body.trim()}><Send className="h-4 w-4"/>{sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "إرسال الرسالة" : "Send message")}</Button></div>{sendError && <p role="alert" className="text-sm text-destructive">{sendError}</p>}{notice && <p role="status" className="text-sm text-green-700">{notice}</p>}</div>
      </>}</section>
    </div>}
  </div>
}
