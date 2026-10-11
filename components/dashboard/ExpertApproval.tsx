"use client"

import { useState, useEffect } from "react"
import { useUsers } from "@/hooks/useUsers"
import pb, { getErrorMessage } from "@/lib/pb"
import type { RecordModel } from "pocketbase"
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonTable } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  UserCheck,
  Mail,
  Phone,
  CalendarClock,
  CheckCircle2,
  Paperclip,
  MessageSquareText,
  Eye,
  User as UserIcon,
  MapPin,
  Globe,
  GraduationCap,
  Briefcase,
  Languages,
  Wallet,
  Clock,
  BookOpen,
  Image as ImageIcon,
} from "lucide-react"
import type { User } from "@/types/user"
import { formatDateTime } from "@/lib/format-date"
import { LANGUAGES } from "@/lib/language-list"
import { useLang } from "@/lib/lang-context"
import { t } from "@/lib/i18n"
import { ExpertBankDetails } from "./ExpertBankDetails"

function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is string => typeof v === "string" && v.length > 0
    )
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

function toFileList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is string => typeof v === "string" && v.length > 0
    )
  }
  if (typeof value === "string" && value.trim()) {
    return [value]
  }
  return []
}

function toText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function languageLabel(value: string): string {
  const found = LANGUAGES.find((l) => l.value === value)
  return found ? found.label.en : humanize(value)
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <div className="font-medium break-words">{value || "—"}</div>
      </div>
    </div>
  )
}

function TagList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="font-medium">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="font-normal">
          {humanize(value)}
        </Badge>
      ))}
    </div>
  )
}

export function ExpertApprovalPage() {
  const { users, isLoading, updateUser, refresh } = useUsers()
  const { lang } = useLang()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [fileToken, setFileToken] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<RecordModel | null>(
    null
  )
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    pb.files
      .getToken()
      .then((token) => {
        if (!cancelled) setFileToken(token)
      })
      .catch(() => {
        if (!cancelled) setFileToken("")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedUser) {
      return
    }
    let cancelled = false
    // Loading flags are intentionally reset when selecting a new application.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileLoading(true)
    pb.collection("expert_profiles")
      .getFirstListItem(pb.filter("user = {:value0}", { value0: selectedUser.id }))
      .then((record) => {
        if (!cancelled) setSelectedProfile(record)
      })
      .catch(() => {
        if (!cancelled) setSelectedProfile(null)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedUser])

  const pendingExperts = users.filter(
    (u) => u.role === "expert" && !u.is_active
  )

  const getFileUrl = (record: RecordModel, filename: string) => {
    return pb.files.getURL(
      record,
      filename,
      fileToken ? { token: fileToken } : {}
    )
  }

  const handleApprove = async (user: (typeof users)[number]) => {
    setApprovingId(user.id)
    setActionError("")
    try {
      await updateUser(user.id, { is_active: true })

      const loginUrl = `${window.location.origin}/login`
      const approvalEmailTitle =
        lang === "ar"
          ? "تم اعتماد حسابك كخبير"
          : "Your Expert Account Has Been Approved"
      const html = [
        `<h2>${approvalEmailTitle}</h2>`,
        `<p>${
          lang === "ar" ? `مرحباً ${user.name}،` : `Dear ${user.name},`
        }</p>`,
        `<p>${
          lang === "ar"
            ? "تهانينا! تم اعتماد حسابك كخبير لدى <strong>DSC</strong>."
            : "Congratulations! Your expert account at <strong>DSC</strong> has been approved."
        }</p>`,
        `<p>${
          lang === "ar"
            ? "يمكنك الآن تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور اللذين أدخلتهما عند التسجيل:"
            : "You can now log in using the email and password you provided at registration:"
        }</p>`,
        `<p><a href="${loginUrl}">${loginUrl}</a></p>`,
      ].join("\n")

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pb.authStore.token}` },
        body: JSON.stringify({
          from: "admin@dsc.ac",
          to: user.email,
          subject: approvalEmailTitle,
          html,
        }),
      })

      if (!response.ok) {
        const { error: errMsg } = await response.json()
        throw new Error(
          errMsg ||
            t(
              {
                en: "Failed to send approval email",
                ar: "تعذّر إرسال بريد الاعتماد",
              },
              lang
            )
        )
      }

      await refresh()
      setSelectedUser(null)
    } catch (err) {
      setActionError(
        getErrorMessage(err, lang) ||
          t(
            {
              en: "Failed to approve. Please try again.",
              ar: "تعذّر الاعتماد. يرجى المحاولة مرة أخرى.",
            },
            lang
          )
      )
      await refresh()
    } finally {
      setApprovingId(null)
    }
  }

  const profilePhotoUrl =
    selectedProfile && toText(selectedProfile.profile_photo)
      ? getFileUrl(selectedProfile, toText(selectedProfile.profile_photo))
      : ""

  const cvFiles = selectedProfile ? toFileList(selectedProfile.cv) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {lang === "ar" ? "اعتماد الخبراء" : "Expert Approval"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "مراجعة واعتماد طلبات الخبراء"
            : "Review and approve expert applications"}
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : pendingExperts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              No pending applications
            </h3>
            <p className="text-center text-muted-foreground">
              There are no expert applications waiting for approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Expert Applications</CardTitle>
            <CardDescription>
              {pendingExperts.length} application(s) awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExperts.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {user.contact_number || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDateTime(user.created)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700"
                      >
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="me-1 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(user)}
                          disabled={approvingId === user.id}
                        >
                          {approvingId === user.id
                            ? "Approving..."
                            : "Approve & Notify"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {selectedUser && (
            <>
              <ExpertBankDetails
                key={selectedUser.id}
                userId={selectedUser.id}
              />
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {profilePhotoUrl ? (
                    <a
                      href={profilePhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profilePhotoUrl}
                        alt={selectedUser.name}
                        className="h-14 w-14 rounded-full border object-cover"
                      />
                    </a>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted">
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex items-center gap-2">
                    {selectedUser.name}
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700"
                    >
                      Pending
                    </Badge>
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Expert application submitted on{" "}
                  {formatDateTime(selectedUser.created)}
                </DialogDescription>
              </DialogHeader>

              {profileLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading profile details...
                </p>
              ) : !selectedProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem
                      icon={Mail}
                      label="Email"
                      value={selectedUser.email}
                    />
                    <DetailItem
                      icon={Phone}
                      label="Contact"
                      value={selectedUser.contact_number}
                    />
                  </div>
                  <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    No profile details were found for this application.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailItem
                        icon={UserIcon}
                        label="Full Legal Name"
                        value={toText(selectedProfile.full_legal_name)}
                      />
                      <DetailItem
                        icon={Mail}
                        label="Email"
                        value={selectedUser.email}
                      />
                      <DetailItem
                        icon={Phone}
                        label="Contact Number"
                        value={selectedUser.contact_number}
                      />
                      <DetailItem
                        icon={Phone}
                        label="WhatsApp"
                        value={
                          toText(selectedProfile.whatsapp_number)
                            ? `${toText(
                                selectedProfile.whatsapp_country_code
                              )} ${toText(selectedProfile.whatsapp_number)}`
                            : ""
                        }
                      />
                      <DetailItem
                        icon={Globe}
                        label="Nationality"
                        value={toText(selectedProfile.nationality)}
                      />
                      <DetailItem
                        icon={MapPin}
                        label="Country of Residence"
                        value={toText(selectedProfile.country_of_residence)}
                      />
                      <DetailItem
                        icon={MapPin}
                        label="City"
                        value={toText(selectedProfile.city)}
                      />
                      <DetailItem
                        icon={Languages}
                        label="Preferred Languages"
                        value={
                          toList(selectedProfile.preferred_languages)
                            .map(languageLabel)
                            .join(", ") || "—"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      Academic Background
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailItem
                        icon={GraduationCap}
                        label="Highest Academic Degree"
                        value={
                          toText(selectedProfile.highest_academic_degree)
                            ? humanize(
                                toText(selectedProfile.highest_academic_degree)
                              )
                            : ""
                        }
                      />
                      <DetailItem
                        icon={BookOpen}
                        label="Degree Title"
                        value={toText(selectedProfile.degree_title)}
                      />
                      <DetailItem
                        icon={BookOpen}
                        label="Field of Study"
                        value={toText(selectedProfile.field_of_study)}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      Professional Details
                    </h3>
                    <div className="space-y-3">
                      <DetailItem
                        icon={UserCheck}
                        label="Age Group"
                        value={
                          <TagList values={toList(selectedProfile.age_group)} />
                        }
                      />
                      <DetailItem
                        icon={Briefcase}
                        label="Specialization"
                        value={
                          <TagList
                            values={toList(selectedProfile.specialization_type)}
                          />
                        }
                      />
                      <DetailItem
                        icon={UserCheck}
                        label="Client Type"
                        value={
                          <TagList
                            values={toList(selectedProfile.client_type)}
                          />
                        }
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailItem
                          icon={Globe}
                          label="Consultation Mode"
                          value={
                            toText(selectedProfile.consultation_mode)
                              ? humanize(
                                  toText(selectedProfile.consultation_mode)
                                )
                              : ""
                          }
                        />
                        <DetailItem
                          icon={Wallet}
                          label="Fee"
                          value={toText(selectedProfile.fee)}
                        />
                        <DetailItem
                          icon={Clock}
                          label="Availability"
                          value={toText(selectedProfile.availability)}
                        />
                      </div>
                    </div>
                  </div>

                  {toText(selectedProfile.bio) && (
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                        Message
                      </div>
                      <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                        {toText(selectedProfile.bio)}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      Attachments
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {profilePhotoUrl && (
                        <a
                          href={profilePhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border p-2 text-sm text-primary hover:bg-muted/50 hover:underline"
                        >
                          <ImageIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">Profile Photo</span>
                        </a>
                      )}
                      {cvFiles.map((filename) => (
                        <a
                          key={filename}
                          href={getFileUrl(selectedProfile, filename)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border p-2 text-sm text-primary hover:bg-muted/50 hover:underline"
                        >
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <span className="truncate">{filename}</span>
                        </a>
                      ))}
                      {!profilePhotoUrl && cvFiles.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No attachments were uploaded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => handleApprove(selectedUser)}
                  disabled={approvingId === selectedUser.id}
                >
                  {approvingId === selectedUser.id
                    ? "Approving..."
                    : "Approve & Notify"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
