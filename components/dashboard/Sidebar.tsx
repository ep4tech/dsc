"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useUnreadMessages } from "@/hooks/useUnreadMessages"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import type { Lang } from "@/types/form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SmartLink } from "@/components/smart-link"
import {
  LayoutDashboard,
  Users,
  Wrench,
  LogOut,
  FolderKanban,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  BadgeCheck,
  Wallet,
  Briefcase,
  FileText,
  Calendar,
  MessageSquare,
  UserCircle,
  StickyNote,
  Baby,
  Menu,
  X,
} from "lucide-react"

type NavItem = {
  name: { en: string; ar: string }
  href: string
  icon: typeof LayoutDashboard
  superAdminOnly?: boolean
  unread?: number
}

const adminNavigation: NavItem[] = [
  { name: { en: "Messages", ar: "الرسائل" }, href: "/dashboard/messages", icon: MessageSquare },
  { name: { en: "Database backups", ar: "النسخ الاحتياطية" }, href: "/dashboard/admin/backups", icon: FolderKanban },
  {
    name: { en: "Cases", ar: "الحالات" },
    href: "/dashboard/admin/cases",
    icon: Users,
  },
  {
    name: { en: "Tools", ar: "الأدوات" },
    href: "/dashboard/admin/tools",
    icon: Wrench,
  },
  {
    name: { en: "Assignments", ar: "التعيينات" },
    href: "/dashboard/admin/assignments",
    icon: ClipboardList,
  },
  {
    name: { en: "Allocations", ar: "التخصيصات" },
    href: "/dashboard/admin/allocations",
    icon: UserCheck,
  },
  {
    name: { en: "Training", ar: "التدريب" },
    href: "/dashboard/admin/training",
    icon: GraduationCap,
  },
  {
    name: { en: "Public Lectures", ar: "المحاضرات العامة" },
    href: "/dashboard/admin/public-lectures",
    icon: BookOpen,
  },
  {
    name: { en: "Payments", ar: "المدفوعات" },
    href: "/dashboard/admin/payments",
    icon: Wallet,
  },
  {
    name: { en: "Users", ar: "المستخدمون" },
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    name: { en: "Experts", ar: "الخبراء" },
    href: "/dashboard/admin/experts",
    icon: BadgeCheck,
  },
  {
    name: { en: "Settings", ar: "الإعدادات" },
    href: "/dashboard/admin/settings",
    icon: Settings,
    superAdminOnly: true,
  },
]

const organizationNavigation: NavItem[] = [
  {
    name: { en: "Projects", ar: "المشاريع" },
    href: "/dashboard/institution/projects",
    icon: Briefcase,
  },
  {
    name: { en: "Quotations", ar: "عروض الأسعار" },
    href: "/dashboard/institution/quotations",
    icon: MessageSquare,
  },
  {
    name: { en: "Services", ar: "الخدمات" },
    href: "/dashboard/institution/services",
    icon: FolderKanban,
  },
  {
    name: { en: "Documents", ar: "المستندات" },
    href: "/dashboard/institution/documents",
    icon: FileText,
  },
]

const individualNavigation: NavItem[] = [
  {
    name: { en: "Cases", ar: "الحالات" },
    href: "/dashboard/individual/cases",
    icon: Users,
  },
  {
    name: { en: "Appointments", ar: "المواعيد" },
    href: "/dashboard/individual/appointments",
    icon: Calendar,
  },
  {
    name: { en: "Services", ar: "الخدمات" },
    href: "/dashboard/individual/services",
    icon: FolderKanban,
  },
  {
    name: { en: "Reports", ar: "التقارير" },
    href: "/dashboard/individual/reports",
    icon: FileText,
  },
]

const parentNavigation: NavItem[] = [
  {
    name: { en: "Children", ar: "الأطفال" },
    href: "/dashboard/parent/cases",
    icon: Baby,
  },
  {
    name: { en: "Appointments", ar: "المواعيد" },
    href: "/dashboard/parent/appointments",
    icon: Calendar,
  },
  {
    name: { en: "Services", ar: "الخدمات" },
    href: "/dashboard/parent/services",
    icon: FolderKanban,
  },
  {
    name: { en: "Reports", ar: "التقارير" },
    href: "/dashboard/parent/reports",
    icon: FileText,
  },
]

const expertNavigation: NavItem[] = [
  { name: { en: "Messages", ar: "الرسائل" }, href: "/dashboard/messages", icon: MessageSquare },
  {
    name: { en: "Cases", ar: "الحالات" },
    href: "/dashboard/expert/cases",
    icon: Users,
  },
  {
    name: { en: "Schedule", ar: "الجدول" },
    href: "/dashboard/expert/schedule",
    icon: Calendar,
  },
  {
    name: { en: "Profile", ar: "الملف الشخصي" },
    href: "/dashboard/expert/profile",
    icon: UserCircle,
  },
  {
    name: { en: "Notes", ar: "الملاحظات" },
    href: "/dashboard/expert/notes",
    icon: StickyNote,
  },
]

function renderNavItem(
  item: NavItem,
  pathname: string,
  lang: Lang,
  isMain: boolean = false,
  isCollapsed: boolean = false
) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/")

  return (
    <SmartLink
      key={item.href}
      href={item.href}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
        isCollapsed ? "justify-center px-0 py-2" : "px-3 py-2",
        isActive
          ? "bg-white/20 text-white"
          : "text-primary-foreground/70 hover:bg-white/10 hover:text-white",
        isMain && !isCollapsed && "ps-8"
      )}
      title={isCollapsed ? item.name[lang] : undefined}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && item.name[lang]}
      {!!item.unread && <span aria-label={lang === "ar" ? `${item.unread} رسائل غير مقروءة` : `${item.unread} unread messages`} className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-900">{item.unread}</span>}
    </SmartLink>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { lang } = useLang()
  const {
    currentUser,
    isAdmin,
    isSuperAdmin,
    logout,
    isLoading: isAuthLoading,
  } = useAuth()

  const role = currentUser?.role
  const isExpert = role === "expert"
  const unread = useUnreadMessages(currentUser?.id, isAdmin || isExpert)
  const withUnread = (item: NavItem): NavItem => item.href === "/dashboard/messages" ? { ...item, unread } : item
  const isOrganization = role === "organization"
  const isIndividual = role === "individual"
  const isParent = role === "parent"

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-dashboard-collapsed")
      if (stored !== null) return stored === "true"
    }
    return false
  })
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const mobileOpen = mobileMenuPath === pathname

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebar-dashboard-collapsed", String(next))
      return next
    })
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const dashboardHref = isAdmin
    ? "/dashboard/admin"
    : isExpert
      ? "/dashboard/expert"
      : isOrganization
        ? "/dashboard/institution"
        : isIndividual
          ? "/dashboard/individual"
          : isParent
            ? "/dashboard/parent"
            : "/dashboard"

  const dashboardLabel = isAdmin
    ? { en: "Admin Dashboard", ar: "لوحة التحكم" }
    : isExpert
      ? { en: "Expert Dashboard", ar: "لوحة التحكم" }
      : isOrganization
        ? { en: "Organization Dashboard", ar: "لوحة التحكم" }
        : isIndividual
          ? { en: "My Dashboard", ar: "لوحة التحكم" }
          : isParent
            ? { en: "Parent Dashboard", ar: "لوحة التحكم" }
            : { en: "Dashboard", ar: "لوحة التحكم" }

  return (
    <>
    <div className="w-full bg-primary text-primary-foreground md:hidden">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4">
        <SmartLink href={dashboardHref} className="min-w-0 text-sm font-semibold">{dashboardLabel[lang]}</SmartLink>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 text-white hover:bg-white/10 hover:text-white"
          onClick={() => setMobileMenuPath(mobileOpen ? null : pathname)}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-navigation"
          aria-label={lang === "ar" ? "قائمة لوحة التحكم" : "Dashboard navigation"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {mobileOpen && (
        <nav id="dashboard-mobile-navigation" aria-label={lang === "ar" ? "التنقل في لوحة التحكم" : "Dashboard navigation"} className="max-h-[65dvh] space-y-1 overflow-y-auto border-t border-white/15 p-3" onClick={() => setMobileMenuPath(null)}>
          {renderNavItem({ name: dashboardLabel, href: dashboardHref, icon: LayoutDashboard }, pathname, lang)}
          {(isAdmin ? adminNavigation : isExpert ? expertNavigation : isOrganization ? organizationNavigation : isIndividual ? individualNavigation : isParent ? parentNavigation : [])
            .filter((item) => !item.superAdminOnly || isSuperAdmin)
            .map((item) => renderNavItem(withUnread(item), pathname, lang))}
          <Button variant="ghost" className="min-h-11 w-full justify-start text-white hover:bg-white/10 hover:text-white" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />{lang === "ar" ? "تسجيل الخروج" : "Logout"}
          </Button>
        </nav>
      )}
    </div>
    <aside
      className={cn(
        "hidden min-h-screen shrink-0 flex-col bg-primary text-primary-foreground transition-all duration-300 md:flex",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "border-b border-primary/20",
          isCollapsed ? "p-2" : "p-4"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <SmartLink href={dashboardHref} className="flex items-center gap-2">
              <span className="text-xl font-bold">DSC</span>
            </SmartLink>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="text-primary-foreground/70 hover:bg-white/10 hover:text-white"
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
      </div>

      <nav className={cn("flex-1 space-y-1", isCollapsed ? "p-2" : "p-4")}>
        {/* Dashboard home */}
        <SmartLink
          href={dashboardHref}
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
            isCollapsed ? "justify-center px-0 py-2" : "px-3 py-2",
            pathname === dashboardHref
              ? "bg-white/20 text-white"
              : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
          )}
          title={isCollapsed ? dashboardLabel[lang] : undefined}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!isCollapsed && dashboardLabel[lang]}
        </SmartLink>

        {/* Role-specific navigation */}
        {isOrganization && (
          <>
            {organizationNavigation.map((item) =>
              renderNavItem(withUnread(item), pathname, lang, false, isCollapsed)
            )}
          </>
        )}

        {isExpert && (
          <>
            {expertNavigation.map((item) =>
              renderNavItem(withUnread(item), pathname, lang, false, isCollapsed)
            )}
          </>
        )}

        {/* Admin navigation */}
        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-medium tracking-wider text-primary-foreground/50 uppercase">
                  {lang === "ar" ? "مشرف" : "Admin"}
                </span>
              </div>
            )}
            {adminNavigation.map((item) => {
              if (item.superAdminOnly && !isSuperAdmin) return null
              return renderNavItem(withUnread(item), pathname, lang, true, isCollapsed)
            })}
          </>
        )}

        {/* Individual navigation */}
        {isIndividual && (
          <>
            {individualNavigation.map((item) =>
              renderNavItem(withUnread(item), pathname, lang, false, isCollapsed)
            )}
          </>
        )}

        {/* Parent navigation */}
        {isParent && (
          <>
            {parentNavigation.map((item) =>
              renderNavItem(withUnread(item), pathname, lang, false, isCollapsed)
            )}
          </>
        )}
      </nav>

      <div
        className={cn(
          "border-t border-primary/20",
          isCollapsed ? "p-2" : "p-4"
        )}
      >
        {isAuthLoading ? (
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <div className="flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-white/10">
              <FolderKanban className="h-5 w-5 shrink-0 opacity-50" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3.5 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-white/10" />
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "mb-3 flex items-center",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <FolderKanban className="h-5 w-5 shrink-0" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {currentUser?.name}
                </p>
                <p className="truncate text-xs text-primary-foreground/70">
                  {currentUser?.email}
                </p>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          className={cn(
            "text-primary-foreground/70 hover:bg-white/10 hover:text-white",
            isCollapsed ? "w-full justify-center" : "w-full justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && (lang === "ar" ? "تسجيل الخروج" : "Logout")}
        </Button>
      </div>
    </aside>
    </>
  )
}
