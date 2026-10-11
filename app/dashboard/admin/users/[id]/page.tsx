"use client"

import { use, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUsers } from "@/hooks/useUsers"
import { useAuth } from "@/hooks/useAuth"
import { useProfiles } from "@/hooks/useProfiles"
import { useLang } from "@/lib/lang-context"
import pb, { getErrorMessage, getFieldErrors } from "@/lib/pb"
import { t } from "@/lib/i18n"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"
import { UserProfileView } from "@/components/profile/UserProfileView"
import { UserProfileEditor } from "@/components/profile/UserProfileEditor"
import { ExpertProfileView } from "@/components/expert/ExpertProfileView"
import { ExpertProfileEditor } from "@/components/expert/ExpertProfileEditor"
import {
  draftFromUserProfile,
  useUserProfileRecord,
  type UserProfileDraft,
} from "@/hooks/useUserProfileRecord"
import {
  draftFromProfile,
  profileFileUrl,
  profilePhotoName,
  saveExpertProfileFor,
} from "@/hooks/useExpertProfile"
import type { ExpertProfile, ExpertProfileDraft } from "@/types/expert"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  FolderKanban,
  KeyRound,
  Plus,
  Eye,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/format-date"
import type { Profile } from "@/types/profile"

const GRADES = [
  { value: "kg1", label: { en: "KG 1", ar: "روضة 1" } },
  { value: "kg2", label: { en: "KG 2", ar: "روضة 2" } },
  { value: "grade1", label: { en: "Grade 1", ar: "الصف الأول" } },
  { value: "grade2", label: { en: "Grade 2", ar: "الصف الثاني" } },
  { value: "grade3", label: { en: "Grade 3", ar: "الصف الثالث" } },
  { value: "grade4", label: { en: "Grade 4", ar: "الصف الرابع" } },
  { value: "grade5", label: { en: "Grade 5", ar: "الصف الخامس" } },
  { value: "grade6", label: { en: "Grade 6", ar: "الصف السادس" } },
  { value: "grade7", label: { en: "Grade 7", ar: "الصف السابع" } },
  { value: "grade8", label: { en: "Grade 8", ar: "الصف الثامن" } },
  { value: "grade9", label: { en: "Grade 9", ar: "الصف التاسع" } },
  { value: "grade10", label: { en: "Grade 10", ar: "الصف العاشر" } },
  { value: "grade11", label: { en: "Grade 11", ar: "الصف الحادي عشر" } },
  { value: "grade12", label: { en: "Grade 12", ar: "الصف الثاني عشر" } },
  { value: "university", label: { en: "University", ar: "الجامعة" } },
]

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: userId } = use(params)
  const router = useRouter()
  const usersListPath = usePathname().includes("/experts/") ? "/dashboard/admin/experts" : "/dashboard/admin/users"
  const { lang } = useLang()
  const {
    users,
    isLoading: isUsersLoading,
    resetPassword,
    deleteUser,
    getDeletionBlockers,
    refresh,
  } = useUsers()
  const { profiles, isLoading: isProfilesLoading, refresh: refreshProfiles } = useProfiles()

  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<UserProfileDraft | null>(null)
  const [expertDraft, setExpertDraft] = useState<ExpertProfileDraft | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isExpertSaving, setIsExpertSaving] = useState(false)
  const [showAddCaseModal, setShowAddCaseModal] = useState(false)
  const [isSubmittingCase, setIsSubmittingCase] = useState(false)
  const [caseFormError, setCaseFormError] = useState<string | null>(null)
  const [caseFormData, setCaseFormData] = useState({
    name: "",
    date_of_birth: "",
    gender: "" as "male" | "female" | "",
    grade: "",
    notes: "",
  })

  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteBlockers, setDeleteBlockers] = useState<{
    cases: number
    assignments: number
  } | null>(null)
  const [isCheckingDelete, setIsCheckingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const user = users.find((u) => u.id === userId)

  // Experts have a much richer application, so they get their own view.
  const {
    profile: roleProfile,
    fileToken: roleFileToken,
    isLoading: isRoleProfileLoading,
    isSaving: isRoleSaving,
    loadError: roleLoadError,
    reload: reloadRoleProfile,
    save: saveRoleProfile,
  } = useUserProfileRecord(userId, user?.role)

  const expertProfile =
    user?.role === "expert"
      ? (roleProfile as unknown as ExpertProfile | null)
      : null

  const expertPhotoUrl = expertProfile
    ? profileFileUrl(expertProfile, profilePhotoName(expertProfile), roleFileToken)
    : ""

  const userCases = profiles.filter((p) => p.user === userId)

  // An admin cannot reset a super admin's password, and neither should anyone
  // reset their own here — the self-serve reset flow covers that.
  const { currentUser, isSuperAdmin } = useAuth()
  const canResetPassword =
    Boolean(user) &&
    user!.id !== currentUser?.id &&
    (isSuperAdmin || user!.role !== "super_admin")

  const startEditing = () => {
    if (!user) return
    setFieldErrors({})
    if (user.role === "expert") {
      setExpertDraft(draftFromProfile(expertProfile, user.name))
    } else {
      setDraft(draftFromUserProfile(user, roleProfile))
    }
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft(null)
    setExpertDraft(null)
    setFieldErrors({})
    setIsEditing(false)
  }

  const handleSubmit = async () => {
    if (!user) return

    setFieldErrors({})
    const isExpert = user.role === "expert"
    try {
      if (isExpert && expertDraft) {
        if (!expertDraft.name.trim()) {
          setFieldErrors({
            name: t({ en: "This field is required.", ar: "هذا الحقل مطلوب." }, lang),
          })
          return
        }
        // The expert editor writes expert_profiles itself, so the saving flag
        // is tracked here rather than by useUserProfileRecord.
        setIsExpertSaving(true)
        await saveExpertProfileFor(expertDraft, user.id, expertProfile?.id)
      } else if (draft) {
        if (!draft.name.trim()) {
          setFieldErrors({
            name: t({ en: "This field is required.", ar: "هذا الحقل مطلوب." }, lang),
          })
          return
        }
        await saveRoleProfile(draft)
      }
      toast.success(
        t({ en: "Profile updated successfully.", ar: "تم تحديث الملف بنجاح." }, lang)
      )
      cancelEditing()
      // Both writers return the saved row, but refreshing keeps the view honest
      // about generated values (updated timestamps, stored filenames).
      await reloadRoleProfile()
      refresh()
    } catch (error) {
      const errors = getFieldErrors(error, lang)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      } else {
        toast.error(
          getErrorMessage(error) ||
            t(
              {
                en: "Failed to save the profile. Please try again.",
                ar: "تعذّر حفظ الملف. يرجى المحاولة مرة أخرى.",
              },
              lang
            )
        )
      }
    } finally {
      setIsExpertSaving(false)
    }
  }

  const handleResetPassword = async (password: string) => {
    setIsResettingPassword(true)
    try {
      await resetPassword(userId, password)
      toast.success(
        t(
          {
            en: "Password reset. Share the new password with the user directly.",
            ar: "تم تغيير كلمة المرور. شارك الكلمة الجديدة مع المستخدم مباشرة.",
          },
          lang
        )
      )
      setShowResetPasswordDialog(false)
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDeleteClick = async () => {
    setShowDeleteDialog(true)
    setDeleteBlockers(null)
    setDeleteError("")
    setIsCheckingDelete(true)
    try {
      const blockers = await getDeletionBlockers(userId)
      setDeleteBlockers(blockers)
    } catch (error: unknown) {
      setDeleteError(
        getErrorMessage(error) ||
          (lang === "ar"
            ? "فشل التحقق من السجلات المرتبطة."
            : "Failed to check linked records.")
      )
    } finally {
      setIsCheckingDelete(false)
    }
  }

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteBlockers(null)
    setDeleteError("")
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setDeleteError("")
    try {
      await deleteUser(userId)
      router.push(usersListPath)
    } catch (error: unknown) {
      setDeleteError(
        getErrorMessage(error) ||
          (lang === "ar"
            ? "فشل حذف المستخدم. حاول مرة أخرى."
            : "Failed to delete user. Please try again.")
      )
      setIsDeleting(false)
    }
  }

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setCaseFormError(null)

    if (!caseFormData.name) {
      setCaseFormError(
        lang === "ar" ? "اسم الحالة مطلوب." : "Case name is required."
      )
      return
    }

    setIsSubmittingCase(true)
    try {
      await pb.collection("cases").create({
        user: userId,
        name: caseFormData.name,
        date_of_birth: caseFormData.date_of_birth,
        gender: caseFormData.gender || undefined,
        grade: caseFormData.grade,
        notes: caseFormData.notes,
      })
      setShowAddCaseModal(false)
      setCaseFormData({
        name: "",
        date_of_birth: "",
        gender: "",
        grade: "",
        notes: "",
      })
      // Refresh profiles to show new case
      refreshProfiles()
    } catch (error: unknown) {
      setCaseFormError(
        getErrorMessage(error) ||
          (lang === "ar"
            ? "فشل إنشاء الحالة. حاول مرة أخرى."
            : "Failed to create case. Please try again.")
      )
    } finally {
      setIsSubmittingCase(false)
    }
  }

  // The users list has to resolve before the role is known, so hold the
  // skeleton rather than reporting a missing user mid-fetch.
  if (isUsersLoading || (!user && isRoleProfileLoading)) {
    return <ProfileSkeleton expert={false} />
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "المستخدم غير موجود" : "User not found"}
        </h2>
        <Link href={usersListPath}>
          <Button>
            {lang === "ar" ? "العودة إلى المستخدمين" : "Back to Users"}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {canResetPassword && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetPasswordDialog(true)}
          >
            <KeyRound className="me-1 h-4 w-4" />
            {t({ en: "Reset Password", ar: "تغيير كلمة المرور" }, lang)}
          </Button>
        )}
        {user.role !== "super_admin" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
          >
            <Trash2 className="me-1 h-4 w-4" />
            {lang === "ar" ? "حذف" : "Delete"}
          </Button>
        )}
        <Badge
          variant="outline"
          className={
            user.is_active
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }
        >
          {user.is_active
            ? lang === "ar"
              ? "نشط"
              : "Active"
            : lang === "ar"
              ? "غير نشط"
              : "Inactive"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            {lang === "ar" ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="cases">
            {lang === "ar" ? "الحالات" : "Cases"}
            <Badge variant="secondary" className="ms-2">
              {userCases.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isRoleProfileLoading ? (
            <ProfileSkeleton expert={user.role === "expert"} />
          ) : roleLoadError ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {roleLoadError}
            </div>
          ) : isEditing && user.role === "expert" && expertDraft ? (
            <ExpertProfileEditor
              draft={expertDraft}
              onChange={setExpertDraft}
              email={user.email}
              photoUrl={expertPhotoUrl}
              fieldErrors={fieldErrors}
              isSaving={isExpertSaving}
              title={t({ en: "Edit Expert Profile", ar: "تعديل ملف الخبير" }, lang)}
              subtitle={t(
                {
                  en: `Update the details ${user.name} submitted when they applied.`,
                  ar: `حدّث البيانات التي أدخلها ${user.name} عند التقديم.`,
                },
                lang
              )}
              onCancel={cancelEditing}
              onSubmit={handleSubmit}
            />
          ) : isEditing && draft ? (
            <UserProfileEditor
              user={user}
              profile={roleProfile}
              draft={draft}
              onChange={setDraft}
              fieldErrors={fieldErrors}
              isSaving={isRoleSaving}
              onCancel={cancelEditing}
              onSubmit={handleSubmit}
            />
          ) : user.role === "expert" ? (
            <ExpertProfileView
              name={user.name}
              email={user.email}
              profile={expertProfile}
              fileToken={roleFileToken}
              hideHeading
              memberSinceLabel={
                lang === "ar" ? "مقدم الطلب منذ" : "Applied"
              }
              onEdit={startEditing}
            />
          ) : (
            <UserProfileView user={user} profile={roleProfile} onEdit={startEditing} />
          )}
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  {lang === "ar" ? "الحالات" : "Cases"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar"
                    ? `إدارة الحالات لـ ${user.name}`
                    : `Manage cases for ${user.name}`}
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddCaseModal(true)}>
                <Plus className="me-2 h-4 w-4" />
                {lang === "ar" ? "إضافة حالة" : "Add Case"}
              </Button>
            </CardHeader>
            <CardContent>
              {isProfilesLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  {lang === "ar" ? "جارٍ تحميل الحالات..." : "Loading cases..."}
                </div>
              ) : userCases.length === 0 ? (
                <div className="py-8 text-center">
                  <FolderKanban className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar" ? "لا توجد حالات بعد" : "No cases yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {lang === "ar"
                      ? 'لا توجد حالات لهذا المستخدم. انقر على "إضافة حالة" لإنشاء حالة.'
                      : 'This user has no cases. Click "Add Case" to create one.'}
                  </p>
                  <Button onClick={() => setShowAddCaseModal(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {lang === "ar" ? "إضافة حالة" : "Add Case"}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {lang === "ar" ? "اسم الحالة" : "Case Name"}
                      </TableHead>
                      <TableHead>
                        {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                      </TableHead>
                      <TableHead>{lang === "ar" ? "الجنس" : "Gender"}</TableHead>
                      <TableHead>{lang === "ar" ? "الصف الدراسي" : "Grade"}</TableHead>
                      <TableHead>
                        {lang === "ar" ? "تاريخ الإنشاء" : "Created"}
                      </TableHead>
                      <TableHead className="text-right">
                        {lang === "ar" ? "الإجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userCases.map((profile: Profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.name}
                        </TableCell>
                        <TableCell>
                          {profile.date_of_birth
                            ? formatDate(profile.date_of_birth)
                            : "—"}
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
                              : profile.gender || "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {profile.grade || "—"}
                        </TableCell>
                        <TableCell>{formatDate(profile.created)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/admin/cases/${profile.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="me-1 h-4 w-4" />
                              {lang === "ar" ? "عرض" : "View"}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Case Modal */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {lang === "ar"
                  ? `إضافة حالة جديدة لـ ${user.name}`
                  : `Add New Case for ${user.name}`}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "أنشئ حالة جديدة وخصصها لهذا المستخدم."
                  : "Create a new case and assign it to this user."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCase} className="space-y-4">
                {caseFormError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {caseFormError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="case_name">
                    {lang === "ar" ? "اسم الحالة" : "Case Name"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="case_name"
                    value={caseFormData.name}
                    onChange={(e) =>
                      setCaseFormData({ ...caseFormData, name: e.target.value })
                    }
                    placeholder={lang === "ar" ? "أدخل اسم الحالة" : "Enter case name"}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                    </Label>
                    <DateInput
                      id="date_of_birth"
                      value={caseFormData.date_of_birth}
                      onChange={(v) =>
                        setCaseFormData({
                          ...caseFormData,
                          date_of_birth: v,
                        })
                      }
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      {lang === "ar" ? "الجنس" : "Gender"}
                    </Label>
                    <Select
                      value={caseFormData.gender}
                      onValueChange={(value) =>
                        setCaseFormData({
                          ...caseFormData,
                          gender: value as "male" | "female",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            lang === "ar" ? "اختر الجنس" : "Select gender"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">
                          {lang === "ar" ? "ذكر" : "Male"}
                        </SelectItem>
                        <SelectItem value="female">
                          {lang === "ar" ? "أنثى" : "Female"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">
                    {lang === "ar" ? "الصف الدراسي" : "Grade"}
                  </Label>
                  <Select
                    value={caseFormData.grade}
                    onValueChange={(value) =>
                      setCaseFormData({ ...caseFormData, grade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={lang === "ar" ? "اختر الصف" : "Select grade"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label[lang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {lang === "ar" ? "ملاحظات" : "Notes"}
                  </Label>
                  <Input
                    id="notes"
                    value={caseFormData.notes}
                    onChange={(e) =>
                      setCaseFormData({ ...caseFormData, notes: e.target.value })
                    }
                    placeholder={lang === "ar" ? "ملاحظات إضافية" : "Additional notes"}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddCaseModal(false)
                      setCaseFormError(null)
                    }}
                  >
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={isSubmittingCase}>
                    {isSubmittingCase
                      ? lang === "ar"
                        ? "جارٍ الإنشاء..."
                        : "Creating..."
                      : lang === "ar"
                        ? "إنشاء الحالة"
                        : "Create Case"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ResetPasswordDialog
        user={user}
        open={showResetPasswordDialog}
        isSaving={isResettingPassword}
        onClose={() => setShowResetPasswordDialog(false)}
        onSubmit={handleResetPassword}
      />

      {/* Delete User Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "حذف المستخدم" : "Delete User"}
            </DialogTitle>
            <DialogDescription>{user.name}</DialogDescription>
          </DialogHeader>

          {isCheckingDelete ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {lang === "ar"
                ? "جارٍ التحقق من السجلات المرتبطة..."
                : "Checking linked records..."}
            </p>
          ) : deleteError ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {deleteError}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={closeDeleteDialog}>
                  {lang === "ar" ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          ) : deleteBlockers &&
            (deleteBlockers.cases > 0 || deleteBlockers.assignments > 0) ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                {lang === "ar"
                  ? `لا يمكن حذف ${user.name}. لدى هذا المستخدم سجلات مرتبطة:`
                  : `Cannot delete ${user.name}. This user has linked records:`}
                <ul className="mt-2 list-disc space-y-1 ps-5">
                  {deleteBlockers.cases > 0 && (
                    <li>
                      {lang === "ar"
                        ? `${deleteBlockers.cases} حالة`
                        : `${deleteBlockers.cases} case(s)`}
                    </li>
                  )}
                  {deleteBlockers.assignments > 0 && (
                    <li>
                      {lang === "ar"
                        ? `${deleteBlockers.assignments} تعيين خبير`
                        : `${deleteBlockers.assignments} expert assignment(s)`}
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={closeDeleteDialog}>
                  {lang === "ar" ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? `هل أنت متأكد من حذف ${user.name}؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete ${user.name}? This action cannot be undone.`}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDeleteDialog}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? lang === "ar"
                      ? "جارٍ الحذف..."
                      : "Deleting..."
                    : lang === "ar"
                      ? "حذف"
                      : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
