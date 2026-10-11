"use client"
import { use } from "react"
import AdminUserDetailPage from "@/app/dashboard/admin/users/[id]/page"
import { ExpertBankDetails } from "@/components/dashboard/ExpertBankDetails"
export default function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <div className="space-y-6">
      <AdminUserDetailPage params={params} />
      <ExpertBankDetails key={id} userId={id} />
    </div>
  )
}
