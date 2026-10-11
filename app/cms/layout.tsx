"use client"

import Link from "next/link"
import { useLang } from "@/lib/lang-context"
import { AdminProtectedRoute } from "@/components/dashboard/AdminProtectedRoute"
import { CmsSidebar } from "@/components/cms/CmsSidebar"

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLang()
  return (
    <AdminProtectedRoute>
      <div className="flex flex-1">
        <CmsSidebar />
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <nav
            className="mb-5 flex flex-wrap gap-2 md:hidden"
            aria-label={lang === "ar" ? "إدارة المحتوى" : "CMS navigation"}
          >
            {[
              ["/cms/home-pages", "Home page", "الصفحة الرئيسية"],
              ["/cms/portals", "Portals Info", "معلومات البوابات"],
              ["/cms/info", "Portals Items", "عناصر البوابات"],
              ["/cms/blog", "Blog", "المدونة"],
            ].map(([href, en, ar]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md border px-3 py-3 text-sm font-semibold text-[#0b3d60]"
              >
                {lang === "ar" ? ar : en}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </AdminProtectedRoute>
  )
}
