"use client"

import { useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useUsers } from "@/hooks/useUsers"
import { useProfiles } from "@/hooks/useProfiles"
import { useAssignments } from "@/hooks/useAssignments"
import { useAllocations } from "@/hooks/useAllocations"
import { useTools } from "@/hooks/useTools"
import { useTraining } from "@/hooks/useTraining"
import { useLectures } from "@/hooks/useLectures"
import { useLang } from "@/lib/lang-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  ClipboardList,
  UserCheck,
  BadgeCheck,
  GraduationCap,
  BookOpen,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"

interface Stat {
  title: string
  value: number
  icon: LucideIcon
  isLoading: boolean
}

export default function AdminDashboardPage() {
  const { currentUser } = useAuth()
  const { lang } = useLang()

  const { users, isLoading: isUsersLoading } = useUsers()
  const { profiles, isLoading: isProfilesLoading } = useProfiles()
  const { assignments, isLoading: isAssignmentsLoading } = useAssignments()
  const { allocations, isLoading: isAllocationsLoading } = useAllocations()
  const { tools, isLoading: isToolsLoading } = useTools()
  const { programs, isLoading: isTrainingLoading } = useTraining()
  const { lectures, isLoading: isLecturesLoading } = useLectures()

  const pendingExpertApprovals = useMemo(
    () => users.filter((u) => u.role === "expert" && !u.is_active).length,
    [users]
  )

  // A "payment made" is a case an admin has approved (approveCase sets is_paid)
  const paymentsMade = useMemo(
    () => profiles.filter((p) => p.is_paid).length,
    [profiles]
  )

  const primaryStats: Stat[] = [
    {
      title: lang === "ar" ? "المستخدمون" : "Users",
      value: users.filter((user) => user.role !== "expert").length,
      icon: Users,
      isLoading: isUsersLoading,
    },
    {
      title: lang === "ar" ? "التعيينات" : "Assignments",
      value: assignments.length,
      icon: ClipboardList,
      isLoading: isAssignmentsLoading,
    },
    {
      title: lang === "ar" ? "التخصيصات" : "Allocations",
      value: allocations.length,
      icon: UserCheck,
      isLoading: isAllocationsLoading,
    },
    {
      title: lang === "ar" ? "اعتماد الخبراء" : "Expert Approvals",
      value: pendingExpertApprovals,
      icon: BadgeCheck,
      isLoading: isUsersLoading,
    },
  ]

  const secondaryStats: Stat[] = [
    {
      title: lang === "ar" ? "الأدوات" : "Tools",
      value: tools.length,
      icon: Wrench,
      isLoading: isToolsLoading,
    },
    {
      title: lang === "ar" ? "التدريب" : "Training",
      value: programs.length,
      icon: GraduationCap,
      isLoading: isTrainingLoading,
    },
    {
      title: lang === "ar" ? "المحاضرات العامة" : "Public Lectures",
      value: lectures.length,
      icon: BookOpen,
      isLoading: isLecturesLoading,
    },
    {
      title: lang === "ar" ? "المدفوعات" : "Payments",
      value: paymentsMade,
      icon: Wallet,
      isLoading: isProfilesLoading,
    },
  ]

  const renderStat = (stat: Stat) => (
    <Card key={stat.title}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <stat.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {stat.isLoading ? (
          <div className="text-2xl font-bold text-muted-foreground">--</div>
        ) : (
          <div className="text-2xl font-bold">{stat.value}</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {lang === "ar" ? "لوحة التحكم" : "Admin Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? `مرحباً بعودتك، ${currentUser?.name}`
            : `Welcome back, ${currentUser?.name}`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map(renderStat)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map(renderStat)}
      </div>
    </div>
  )
}
