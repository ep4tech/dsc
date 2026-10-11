"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserManagement } from "@/components/dashboard/UserManagement"
import { ExpertApprovalPage } from "@/components/dashboard/ExpertApproval"
import { ExpertDisplayOrder } from "@/components/dashboard/ExpertDisplayOrder"
import { useLang } from "@/lib/lang-context"

export default function ExpertsPage() {
  const params = useSearchParams()
  const [tab, setTab] = useState(
    params.get("tab") === "approval" ? "approval" : "accounts"
  )
  const { lang } = useLang()
  const ar = lang === "ar"
  return (
    <div className="space-y-6">
      <nav
        className="flex flex-wrap gap-2"
        aria-label={ar ? "إدارة الخبراء" : "Expert management"}
      >
        {[
          { key: "accounts", en: "Expert accounts", ar: "حسابات الخبراء" },
          { key: "approval", en: "Expert Approval", ar: "اعتماد الخبراء" },
          {
            key: "order",
            en: "Landing page order",
            ar: "ترتيب الصفحة الرئيسية",
          },
        ].map((item) => (
          <Button
            key={item.key}
            variant={tab === item.key ? "default" : "outline"}
            aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            {ar ? item.ar : item.en}
          </Button>
        ))}
      </nav>
      {tab === "accounts" ? (
        <UserManagement expertsOnly />
      ) : tab === "approval" ? (
        <ExpertApprovalPage />
      ) : (
        <ExpertDisplayOrder />
      )}
    </div>
  )
}
