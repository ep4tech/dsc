"use client"

import { useState } from "react"
import Link from "next/link"
import { useProfiles } from "@/hooks/useProfiles"
import { useAuth } from "@/hooks/useAuth"
import { useLang } from "@/lib/lang-context"
import { ProfileCard } from "@/components/profiles/ProfileCard"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { paymentStatusLabels } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { DataError } from "@/components/ui/data-error"
import { PageLoader } from "@/components/ui/page-loader"
import { FolderKanban, Plus } from "lucide-react"

export default function ProfilesPage() {
  const { currentUser } = useAuth()
  const { lang } = useLang()
  const { profiles, loadError, refresh, isLoading } = useProfiles()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const projects = profiles.filter(
    (p) =>
      p.service_type === "organization" || currentUser?.role === "organization"
  )
  const filtered = projects.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      [p.name, p.grade, p.notes].some((value) =>
        value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
      )
  )

  if (isLoading) {
    if (loadError) return <DataError message={loadError} onRetry={refresh} />

  return (
      <PageLoader
        text={lang === "ar" ? "جارٍ تحميل المشاريع..." : "Loading projects..."}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "المشاريع" : "Projects"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "ar" ? "إدارة مشاريعك" : "Manage your projects"}
          </p>
        </div>
        <Link href="/dashboard/institution/projects/new">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {lang === "ar" ? "مشروع جديد" : "New Project"}
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <Label htmlFor="project-search">
            {lang === "ar" ? "البحث عن مشروع" : "Search projects"}
          </Label>
          <Input
            id="project-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              lang === "ar"
                ? "الاسم أو النوع أو الوصف"
                : "Name, type, or description"
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-status">
            {lang === "ar" ? "الحالة" : "Status"}
          </Label>
          <select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">
              {lang === "ar" ? "جميع الحالات" : "All statuses"}
            </option>
            {Object.entries(paymentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {lang === "ar" ? "لا توجد مشاريع بعد" : "No projects yet"}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {lang === "ar"
                ? "أنشئ مشروعك الأول للبدء"
                : "Create your first project to get started"}
            </p>
            <Link href="/dashboard/institution/projects/new">
              <Button>
                {lang === "ar" ? "إنشاء مشروع" : "Create Project"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p role="status" className="py-12 text-center text-muted-foreground">
          {lang === "ar"
            ? "لا توجد مشاريع تطابق البحث."
            : "No projects match your search."}
        </p>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0 [&_h3]:min-w-0 [&_h3]:[overflow-wrap:anywhere] [&_div]:[overflow-wrap:anywhere]">
          {filtered.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              hrefPrefix="/dashboard/institution/projects"
            />
          ))}
        </div>
      )}
    </div>
  )
}
