"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"
import { useUsers } from "@/hooks/useUsers"
import { useProfiles } from "@/hooks/useProfiles"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
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
import { EmailInput } from "@/components/ui/email-input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Users,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  Trash2,
  User as UserIcon,
  Building2,
  GraduationCap,
  Shield,
} from "lucide-react"
import type { User, UserRole } from "@/types/user"
import { IndividualRegistrationForm } from "@/components/register/IndividualRegistrationForm"
import { ParentRegistrationForm } from "@/components/register/ParentRegistrationForm"
import { OrganizationRegistrationForm } from "@/components/register/OrganizationRegistrationForm"
import { ExpertApplicationForm } from "@/components/register/ExpertApplicationForm"
import {
  EMAIL_INVALID_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validators"

const ALL_ROLES: UserRole[] = [
  "admin",
  "individual",
  "parent",
  "organization",
  "expert",
  "super_admin",
]

const roleLabels: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مشرف" },
  individual: { en: "Individual", ar: "فرد" },
  parent: { en: "Parent", ar: "ولي أمر" },
  organization: { en: "Organization", ar: "منظمة" },
  expert: { en: "Expert", ar: "خبير" },
  super_admin: { en: "Super Admin", ar: "مشرف عام" },
}

type AddUserType = "individual" | "parent" | "organization" | "expert" | "admin"

const USER_TYPE_OPTIONS: {
  value: AddUserType
  icon: React.ComponentType<{ className?: string }>
  label: { en: string; ar: string }
  description: { en: string; ar: string }
}[] = [
  {
    value: "individual",
    icon: UserIcon,
    label: { en: "Individual", ar: "فرد" },
    description: { en: "Personal user account", ar: "حساب مستخدم فردي" },
  },
  {
    value: "parent",
    icon: Users,
    label: { en: "Parent", ar: "ولي أمر" },
    description: { en: "Parent or guardian account", ar: "حساب ولي أمر" },
  },
  {
    value: "organization",
    icon: Building2,
    label: { en: "Organization", ar: "منظمة" },
    description: {
      en: "Institution or company account",
      ar: "حساب مؤسسة أو شركة",
    },
  },
  {
    value: "expert",
    icon: GraduationCap,
    label: { en: "Expert", ar: "خبير" },
    description: {
      en: "Expert account with profile",
      ar: "حساب خبير مع ملف شخصي",
    },
  },
  {
    value: "admin",
    icon: Shield,
    label: { en: "Admin", ar: "مشرف" },
    description: {
      en: "Admin or super admin account",
      ar: "حساب مشرف أو مشرف عام",
    },
  },
]

export function UserManagement({
  expertsOnly = false,
}: {
  expertsOnly?: boolean
}) {
  const { lang } = useLang()
  const {
    users,
    isLoading: isUsersLoading,
    addUser,
    updateUser,
    deleteUser,
    getDeletionBlockers,
    refresh,
  } = useUsers()
  const { profiles, isLoading: isProfilesLoading } = useProfiles()

  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [showAddModal, setShowAddModal] = useState(false)
  const [addUserType, setAddUserType] = useState<AddUserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    role: "admin" as UserRole,
    contact_number: "",
    is_active: true,
  })

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteBlockers, setDeleteBlockers] = useState<{
    cases: number
    assignments: number
  } | null>(null)
  const [isCheckingDelete, setIsCheckingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const isLoading = isUsersLoading || isProfilesLoading

  const caseCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    profiles.forEach((p) => {
      counts[p.user] = (counts[p.user] || 0) + 1
    })
    return counts
  }, [profiles])

  const filteredUsers = users.filter((user) => {
    if ((user.role === "expert") !== expertsOnly) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q)
    )
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const getVal = (u: User) => {
      const v = u[sortField as keyof User]
      return (v?.toString() || "").toLowerCase()
    }
    const cmp = getVal(a).localeCompare(getVal(b))
    return sortDirection === "asc" ? cmp : -cmp
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUser(userId, { role: newRole as UserRole })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { is_active: isActive })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const resetAddModal = () => {
    setShowAddModal(false)
    setAddUserType(null)
    setFormError(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      role: "admin",
      contact_number: "",
      is_active: true,
    })
  }

  const handleRegistrationSuccess = () => {
    resetAddModal()
    refresh()
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name || !formData.email || !formData.password) {
      setFormError(
        lang === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة."
          : "Please fill in all required fields."
      )
      return
    }
    if (!isValidEmail(formData.email)) {
      setFormError(t(EMAIL_INVALID_MESSAGE, lang))
      return
    }
    if (formData.password !== formData.passwordConfirm) {
      setFormError(
        lang === "ar"
          ? "كلمتا المرور غير متطابقتين."
          : "Passwords do not match."
      )
      return
    }

    setIsSubmitting(true)
    try {
      await addUser({
        email: normalizeEmail(formData.email),
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name.trim(),
        role: formData.role,
        contact_number: formData.contact_number.trim(),
        is_active: formData.is_active,
      })
      toast.success(
        t(
          { en: "User created successfully.", ar: "تم إنشاء المستخدم بنجاح." },
          lang
        )
      )
      resetAddModal()
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(error) ||
          (lang === "ar"
            ? "فشل إنشاء المستخدم. حاول مرة أخرى."
            : "Failed to create user. Please try again.")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async (user: User) => {
    setDeleteTarget(user)
    setDeleteBlockers(null)
    setDeleteError("")
    setIsCheckingDelete(true)
    try {
      const blockers = await getDeletionBlockers(user.id)
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
    setDeleteTarget(null)
    setDeleteBlockers(null)
    setDeleteError("")
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError("")
    try {
      await deleteUser(deleteTarget.id)
      closeDeleteDialog()
    } catch (error: unknown) {
      setDeleteError(
        getErrorMessage(error) ||
          (lang === "ar"
            ? "فشل حذف المستخدم. حاول مرة أخرى."
            : "Failed to delete user. Please try again.")
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {expertsOnly
                ? lang === "ar"
                  ? "الخبراء"
                  : "Experts"
                : lang === "ar"
                  ? "المستخدمون"
                  : "Users"}
            </h1>
            <p className="text-muted-foreground">
              {expertsOnly
                ? lang === "ar"
                  ? "إدارة حسابات الخبراء"
                  : "Manage expert accounts"
                : lang === "ar"
                  ? "إدارة المستخدمين"
                  : "Manage user accounts"}
            </p>
          </div>
          <Button disabled>
            <Plus className="me-2 h-4 w-4" />
            {expertsOnly
              ? lang === "ar"
                ? "إضافة خبير"
                : "Add Expert"
              : lang === "ar"
                ? "إضافة مستخدم"
                : "Add User"}
          </Button>
        </div>
        <SkeletonTable rows={6} />
      </div>
    )
  }

  const isBlocked =
    deleteBlockers !== null &&
    (deleteBlockers.cases > 0 || deleteBlockers.assignments > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {expertsOnly
              ? lang === "ar"
                ? "الخبراء"
                : "Experts"
              : lang === "ar"
                ? "المستخدمون"
                : "Users"}
          </h1>
          <p className="text-muted-foreground">
            {expertsOnly
              ? lang === "ar"
                ? "إدارة حسابات الخبراء"
                : "Manage expert accounts"
              : lang === "ar"
                ? "إدارة المستخدمين"
                : "Manage user accounts"}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="me-2 h-4 w-4" />
          {expertsOnly
            ? lang === "ar"
              ? "إضافة خبير"
              : "Add Expert"
            : lang === "ar"
              ? "إضافة مستخدم"
              : "Add User"}
        </Button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              lang === "ar"
                ? "ابحث بالاسم أو البريد الإلكتروني أو الدور..."
                : "Search by name, email, or role..."
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
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">
                {lang === "ar" ? "الاسم" : "Name"}
              </SelectItem>
              <SelectItem value="email">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </SelectItem>
              <SelectItem value="role">
                {lang === "ar" ? "الدور" : "Role"}
              </SelectItem>
              <SelectItem value="created">
                {lang === "ar" ? "تاريخ الإنشاء" : "Created"}
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

      {sortedUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {users.length === 0
                ? lang === "ar"
                  ? "لا يوجد مستخدمون بعد"
                  : "No users yet"
                : lang === "ar"
                  ? "لا يوجد مستخدمون مطابقون لبحثك"
                  : "No users match your search"}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {users.length === 0
                ? lang === "ar"
                  ? "أضف مستخدمك الأول للبدء"
                  : "Add your first user to get started"
                : lang === "ar"
                  ? "حاول تعديل استعلام البحث"
                  : "Try adjusting your search query"}
            </p>
            {users.length === 0 && (
              <Button onClick={() => setShowAddModal(true)}>
                {expertsOnly
                  ? lang === "ar"
                    ? "إضافة خبير"
                    : "Add Expert"
                  : lang === "ar"
                    ? "إضافة مستخدم"
                    : "Add User"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {expertsOnly
                ? lang === "ar"
                  ? "جميع الخبراء"
                  : "All Experts"
                : lang === "ar"
                  ? "جميع المستخدمين"
                  : "All Users"}
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? `تم العثور على ${sortedUsers.length} مستخدم`
                : `${sortedUsers.length} user(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {lang === "ar" ? "الاسم" : "Name"}
                  </TableHead>
                  <TableHead>
                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                  </TableHead>
                  <TableHead>{lang === "ar" ? "الدور" : "Role"}</TableHead>
                  <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{lang === "ar" ? "الحالات" : "Cases"}</TableHead>
                  <TableHead className="text-right">
                    {lang === "ar" ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === "super_admin" || expertsOnly ? (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700"
                        >
                          {roleLabels[user.role]?.[lang] || user.role}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.filter(
                              (r) => r !== "super_admin" && r !== "expert"
                            ).map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleLabels[role]?.[lang] || role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          disabled={user.role === "super_admin"}
                          onCheckedChange={(checked) =>
                            handleStatusChange(user.id, checked)
                          }
                        />
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
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {caseCounts[user.id] || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <SmartLink
                          href={`/dashboard/admin/${expertsOnly ? "experts" : "users"}/${user.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="me-1 h-4 w-4" />
                            {lang === "ar" ? "عرض" : "View"}
                          </Button>
                        </SmartLink>
                        {user.role !== "super_admin" &&
                          (caseCounts[user.id] || 0) === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add User Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) resetAddModal()
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {addUserType
                ? lang === "ar"
                  ? `إضافة ${
                      USER_TYPE_OPTIONS.find((o) => o.value === addUserType)
                        ?.label.ar
                    } جديد`
                  : `Add New ${
                      USER_TYPE_OPTIONS.find((o) => o.value === addUserType)
                        ?.label.en
                    }`
                : lang === "ar"
                  ? "إضافة مستخدم جديد"
                  : expertsOnly
                    ? "Add New Expert"
                    : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {addUserType
                ? lang === "ar"
                  ? "املأ النموذج أدناه لإنشاء الحساب."
                  : "Fill in the form below to create the account."
                : lang === "ar"
                  ? "اختر نوع المستخدم الذي تريد إنشاءه."
                  : "Choose the type of user you want to create."}
            </DialogDescription>
          </DialogHeader>

          {!addUserType ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {USER_TYPE_OPTIONS.filter(
                (option) => (option.value === "expert") === expertsOnly
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setAddUserType(option.value)
                    setFormError(null)
                  }}
                  className="flex items-start gap-3 rounded-lg border p-4 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <option.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <span>
                    <span className="block font-medium">
                      {option.label[lang]}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {option.description[lang]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddUserType(null)
                  setFormError(null)
                }}
              >
                <ArrowLeft className="me-2 h-4 w-4" />
                {lang === "ar" ? "رجوع" : "Back"}
              </Button>

              {addUserType === "admin" ? (
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  {formError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {lang === "ar" ? "الاسم الكامل" : "Full Name"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={
                        lang === "ar" ? "أدخل الاسم الكامل" : "Enter full name"
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {lang === "ar" ? "البريد الإلكتروني" : "Email"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <EmailInput
                      id="email"
                      value={formData.email}
                      onChange={(value) =>
                        setFormData({ ...formData, email: value })
                      }
                      placeholder={
                        lang === "ar"
                          ? "أدخل عنوان البريد الإلكتروني"
                          : "Enter email address"
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        {lang === "ar" ? "كلمة المرور" : "Password"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <PasswordInput
                        id="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={
                          lang === "ar"
                            ? "8 أحرف على الأقل"
                            : "Min 8 characters"
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">
                        {lang === "ar"
                          ? "تأكيد كلمة المرور"
                          : "Confirm Password"}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <PasswordInput
                        id="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passwordConfirm: e.target.value,
                          })
                        }
                        placeholder={
                          lang === "ar" ? "أكد كلمة المرور" : "Confirm password"
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        {lang === "ar" ? "الدور" : "Role"}
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value as UserRole })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            {roleLabels.admin?.[lang]}
                          </SelectItem>
                          <SelectItem value="super_admin">
                            {roleLabels.super_admin?.[lang]}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_number">
                        {lang === "ar" ? "رقم الاتصال" : "Contact Number"}
                      </Label>
                      <Input
                        id="contact_number"
                        value={formData.contact_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_number: e.target.value,
                          })
                        }
                        placeholder={
                          lang === "ar" ? "رقم الهاتف" : "Phone number"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      {lang === "ar" ? "حساب نشط" : "Active account"}
                    </Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetAddModal}
                    >
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? lang === "ar"
                          ? "جارٍ الإنشاء..."
                          : "Creating..."
                        : lang === "ar"
                          ? "إنشاء مستخدم"
                          : "Create User"}
                    </Button>
                  </div>
                </form>
              ) : addUserType === "individual" ? (
                <IndividualRegistrationForm
                  onSuccess={handleRegistrationSuccess}
                />
              ) : addUserType === "parent" ? (
                <ParentRegistrationForm
                  onSuccess={handleRegistrationSuccess}
                  hideChildren
                />
              ) : addUserType === "organization" ? (
                <OrganizationRegistrationForm
                  onSuccess={handleRegistrationSuccess}
                />
              ) : (
                <ExpertApplicationForm onSuccess={handleRegistrationSuccess} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "حذف المستخدم" : "Delete User"}
            </DialogTitle>
            <DialogDescription>{deleteTarget?.name}</DialogDescription>
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
          ) : isBlocked ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                {lang === "ar"
                  ? `لا يمكن حذف ${deleteTarget?.name}. لدى هذا المستخدم سجلات مرتبطة:`
                  : `Cannot delete ${deleteTarget?.name}. This user has linked records:`}
                <ul className="mt-2 list-disc space-y-1 ps-5">
                  {deleteBlockers!.cases > 0 && (
                    <li>
                      {lang === "ar"
                        ? `${deleteBlockers!.cases} حالة`
                        : `${deleteBlockers!.cases} case(s)`}
                    </li>
                  )}
                  {deleteBlockers!.assignments > 0 && (
                    <li>
                      {lang === "ar"
                        ? `${deleteBlockers!.assignments} تعيين خبير`
                        : `${deleteBlockers!.assignments} expert assignment(s)`}
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
                  ? `هل أنت متأكد من حذف ${deleteTarget?.name}؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
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
