"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useRouter } from "next/navigation"
import { setCurrentLang } from "@/lib/current-lang"
import type { Lang } from "@/types/form"

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const LANG_COOKIE = "lang"

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode
  initialLang?: Lang
}) {
  const router = useRouter()
  const [selectedLang, setLang] = useState<Lang | undefined>(initialLang)
  const cookieLang = useSyncExternalStore(
    () => () => {},
    () => (getCookie(LANG_COOKIE) === "ar" ? "ar" : "en"),
    () => initialLang || "en"
  )
  const lang: Lang = selectedLang || cookieLang
  const initialized = useRef(false)

  useEffect(() => {
    setCurrentLang(lang)
    setCookie(LANG_COOKIE, lang)
    if (initialized.current) {
      router.refresh()
    }
    initialized.current = true
  }, [lang, router])

  function toggleLang() {
    setLang(lang === "en" ? "ar" : "en")
  }

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used inside LangProvider")
  return ctx
}
