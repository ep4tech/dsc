"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSyncExternalStore } from "react"
import { FileText, Home, Globe, Newspaper, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { Button } from "@/components/ui/button"
import type { BilingualString } from "@/types/form"

interface SidebarItem {
  label: BilingualString
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: { en: "Home page", ar: "الصفحة الرئيسية" },
    href: "/cms/home-pages",
    icon: <Home className="h-4 w-4" />,
  },
  {
    label: { en: "Portals Info", ar: "معلومات البوابات" },
    href: "/cms/portals",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    label: { en: "Portals Items", ar: "عناصر البوابات" },
    href: "/cms/info",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: { en: "Blog", ar: "المدونة" },
    href: "/cms/blog",
    icon: <Newspaper className="h-4 w-4" />,
  },
]

const STORAGE_KEY = "sidebar-cms-collapsed"
const TOGGLE_EVENT = "sidebar-cms-collapsed-toggle"

function subscribe(onStoreChange: () => void) {
  // "storage" keeps other tabs in sync; the custom event covers same-tab writes.
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(TOGGLE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(TOGGLE_EVENT, onStoreChange)
  }
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "true"
}

function getServerSnapshot() {
  return false
}

export function CmsSidebar() {
  const pathname = usePathname()
  const { lang } = useLang()

  // The collapsed state lives in localStorage, which the server cannot see.
  // useSyncExternalStore reconciles that (server snapshot "expanded", client
  // snapshot from storage) without a setState-in-effect on mount.
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const toggleCollapsed = () => {
    localStorage.setItem(STORAGE_KEY, String(!isCollapsed))
    window.dispatchEvent(new Event(TOGGLE_EVENT))
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-e bg-white transition-all duration-300 md:flex",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && <span className="font-semibold">CMS</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={
            isCollapsed
              ? lang === "ar"
                ? "توسيع الشريط الجانبي"
                : "Expand sidebar"
              : lang === "ar"
                ? "طي الشريط الجانبي"
                : "Collapse sidebar"
          }
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "pointer-events-none opacity-50"
              )}
              title={isCollapsed ? t(item.label, lang) : undefined}
            >
              {item.icon}
              {!isCollapsed && t(item.label, lang)}
              {!isCollapsed && item.disabled && (
                <span className="ms-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {t({ en: "Soon", ar: "قريباً" }, lang)}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
