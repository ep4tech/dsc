"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useProfiles } from "@/hooks/useProfiles"
import { useAssignments } from "@/hooks/useAssignments"
import { useLang } from "@/lib/lang-context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageLoader } from "@/components/ui/page-loader"
import { SkeletonTable } from "@/components/ui/skeleton"
import { SmartLink } from "@/components/smart-link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  FolderKanban,
  User,
  Eye,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { formatDate, formatDateTime } from "@/lib/format-date"
import { CaseStatusBadge } from "@/components/cases/status-badge"
import type { Profile } from "@/types/profile"

type CaseSortField = "name" | "date_of_birth" | "gender" | "grade" | "created"

const DATE_SORT_FIELDS: ReadonlySet<CaseSortField> = new Set([
  "date_of_birth",
  "created",
])

interface AssignmentCount {
  total: number
  pending: number
  assigned: number
  in_progress: number
  completed: number
}

export default function AdminCasesPage() {
  const { lang } = useLang()
  const { profiles, isLoading: isProfilesLoading } = useProfiles()
  const { assignments, isLoading: isAssignmentsLoading } = useAssignments()

  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<CaseSortField>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const assignmentCounts = useMemo(() => {
    const counts: Record<string, AssignmentCount> = {}
    assignments.forEach((a) => {
      if (!counts[a.case]) {
        counts[a.case] = {
          total: 0,
          pending: 0,
          assigned: 0,
          in_progress: 0,
          completed: 0,
        }
      }
      counts[a.case].total++
      if (a.status === "pending") counts[a.case].pending++
      else if (a.status === "assigned") counts[a.case].assigned++
      else if (a.status === "in_progress") counts[a.case].in_progress++
      else if (a.status === "completed") counts[a.case].completed++
    })
    return counts
  }, [assignments])

  const isLoading = isProfilesLoading || isAssignmentsLoading

  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      profile.name?.toLowerCase().includes(q) ||
      profile.gender?.toLowerCase().includes(q) ||
      profile.grade?.toLowerCase().includes(q)
    )
  })

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const getVal = (p: Profile) => String(p[sortField] ?? "")

    if (DATE_SORT_FIELDS.has(sortField)) {
      const timeA = Date.parse(getVal(a))
      const timeB = Date.parse(getVal(b))
      const invalidA = Number.isNaN(timeA)
      const invalidB = Number.isNaN(timeB)
      // Keep records with missing/invalid dates at the end in both directions
      if (invalidA || invalidB) {
        if (invalidA && invalidB) return 0
        return invalidA ? 1 : -1
      }
      const cmp = timeA - timeB
      return sortDirection === "asc" ? cmp : -cmp
    }

    const cmp = getVal(a).toLowerCase().localeCompare(getVal(b).toLowerCase())
    return sortDirection === "asc" ? cmp : -cmp
  })

  const handleSortFieldChange = (value: string) => {
    const next = value as CaseSortField
    setSortField(next)
    // Newest (or latest) first is the useful default for date fields
    if (DATE_SORT_FIELDS.has(next)) {
      setSortDirection("desc")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "الحالات" : "Cases"}
            </h1>
            <p className="text-muted-foreground">
              {lang === "ar" ? "إدارة جميع الحالات" : "Manage all cases"}
            </p>
          </div>
          <Link href="/dashboard/admin/cases/new">
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {lang === "ar" ? "حالة جديدة" : "New Case"}
            </Button>
          </Link>
        </div>
        <SkeletonTable rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === "ar" ? "الحالات" : "Cases"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "ar" ? "إدارة جميع الحالات" : "Manage all cases"}
          </p>
        </div>
        <Link href="/dashboard/admin/cases/new">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {lang === "ar" ? "حالة جديدة" : "New Case"}
          </Button>
        </Link>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              lang === "ar"
                ? "ابحث بالاسم أو الجنس أو الصف..."
                : "Search by name, gender, or grade..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {lang === "ar" ? "ترتيب حسب" : "Sort by"}
          </span>
          <Select value={sortField} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">
                {lang === "ar" ? "اسم الحالة" : "Case Name"}
              </SelectItem>
              <SelectItem value="date_of_birth">
                {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
              </SelectItem>
              <SelectItem value="created">
                {lang === "ar" ? "تاريخ الإضافة" : "Date Added"}
              </SelectItem>
              <SelectItem value="gender">
                {lang === "ar" ? "الجنس" : "Gender"}
              </SelectItem>
              <SelectItem value="grade">
                {lang === "ar" ? "الصف الدراسي" : "Grade"}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {sortedProfiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {profiles.length === 0
                ? lang === "ar"
                  ? "لا توجد حالات بعد"
                  : "No cases yet"
                : lang === "ar"
                  ? "لا توجد حالات مطابقة لبحثك"
                  : "No cases match your search"}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {profiles.length === 0
                ? lang === "ar"
                  ? "أنشئ حالتك الأولى للبدء"
                  : "Create your first case to get started"
                : lang === "ar"
                  ? "حاول تعديل استعلام البحث"
                  : "Try adjusting your search query"}
            </p>
            {profiles.length === 0 && (
              <Link href="/dashboard/admin/cases/new">
                <Button>
                  {lang === "ar" ? "إنشاء الحالة" : "Create Case"}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {lang === "ar" ? "جميع الحالات" : "All Cases"}
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? `تم العثور على ${sortedProfiles.length} حالة`
                : `${sortedProfiles.length} case(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    {lang === "ar" ? "اسم الحالة" : "Case Name"}
                  </TableHead>
                  <TableHead>
                    {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {lang === "ar" ? "تاريخ الإضافة" : "Date Added"}
                  </TableHead>
                  <TableHead>{lang === "ar" ? "الجنس" : "Gender"}</TableHead>
                  <TableHead>
                    {lang === "ar" ? "الصف الدراسي" : "Grade"}
                  </TableHead>
                  <TableHead>{lang === "ar" ? "المستخدم" : "User"}</TableHead>
                  <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>
                    {lang === "ar" ? "التعيينات" : "Assignments"}
                  </TableHead>
                  <TableHead className="text-right">
                    {lang === "ar" ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProfiles.map((profile) => {
                  const counts = assignmentCounts[profile.id] || {
                    total: 0,
                    pending: 0,
                    assigned: 0,
                    in_progress: 0,
                    completed: 0,
                  }
                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {profile.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(profile.date_of_birth || "")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(profile.created)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {profile.gender === "male"
                          ? lang === "ar"
                            ? "ذكر"
                            : "male"
                          : profile.gender === "female"
                            ? lang === "ar"
                              ? "أنثى"
                              : "female"
                            : profile.gender}
                      </TableCell>
                      <TableCell className="capitalize">
                        {profile.grade}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {profile.expand?.user
                            ? `${profile.expand.user.name} (${profile.expand.user.email})`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <CaseStatusBadge status={profile.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {counts.total === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {lang === "ar"
                                ? "لا توجد تعيينات"
                                : "No assignments"}
                            </span>
                          ) : (
                            <>
                              {counts.pending > 0 && (
                                <Badge
                                  key="pending"
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700"
                                >
                                  {counts.pending}{" "}
                                  {lang === "ar" ? "قيد الانتظار" : "pending"}
                                </Badge>
                              )}
                              {counts.assigned > 0 && (
                                <Badge
                                  key="assigned"
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700"
                                >
                                  {counts.assigned}{" "}
                                  {lang === "ar" ? "تم التعيين" : "assigned"}
                                </Badge>
                              )}
                              {counts.in_progress > 0 && (
                                <Badge
                                  key="in_progress"
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700"
                                >
                                  {counts.in_progress}{" "}
                                  {lang === "ar"
                                    ? "قيد التنفيذ"
                                    : "in progress"}
                                </Badge>
                              )}
                              {counts.completed > 0 && (
                                <Badge
                                  key="completed"
                                  variant="outline"
                                  className="bg-green-50 text-green-700"
                                >
                                  {counts.completed}{" "}
                                  {lang === "ar" ? "مكتمل" : "completed"}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <SmartLink
                          href={`/dashboard/admin/cases/${profile.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="me-1 h-4 w-4" />
                            {lang === "ar" ? "عرض" : "View"}
                          </Button>
                        </SmartLink>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
