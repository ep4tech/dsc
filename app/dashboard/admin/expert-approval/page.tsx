import { redirect } from "next/navigation"
export default function ExpertApprovalRedirect() {
  redirect("/dashboard/admin/experts?tab=approval")
}
