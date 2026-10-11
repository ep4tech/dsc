"use client"
import { CaseFeedback } from "@/components/cases/CaseFeedback"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfiles } from "@/hooks/useProfiles"
import { useAssignments } from "@/hooks/useAssignments"
import { useTools } from "@/hooks/useTools"
import { useToolTypes } from "@/hooks/useToolTypes"
import { useUsers } from "@/hooks/useUsers"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { useAuth } from "@/hooks/useAuth"
import { usePaymentSettings } from "@/hooks/usePaymentSettings"
import pb, { getErrorMessage } from "@/lib/pb"
import {
  EMAIL_INVALID_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validators"
import { toast } from "sonner"
import { sendCredentialsEmail } from "@/lib/send-credentials-email"
import { formatDate } from "@/lib/format-date"

import { CaseStatusBadge } from "@/components/cases/status-badge"
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
import { EmailInput } from "@/components/ui/email-input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Phone,
  ClipboardList,
  History,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Plus,
  Link2,
  UserX,
  UserPlus,
  KeyRound,
  Wallet,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import type { AssignmentStatus } from "@/types/assignment"
import type { Tool, ToolType, ToolConfig } from "@/types/tool"
import {
  getToolTypeLabel,
  getToolTypeMeta,
  toolTypeOrder,
} from "@/lib/tool-types"
import {
  getAllowedToolTypesForCase,
  getAllowedToolTypesForRole,
  caseExpertsCollection,
} from "@/lib/pb-collections"

const statusColors: Record<AssignmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
}

const statusLabels: Record<AssignmentStatus, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  assigned: { en: "Assigned", ar: "تم التعيين" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
}

export default function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: caseId } = use(params)
  const router = useRouter()
  const { lang } = useLang()
  const { currentUser, isAdmin } = useAuth()
  const { getProfileById, updateProfile, setPaymentAmount, approveCase, rejectPayment } =
    useProfiles()
  const { assignments, assignTool, deleteAssignment } = useAssignments()
  const { tools } = useTools()
  const { toolTypes, fetchToolTypes } = useToolTypes()
  const { users } = useUsers()
  const { bankDetails } = usePaymentSettings()

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignTab, setAssignTab] = useState<"templates" | "caseSpecific">(
    "templates"
  )
  const [toolTypeFilter, setToolTypeFilter] = useState<string>("all")
  const [confirmToolType, setConfirmToolType] = useState<string | null>(null)
  const [allowedToolTypeIds, setAllowedToolTypeIds] = useState<string[]>([])
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing")
  const [linkUserId, setLinkUserId] = useState("")
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" })
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)
  const [amountInput, setAmountInput] = useState<string | null>(null)
  const [rejectInput, setRejectInput] = useState("")
  const [isPaymentBusy, setIsPaymentBusy] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  const profile = getProfileById(caseId)
  const caseAssignments = assignments.filter((a) => a.case === caseId)
  const isExpert = currentUser?.role === "expert"
  const owner = profile ? users.find((u) => u.id === profile.user) : undefined
  const linkableUsers = users.filter(
    (u) => !["admin", "super_admin", "expert"].includes(u.role)
  )

  const handleLinkExisting = async () => {
    if (!linkUserId) return
    setIsLinking(true)
    setLinkError(null)
    setLinkSuccess(null)
    try {
      await updateProfile(caseId, { user: linkUserId })
      setLinkSuccess(
        lang === "ar" ? "تم ربط الحالة بالمستخدم." : "Case linked to user."
      )
      setLinkUserId("")
    } catch (error) {
      setLinkError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل ربط المستخدم." : "Failed to link user.")
      )
    } finally {
      setIsLinking(false)
    }
  }

  const handleCreateAndLink = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setLinkError(
        lang === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة."
          : "Please fill in all required fields."
      )
      return
    }
    if (!isValidEmail(newUser.email)) {
      setLinkError(t(EMAIL_INVALID_MESSAGE, lang))
      return
    }
    if (newUser.password.length < 8) {
      setLinkError(
        lang === "ar"
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل."
          : "Password must be at least 8 characters."
      )
      return
    }
    setIsLinking(true)
    setLinkError(null)
    setLinkSuccess(null)
    try {
      const cleanName = newUser.name.trim()
      const cleanEmail = normalizeEmail(newUser.email)

      const record = await pb.collection("users").create({
        email: cleanEmail,
        password: newUser.password,
        passwordConfirm: newUser.password,
        name: cleanName,
        role: "individual",
        contact_number: "",
        is_active: true,
        emailVisibility: true,
      })
      await updateProfile(caseId, { user: record.id })
      try {
        await sendCredentialsEmail({
          email: cleanEmail,
          name: cleanName,
          password: newUser.password,
          caseName: profile?.name,
          caseUrl: `${window.location.origin}/dashboard/cases/${caseId}`,
        })
        setLinkSuccess(
          lang === "ar"
            ? "تم إنشاء المستخدم وربط الحالة وإرسال بيانات الدخول بالبريد."
            : "User created, case linked, and credentials emailed."
        )
      } catch (err) {
        setLinkSuccess(
          lang === "ar"
            ? "تم إنشاء المستخدم وربط الحالة، لكن تعذر إرسال البريد الإلكتروني."
            : "User created and case linked, but the credentials email could not be sent."
        )
        toast.error(getErrorMessage(err))
      }
      setNewUser({ name: "", email: "", password: "" })
    } catch (error) {
      setLinkError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل إنشاء المستخدم." : "Failed to create user.")
      )
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    setIsLinking(true)
    setLinkError(null)
    setLinkSuccess(null)
    try {
      await updateProfile(caseId, { user: "" })
      setLinkSuccess(lang === "ar" ? "تم فك ربط الحالة." : "Case unlinked.")
    } catch (error) {
      setLinkError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل فك ربط المستخدم." : "Failed to unlink user.")
      )
    } finally {
      setIsLinking(false)
    }
  }

  const handleSetAmount = async () => {
    if (amountInput === null || !amountInput.trim() || !Number.isFinite(Number(amountInput)) || Number(amountInput) <= 0) return
    setIsPaymentBusy(true)
    setPaymentError(null)
    setPaymentSuccess(null)
    try {
      if (profile?.status === "pending") await setPaymentAmount(caseId, Number(amountInput))
      else await updateProfile(caseId, { payment_amount: Number(amountInput) })
      setPaymentSuccess(
        lang === "ar"
          ? "تم حفظ رسوم الحالة."
          : "Case fee saved."
      )
      setAmountInput(null)
    } catch (error) {
      setPaymentError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل تحديد المبلغ." : "Failed to set amount.")
      )
    } finally {
      setIsPaymentBusy(false)
    }
  }

  const handleApprove = async () => {
    setIsPaymentBusy(true)
    setPaymentError(null)
    setPaymentSuccess(null)
    try {
      await approveCase(caseId)
      setPaymentSuccess(
        lang === "ar"
          ? "تم تفعيل الحالة. يمكن للمستخدم الوصول إليها الآن."
          : "Case enabled. The user can now access it."
      )
    } catch (error) {
      setPaymentError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل تفعيل الحالة." : "Failed to enable case.")
      )
    } finally {
      setIsPaymentBusy(false)
    }
  }

  const handleReject = async () => {
    setIsPaymentBusy(true)
    setPaymentError(null)
    setPaymentSuccess(null)
    try {
      await rejectPayment(caseId, rejectInput)
      setPaymentSuccess(
        lang === "ar"
          ? "تم رفض الإيصال. سيعاد طلب الدفع للمستخدم."
          : "Receipt rejected. The user will be asked to pay again."
      )
      setRejectInput("")
    } catch (error) {
      setPaymentError(
        getErrorMessage(error) ||
          (lang === "ar" ? "فشل رفض الدفع." : "Failed to reject payment.")
      )
    } finally {
      setIsPaymentBusy(false)
    }
  }

  useEffect(() => {
    fetchToolTypes()
  }, [fetchToolTypes])

  useEffect(() => {
    async function fetchAllowedToolTypes() {
      if (!caseId || !currentUser) return
      try {
        if (isExpert) {
          const caseExpert =
            await caseExpertsCollection.getByCaseAndExpert(
              caseId,
              currentUser.id
            )
          const allowed = caseExpert?.role
            ? await getAllowedToolTypesForRole(caseExpert.role)
            : []
          setAllowedToolTypeIds(allowed)
        } else {
          const allowed = await getAllowedToolTypesForCase(caseId)
          setAllowedToolTypeIds(allowed)
        }
      } catch (error) {
        console.error("Failed to fetch allowed tool types for case:", error)
        toast.error(getErrorMessage(error))
      }
    }
    fetchAllowedToolTypes()
  }, [caseId, currentUser, isExpert])

  const handleAssignTool = async () => {
    if (!selectedToolId) return
    setIsAssigning(true)
    try {
      const tool = tools.find((t) => t.id === selectedToolId)
      if (tool) {
        const toolTypeObj = toolTypes.find((tt) => tt.id === tool.type)
        await assignTool({
          case: caseId,
          type: toolTypeObj?.id || tool.type,
          name_en: tool.name.en,
          name_ar: tool.name.ar,
          is_not_template: false,
          config: tool.config as ToolConfig,
          status: "pending",
          is_visible_to_user: true,
        })
        setShowAssignModal(false)
        setSelectedToolId("")
      }
    } finally {
      setIsAssigning(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="mb-4 text-xl font-medium">
          {lang === "ar" ? "الحالة غير موجودة" : "Case not found"}
        </h2>
        <Link href="/dashboard/admin/cases">
          <Button>
            {lang === "ar" ? "العودة إلى الحالات" : "Back to Cases"}
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
          <h1 className="text-2xl font-bold text-primary">{profile.name}</h1>
          <p className="text-muted-foreground">
            {lang === "ar"
              ? `أنشئت في ${formatDate(profile.created)}`
              : `Created ${formatDate(profile.created)}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            {lang === "ar" ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="assigned">
            {lang === "ar" ? "المكلف بها" : "Assigned"}
            <Badge variant="secondary" className="ms-2">
              {caseAssignments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="case-file">
            {lang === "ar" ? "ملف الحالة" : "Case File"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isAdmin && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {lang === "ar" ? "المستخدم المرتبط" : "Linked User"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar"
                    ? "اربط هذه الحالة بمستخدم ليتمكن من الوصول إليها"
                    : "Link this case to a user so they can access it"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {linkError}
                  </div>
                )}
                {linkSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {linkSuccess}
                  </div>
                )}

                {owner ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {owner.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnlink}
                      disabled={isLinking}
                    >
                      <UserX className="me-1 h-4 w-4" />
                      {lang === "ar" ? "فك الربط" : "Unlink"}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm text-muted-foreground">
                      {lang === "ar"
                        ? "لا يوجد مستخدم مرتبط بهذه الحالة بعد."
                        : "No user linked to this case yet."}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={
                          linkMode === "existing" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setLinkMode("existing")}
                      >
                        <Link2 className="me-1 h-4 w-4" />
                        {lang === "ar" ? "مستخدم مسجل" : "Existing User"}
                      </Button>
                      <Button
                        type="button"
                        variant={linkMode === "new" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLinkMode("new")}
                      >
                        <UserPlus className="me-1 h-4 w-4" />
                        {lang === "ar" ? "مستخدم جديد" : "New User"}
                      </Button>
                    </div>

                    {linkMode === "existing" ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-2">
                          <Label>
                            {lang === "ar" ? "المستخدم" : "User"}
                          </Label>
                          <Select
                            value={linkUserId}
                            onValueChange={setLinkUserId}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  lang === "ar"
                                    ? "اختر مستخدمًا"
                                    : "Select a user"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {linkableUsers.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  {lang === "ar"
                                    ? "لا يوجد مستخدمون"
                                    : "No users available"}
                                </SelectItem>
                              ) : (
                                linkableUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleLinkExisting}
                          disabled={isLinking || !linkUserId}
                        >
                          <Link2 className="me-1 h-4 w-4" />
                          {lang === "ar" ? "ربط" : "Link"}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="link_user_name">
                            {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                          </Label>
                          <Input
                            id="link_user_name"
                            value={newUser.name}
                            onChange={(e) =>
                              setNewUser({ ...newUser, name: e.target.value })
                            }
                            placeholder={
                              lang === "ar"
                                ? "أدخل الاسم الكامل"
                                : "Enter full name"
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="link_user_email">
                            {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                          </Label>
                          <EmailInput
                            id="link_user_email"
                            value={newUser.email}
                            onChange={(value) =>
                              setNewUser({ ...newUser, email: value })
                            }
                            placeholder={
                              lang === "ar"
                                ? "أدخل عنوان البريد الإلكتروني"
                                : "Enter email address"
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="link_user_password">
                            {lang === "ar" ? "كلمة المرور" : "Password"}
                          </Label>
                          <PasswordInput
                            id="link_user_password"
                            value={newUser.password}
                            onChange={(e) =>
                              setNewUser({
                                ...newUser,
                                password: e.target.value,
                              })
                            }
                            placeholder={
                              lang === "ar"
                                ? "8 أحرف على الأقل"
                                : "Min 8 characters"
                            }
                          />
                        </div>
                        <Button
                          onClick={handleCreateAndLink}
                          disabled={isLinking}
                          className="w-full"
                        >
                          <KeyRound className="me-1 h-4 w-4" />
                          {isLinking
                            ? lang === "ar"
                              ? "جارٍ الإنشاء..."
                              : "Creating..."
                            : lang === "ar"
                              ? "إنشاء مستخدم وربط"
                              : "Create User & Link"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {lang === "ar"
                            ? "سيتم إنشاء حساب جديد وسيتم إرسال بيانات الدخول إلى بريد المستخدم."
                            : "A new account will be created and the login credentials will be emailed to the user."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {isAdmin && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {lang === "ar" ? "الدفع" : "Payment"}
                  <CaseStatusBadge status={profile.status} />
                </CardTitle>
                <CardDescription>
                  {lang === "ar"
                    ? "حدد المبلغ، راجع الإيصال، وفعّل الحالة"
                    : "Set the amount, review the receipt, and enable the case"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}
                {paymentSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {paymentSuccess}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="payment_amount">
                        {lang === "ar"
                          ? "رسوم الحالة"
                          : "Case fee"}
                      </Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-describedby="case-fee-help"
                        value={amountInput ?? String(profile.payment_amount ?? 0)}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder={
                          lang === "ar" ? "أدخل المبلغ" : "Enter amount"
                        }
                      />
                      <p id="case-fee-help" className="text-xs text-muted-foreground">
                        {lang === "ar"
                          ? `الرسوم الحالية بعملة ${bankDetails.currency}. عدّل القيمة ثم اضغط حفظ الرسوم.`
                          : `Current fee in ${bankDetails.currency}. Edit the value, then click Save fee.`}
                      </p>
                    </div>
                    <Button
                      onClick={handleSetAmount}
                      disabled={
                        isPaymentBusy || amountInput === null || !amountInput.trim() || !Number.isFinite(Number(amountInput)) || Number(amountInput) <= 0 || Number(amountInput) === Number(profile.payment_amount ?? 0)
                      }
                    >
                      {isPaymentBusy ? (
                        <Loader2 className="me-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="me-1 h-4 w-4" />
                      )}
                      {lang === "ar"
                        ? "حفظ الرسوم"
                        : "Save fee"}
                    </Button>
                  </div>
                  {profile.payment_slip && (
                    <a
                      href={pb.files.getURL(
                        { collectionId: "cases", id: caseId },
                        profile.payment_slip
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <FileText className="me-1 h-4 w-4" />
                        {lang === "ar" ? "عرض الإيصال" : "View Receipt"}
                      </Button>
                    </a>
                  )}
                </div>


                {profile.status === "awaiting_payment" && (
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar"
                      ? "بانتظار رفع إيصال التحويل من المستخدم."
                      : "Waiting for the user to upload the transfer receipt."}
                    {profile.payment_reject_reason && (
                      <span className="ms-1 text-red-600">
                        {lang === "ar" ? `الرفض: ${profile.payment_reject_reason}` : `Rejected: ${profile.payment_reject_reason}`}
                      </span>
                    )}
                  </p>
                )}

                {profile.status === "under_review" && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="reject_reason">
                        {lang === "ar"
                          ? "سبب الرفض (اختياري)"
                          : "Reject reason (optional)"}
                      </Label>
                      <Input
                        id="reject_reason"
                        value={rejectInput}
                        onChange={(e) => setRejectInput(e.target.value)}
                        placeholder={
                          lang === "ar"
                            ? "مثال: المبلغ غير مطابق"
                            : "e.g. Amount does not match"
                        }
                      />
                    </div>
                    <Button
                      onClick={handleApprove}
                      disabled={isPaymentBusy}
                    >
                      {isPaymentBusy ? (
                        <Loader2 className="me-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="me-1 h-4 w-4" />
                      )}
                      {lang === "ar" ? "تفعيل الحالة" : "Enable Case"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isPaymentBusy}
                    >
                      <XCircle className="me-1 h-4 w-4" />
                      {lang === "ar" ? "رفض" : "Reject"}
                    </Button>
                  </div>
                )}

                {profile.status === "active" && (
                  <p className="text-sm text-green-700">
                    {lang === "ar"
                      ? "الحالة مفعلة والدفع مكتمل."
                      : "Case is active and paid."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {lang === "ar" ? "معلومات الطفل" : "Child Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                  </span>
                  <span className="font-medium">
                    {profile.date_of_birth ? formatDate(profile.date_of_birth) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "الجنس" : "Gender"}
                  </span>
                  <span className="font-medium capitalize">
                    {profile.gender === "male"
                      ? lang === "ar"
                        ? "ذكر"
                        : "male"
                      : profile.gender === "female"
                        ? lang === "ar"
                          ? "أنثى"
                          : "female"
                        : profile.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "الصف الدراسي" : "Grade"}
                  </span>
                  <span className="font-medium capitalize">
                    {profile.grade}
                  </span>
                </div>
                {profile.notes && (
                  <div className="pt-2">
                    <span className="mb-2 block text-muted-foreground">
                      {lang === "ar" ? "ملاحظات" : "Notes"}
                    </span>
                    <p className="text-sm text-muted-foreground">{profile.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {profile.notes && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{lang === "ar" ? "ملاحظات" : "Notes"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{profile.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {lang === "ar" ? "المهام المكلف بها" : "Assigned Tasks"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar"
                    ? "إدارة التعيينات لهذه الحالة"
                    : "Manage assignments for this case"}
                </CardDescription>
              </div>
              <Button onClick={() => setShowAssignModal(true)}>
                <Plus className="me-2 h-4 w-4" />
                {lang === "ar" ? "تعيين أداة" : "Assign Tool"}
              </Button>
            </CardHeader>
            <CardContent>
              {caseAssignments.length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar" ? "لا توجد مهام مكلف بها" : "No tasks assigned"}
                  </h3>
                  <p className="text-muted-foreground">
                    {lang === "ar"
                      ? 'انقر على "تعيين أداة" لإضافة مهمة لهذه الحالة'
                      : 'Click "Assign Tool" to add a task for this case'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {lang === "ar" ? "التعيين" : "Assignment"}
                      </TableHead>
                      <TableHead>{lang === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead>
                        {lang === "ar" ? "مرئي للمستخدم" : "Visible to User"}
                      </TableHead>
                      <TableHead>
                        {lang === "ar" ? "تاريخ التعيين" : "Assigned Date"}
                      </TableHead>
                      <TableHead className="text-right">
                        {lang === "ar" ? "الإجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseAssignments.map((assignment) => {
                      const toolType = toolTypes.find(
                        (t) => t.id === assignment.type
                      )
                      const toolTypeName = toolType?.key || "custom"
                      const Icon =
                        getToolTypeMeta(toolTypeName)?.icon || FileText

                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.name_en ||
                              (lang === "ar" ? "تعيين بدون اسم" : "Unnamed Assignment")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {getToolTypeLabel(toolType, lang)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[assignment.status]}>
                              {statusLabels[assignment.status][lang]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.is_visible_to_user
                              ? lang === "ar"
                                ? "نعم"
                                : "Yes"
                              : lang === "ar"
                                ? "لا"
                                : "No"}
                          </TableCell>
                          <TableCell>
                            {formatDate(
                              assignment.assigned_at || assignment.created
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/dashboard/admin/assignments/${assignment.id}`}
                              >
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAssignment(assignment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="case-file">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {lang === "ar" ? "ملف الحالة" : "Case File"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "سجل جميع التفاعلات بين الحالة والخبير"
                  : "History of all interactions between the case and the expert"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caseAssignments.filter((a) => a.status === "completed")
                .length === 0 ? (
                <div className="py-8 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar" ? "لا يوجد سجل بعد" : "No history yet"}
                  </h3>
                  <p className="text-muted-foreground">
                    {lang === "ar"
                      ? "ستظهر المهام المكتملة هنا"
                      : "Completed tasks will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseAssignments
                    .filter((a) => a.status === "completed")
                    .map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {lang === "ar"
                              ? assignment.name_ar || assignment.name_en
                              : assignment.name_en}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lang === "ar" ? "أكملت في" : "Completed"}{" "}
                            {assignment.updated &&
                              formatDate(assignment.updated)}
                          </p>
                        </div>
                        <Badge variant="default">
                          {lang === "ar" ? "مكتمل" : "Completed"}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <CaseFeedback caseId={profile.id} ownerId={profile.user} />

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{lang === "ar" ? "تعيين أداة" : "Assign Tool"}</CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "اختر أداة أو أنشئ أداة جديدة لهذه الحالة"
                  : "Choose a tool or create a new tool for this case"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {/* Case-specific tools - direct create */}
                {toolTypeOrder
                  .filter((key) =>
                    ["plan", "report", "attachment_request"].includes(key)
                  )
                  .filter((key) => {
                    const toolType = toolTypes.find((item) => item.key === key)
                    if (!toolType) return false
                    if (isExpert) return allowedToolTypeIds.includes(toolType.id)
                    return (
                      allowedToolTypeIds.length === 0 ||
                      allowedToolTypeIds.includes(toolType.id)
                    )
                  })
                  .map((key) => {
                    const toolType = toolTypes.find((item) => item.key === key)
                    const meta = getToolTypeMeta(key)
                    if (!toolType || !meta) return null

                    return (
                      <div
                        key={toolType.id}
                        className="flex flex-col items-center gap-3 rounded-lg border p-4"
                      >
                        <meta.icon className="h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">
                          {getToolTypeLabel(toolType, lang)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            router.push(
                              `/dashboard/admin/tools/${meta.route}/new?caseId=${caseId}`
                            )
                            setShowAssignModal(false)
                          }}
                        >
                          {lang === "ar" ? "إنشاء" : "Create"}
                        </Button>
                      </div>
                    )
                  })}

                {/* Template-based tools - show template list or create new */}
                {toolTypeOrder
                  .filter((key) =>
                    ["survey", "multiple_answer"].includes(
                      key
                    )
                  )
                  .filter((key) => {
                    const toolType = toolTypes.find((item) => item.key === key)
                    if (!toolType) return false
                    if (isExpert) return allowedToolTypeIds.includes(toolType.id)
                    return (
                      allowedToolTypeIds.length === 0 ||
                      allowedToolTypeIds.includes(toolType.id)
                    )
                  })
                  .map((key) => {
                    const toolType = toolTypes.find((item) => item.key === key)
                    const meta = getToolTypeMeta(key)
                    if (!toolType || !meta) return null

                    const typeTools = tools.filter((t) => {
                      const toolTypeObj = toolTypes.find(
                        (tt) => tt.id === t.type
                      )
                      return toolTypeObj?.key === key
                    })

                    return (
                      <div
                        key={toolType.id}
                        className="flex flex-col items-center gap-3 rounded-lg border p-4"
                      >
                        <meta.icon className="h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">
                          {getToolTypeLabel(toolType, lang)}
                        </span>
                        <div className="flex gap-2">
                          {typeTools.length > 0 && (
                            <Select
                              onValueChange={(toolId) => {
                                setSelectedToolId(toolId)
                                setConfirmToolType(key)
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue
                                  placeholder={
                                    lang === "ar" ? "قوالب" : "Templates"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {typeTools.map((tool) => (
                                  <SelectItem key={tool.id} value={tool.id}>
                                    {tool.name.en}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              router.push(
                                `/dashboard/admin/tools/${meta.route}/new?caseId=${caseId}`
                              )
                              setShowAssignModal(false)
                            }}
                          >
                            {lang === "ar" ? "جديد" : "New"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}</div>

              {allowedToolTypeIds.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {lang === "ar"
                    ? "يتم عرض أنواع الأدوات بناءً على أدوار الخبراء المخصصين لهذه القضية."
                    : "Tool types shown are based on the assigned experts' roles for this case."}
                </p>
              )}
            </CardContent>
            <CardContent className="flex justify-end pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedToolId("")
                }}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {confirmToolType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-sm">
            <CardHeader>
              <CardTitle>{lang === "ar" ? "تأكيد" : "Confirm"}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedToolId ? (
                <p>
                  {lang === "ar"
                    ? `هل تريد تعيين هذا القالب لهذه الحالة؟`
                    : `Assign this template to this case?`}
                </p>
              ) : (
                <p>
                  {lang === "ar"
                    ? `إنشاء ${getToolTypeLabel(
                        toolTypes.find((item) => item.key === confirmToolType),
                        lang
                      )} جديد لهذه الحالة؟`
                    : `Create new ${getToolTypeLabel(
                        toolTypes.find((item) => item.key === confirmToolType),
                        lang
                      )} for this case?`}
                </p>
              )}
            </CardContent>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmToolType(null)
                  setSelectedToolId("")
                }}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              {selectedToolId ? (
                <Button onClick={handleAssignTool} disabled={isAssigning}>
                  {isAssigning
                    ? lang === "ar"
                      ? "جاري التعيين..."
                      : "Assigning..."
                    : lang === "ar"
                      ? "تعيين"
                      : "Assign"}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const route =
                      getToolTypeMeta(confirmToolType)?.route || confirmToolType
                    router.push(
                      `/dashboard/admin/tools/${route}/new?caseId=${caseId}`
                    )
                    setShowAssignModal(false)
                    setConfirmToolType(null)
                    setSelectedToolId("")
                  }}
                >
                  {lang === "ar" ? "إنشاء" : "Create"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
