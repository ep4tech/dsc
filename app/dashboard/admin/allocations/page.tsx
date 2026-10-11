"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useState, useEffect, useMemo, useCallback } from "react"
import { DataError } from "@/components/ui/data-error"
import { useAllocations } from "@/hooks/useAllocations"
import { useUsers } from "@/hooks/useUsers"
import { CaseSearchCombobox } from "@/components/case-search-combobox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Save,
  UserCheck,
  Users,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLang } from "@/lib/lang-context"
import { toast } from "sonner"
import pb, { getErrorMessage } from "@/lib/pb"
import { specializationLabel } from "@/components/team/team-labels"
import { countryLabel } from "@/lib/expert-options"
import { toStringList } from "@/hooks/useExpertProfile"
import type { ExpertProfile } from "@/types/expert"
import type { RolesManagement } from "@/types/expert-role"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRolesManagement } from "@/hooks/useRolesManagement"
import { useToolTypes } from "@/hooks/useToolTypes"
import { ToolTypeMultiSelect } from "@/components/admin/tool-type-multi-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AllocationRow {
  id?: string
  expert_id: string
  /** Matches `role_name_en` of a roles_management record */
  role: string
}

function ExpertCombobox({
  value,
  onChange,
  experts,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  experts: Array<{ id: string; name: string; email: string }>
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const { lang } = useLang()
  const selectedExpert = experts.find((e) => e.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedExpert
            ? selectedExpert.name
            : placeholder ||
              (lang === "ar" ? "اختر خبير..." : "Select expert...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder={
              lang === "ar" ? "البحث عن الخبراء..." : "Search experts..."
            }
          />
          <CommandList>
            <CommandEmpty>
              {lang === "ar" ? "لم يتم العثور على خبراء." : "No experts found."}
            </CommandEmpty>
            <CommandGroup>
              {experts.map((expert) => (
                <CommandItem
                  key={expert.id}
                  value={expert.id + " " + expert.name + " " + expert.email}
                  onSelect={() => {
                    onChange(expert.id === value ? "" : expert.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === expert.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{expert.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {expert.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function AllocationsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const { users, isLoading: isUsersLoading } = useUsers()
  const {
    allocations,
    loadError: allocationsError,
    isLoading: isAllocationsLoading,
    refresh: refreshAllocations,
  } = useAllocations()

  const [expertProfiles, setExpertProfiles] = useState<ExpertProfile[]>([])
  const [countryFilter, setCountryFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("")
  useEffect(() => {
    boundedFullList(pb.collection("expert_profiles"))
      .then((data) => setExpertProfiles(data as unknown as ExpertProfile[]))
      .catch((error) => toast.error(getErrorMessage(error)))
  }, [])
  const [selectedCase, setSelectedCase] = useState<string>("")
  const [rows, setRows] = useState<AllocationRow[]>([])
  const [originalRows, setOriginalRows] = useState<AllocationRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const {
    roles: roleMgmtRoles,
    isLoading: isRolesLoading,
    updateRoleToolTypes,
    updateRole,
    addRole,
    removeRole,
  } = useRolesManagement()
  const {
    toolTypes: allToolTypes,
    isLoading: isToolTypesLoading,
    fetchToolTypes,
  } = useToolTypes()

  const [roleToolTypesMap, setRoleToolTypesMap] = useState<
    Record<string, string[]>
  >({})
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRoleNameEn, setNewRoleNameEn] = useState("")
  const [newRoleNameAr, setNewRoleNameAr] = useState("")
  const [isAddingRole, setIsAddingRole] = useState(false)

  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolesManagement | null>(null)
  const [editRoleNameEn, setEditRoleNameEn] = useState("")
  const [editRoleNameAr, setEditRoleNameAr] = useState("")
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  useEffect(() => {
    fetchToolTypes()
  }, [fetchToolTypes])

  useEffect(() => {
    if (
      roleMgmtRoles.length > 0 &&
      Object.keys(roleToolTypesMap).length === 0
    ) {
      const map: Record<string, string[]> = {}
      roleMgmtRoles.forEach((r) => {
        map[r.id] = [...(r.tool_types || [])]
      })
      // Synchronize the editable permission map after roles load from the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleToolTypesMap(map)
    }
  }, [roleMgmtRoles, roleToolTypesMap])

  const handleRoleToolTypesChange = (roleId: string, toolTypeIds: string[]) => {
    setRoleToolTypesMap((prev) => ({ ...prev, [roleId]: toolTypeIds }))
  }

  /** Localized role label, falling back to the other language when empty. */
  const getRoleLabel = (role: RolesManagement) =>
    (lang === "ar" ? role.role_name_ar : role.role_name_en) ||
    (lang === "ar" ? role.role_name_en : role.role_name_ar) ||
    ""

  const handleSaveAllRoles = async () => {
    const changed = roleMgmtRoles.filter(
      (role) =>
        JSON.stringify(roleToolTypesMap[role.id]?.sort()) !==
        JSON.stringify([...(role.tool_types || [])].sort())
    )
    if (changed.length === 0) return

    setIsSavingAll(true)
    try {
      await Promise.all(
        changed.map((role) =>
          updateRoleToolTypes(role.id, roleToolTypesMap[role.id])
        )
      )
    } catch (error) {
      console.error("Failed to save role tool types:", error)
      toast.error(
        lang === "ar"
          ? "فشل الحفظ. يرجى المحاولة مرة أخرى."
          : "Failed to save. Please try again.",
        { description: getErrorMessage(error) }
      )
    } finally {
      setIsSavingAll(false)
    }
  }

  const handleAddRole = async () => {
    const roleNameEn = newRoleNameEn.trim()
    const roleNameAr = newRoleNameAr.trim()
    if (!roleNameEn || !roleNameAr) return

    setIsAddingRole(true)
    try {
      const created = await addRole(roleNameEn, roleNameAr)
      setRoleToolTypesMap((prev) => ({
        ...prev,
        [created.id]: created.tool_types || [],
      }))
      setRoleDialogOpen(false)
      setNewRoleNameEn("")
      setNewRoleNameAr("")
    } catch (error) {
      console.error("Failed to add role:", error)
      toast.error(
        lang === "ar"
          ? "فشل إضافة الدور. يرجى المحاولة مرة أخرى."
          : "Failed to add role. Please try again.",
        { description: getErrorMessage(error) }
      )
    } finally {
      setIsAddingRole(false)
    }
  }

  const openEditRole = (role: RolesManagement) => {
    setEditingRole(role)
    setEditRoleNameEn(role.role_name_en)
    setEditRoleNameAr(role.role_name_ar)
    setEditRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return
    const roleNameEn = editRoleNameEn.trim()
    const roleNameAr = editRoleNameAr.trim()
    if (!roleNameEn || !roleNameAr) return

    setIsUpdatingRole(true)
    try {
      await updateRole(
        editingRole.id,
        roleNameEn,
        roleNameAr,
        editingRole.role_name_en
      )
      await refreshAllocations()
      toast.success(
        lang === "ar" ? "تم حفظ الإسنادات" : "Case allocations saved"
      )
      setEditRoleDialogOpen(false)
      setEditingRole(null)
    } catch (error) {
      console.error("Failed to update role:", error)
      toast.error(
        lang === "ar"
          ? "فشل تحديث الدور. يرجى المحاولة مرة أخرى."
          : "Failed to update role. Please try again.",
        { description: getErrorMessage(error) }
      )
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (
      !window.confirm(
        lang === "ar"
          ? `هل تريد حذف الدور "${roleName}"؟`
          : `Delete role "${roleName}"?`
      )
    ) {
      return
    }

    try {
      await removeRole(roleId)
      setRoleToolTypesMap((prev) => {
        const next = { ...prev }
        delete next[roleId]
        return next
      })
    } catch (error) {
      console.error("Failed to delete role:", error)
      toast.error(
        lang === "ar"
          ? "فشل حذف الدور. يرجى المحاولة مرة أخرى."
          : "Failed to delete role. Please try again.",
        { description: getErrorMessage(error) }
      )
    }
  }

  // Filter only expert users
  const experts = useMemo(
    () =>
      users
        .filter((u) => u.role === "expert" && u.is_active)
        .filter((u) => {
          const profile = expertProfiles.find((p) => p.user === u.id)
          return (
            (!countryFilter ||
              ((profile?.country_of_residence || "") + " " + countryLabel(profile?.country_of_residence || "", lang))
                .toLowerCase()
                .includes(countryFilter.toLowerCase())) &&
            (!cityFilter ||
              (profile?.city || "")
                .toLowerCase()
                .includes(cityFilter.toLowerCase())) &&
            (!specialtyFilter ||
              toStringList(profile?.specialization_type).some((v) =>
                (v + " " + specializationLabel(v, lang))
                  .toLowerCase()
                  .includes(specialtyFilter.toLowerCase())
              ))
          )
        })
        .map((u) => ({ id: u.id, name: u.name, email: u.email })),
    [users, expertProfiles, countryFilter, cityFilter, specialtyFilter, lang]
  )

  // Load existing allocations when case is selected
  const loadAllocationsForCase = useCallback(
    (caseId: string) => {
      const caseAllocations = allocations.filter((a) => a.case_id === caseId)
      const loadedRows: AllocationRow[] = caseAllocations.map((a) => ({
        id: a.id,
        expert_id: a.expert_id,
        role: a.role,
      }))
      setRows(loadedRows)
      setOriginalRows(loadedRows)
    },
    [allocations]
  )

  useEffect(() => {
    if (isSaving) return
    if (selectedCase) {
      // Synchronize rows when the selected case or its saved allocations change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAllocationsForCase(selectedCase)
    } else {
      setRows([])
      setOriginalRows([])
    }
  }, [selectedCase, loadAllocationsForCase, isSaving])

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { expert_id: "", role: roleMgmtRoles[0]?.role_name_en ?? "" },
    ])
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, updates: Partial<AllocationRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    )
  }

  const handleSave = async () => {
    if (!selectedCase) return

    // Validate rows
    const invalidRows = rows.filter((r) => !r.expert_id || !r.role)
    if (invalidRows.length > 0) {
      toast.error(
        lang === "ar"
          ? "يرجى اختيار خبير ودور لكل صف."
          : "Please select an expert and role for each row."
      )
      return
    }

    setIsSaving(true)
    try {
      await pb.send(`/api/dsc/cases/${selectedCase}/allocations`, {
        method: "POST",
        body: { rows },
      })
      await refreshAllocations()
    } catch (error) {
      console.error("Failed to save allocations:", error)
      toast.error(
        lang === "ar"
          ? "فشل حفظ التخصيصات. يرجى المحاولة مرة أخرى."
          : "Failed to save allocations. Please try again.",
        { description: getErrorMessage(error) }
      )
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading =
    isUsersLoading ||
    isAllocationsLoading ||
    isRolesLoading ||
    isToolTypesLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {lang === "ar" ? "نموذج التخصيص" : "Allocation Form"}
              </h1>
              <p className="text-muted-foreground">
                {lang === "ar"
                  ? "تخصيص القضايا للخبراء"
                  : "Allocate cases to experts"}
              </p>
            </div>
          </div>
        </div>
        <SkeletonTable rows={4} />
      </div>
    )
  }

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(originalRows)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {lang === "ar" ? "نموذج التخصيص" : "Allocation Form"}
            </h1>
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "تخصيص القضايا للخبراء"
                : "Allocate cases to experts"}
            </p>
          </div>
        </div>
      </div>

      {allocationsError && (
        <DataError message={allocationsError} onRetry={refreshAllocations} />
      )}
      <Tabs defaultValue="allocations">
        <TabsList>
          <TabsTrigger value="allocations">
            {lang === "ar" ? "التخصيصات" : "Allocations"}
          </TabsTrigger>
          <TabsTrigger value="roles">
            {lang === "ar" ? "الأدوار" : "Roles"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              aria-label={
                lang === "ar" ? "بلد الإقامة" : "Country of Residence"
              }
              placeholder={
                lang === "ar"
                  ? "البحث حسب بلد الإقامة"
                  : "Filter by country of residence"
              }
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            />
            <Input
              aria-label={lang === "ar" ? "مدينة الإقامة" : "City of Residence"}
              placeholder={
                lang === "ar"
                  ? "البحث حسب مدينة الإقامة"
                  : "Filter by city of residence"
              }
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
            <Input
              aria-label={lang === "ar" ? "التخصص" : "Specialization"}
              placeholder={
                lang === "ar" ? "البحث حسب التخصص" : "Filter by specialization"
              }
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!selectedCase || isSaving || !hasChanges}
            >
              <Save className="me-2 h-4 w-4" />
              {isSaving
                ? lang === "ar"
                  ? "جاري الحفظ..."
                  : "Saving..."
                : lang === "ar"
                  ? "حفظ التخصيصات"
                  : "Save Allocations"}
            </Button>
          </div>

          {/* Case Selector */}
          <Card>
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "اختيار القضية" : "Select Case"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "اختر القضية التي تريد تخصيص الخبراء لها"
                  : "Choose the case you want to allocate experts to"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <CaseSearchCombobox
                  value={selectedCase}
                  onChange={setSelectedCase}
                  placeholder={
                    lang === "ar" ? "اختر قضية..." : "Select a case..."
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Allocations Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {lang === "ar" ? "الخبراء المخصصون" : "Assigned Experts"}
                  </CardTitle>
                  <CardDescription>
                    {rows.length}{" "}
                    {lang === "ar" ? "خبير(ين) مخصص" : "expert(s) assigned"}
                  </CardDescription>
                </div>
                {selectedCase && (
                  <Button
                    variant="outline"
                    onClick={addRow}
                    disabled={isSaving}
                  >
                    <Plus className="me-2 h-4 w-4" />
                    {lang === "ar" ? "إضافة خبير" : "Add Expert"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCase ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar" ? "لم يتم اختيار قضية" : "No case selected"}
                  </h3>
                  <p className="text-muted-foreground">
                    {lang === "ar"
                      ? "يرجى اختيار قضية أولاً لعرض الخبراء المخصصين"
                      : "Please select a case first to view assigned experts"}
                  </p>
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center">
                  <UserCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {lang === "ar"
                      ? "لم يتم تخصيص خبراء"
                      : "No experts assigned"}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {lang === "ar"
                      ? "لم يتم تخصيص خبراء لهذه القضية بعد"
                      : "No experts have been assigned to this case yet"}
                  </p>
                  <Button onClick={addRow}>
                    <Plus className="me-2 h-4 w-4" />
                    {lang === "ar" ? "إضافة خبير" : "Add Expert"}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        {lang === "ar" ? "الخبير" : "Expert"}
                      </TableHead>
                      <TableHead className="w-[250px]">
                        {lang === "ar" ? "الدور" : "Role"}
                      </TableHead>
                      <TableHead className="text-right">
                        {lang === "ar" ? "إجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.id || "new"}-${index}`}>
                        <TableCell>
                          <ExpertCombobox
                            value={row.expert_id}
                            onChange={(value) =>
                              updateRow(index, { expert_id: value })
                            }
                            experts={experts}
                            placeholder={
                              lang === "ar"
                                ? "اختر خبير..."
                                : "Select expert..."
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.role}
                            onValueChange={(value) =>
                              updateRow(index, { role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  lang === "ar"
                                    ? "اختر دوراً..."
                                    : "Select role..."
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {roleMgmtRoles.map((role) => (
                                <SelectItem
                                  key={role.id}
                                  value={role.role_name_en}
                                >
                                  {getRoleLabel(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(index)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {lang === "ar"
                      ? "إدارة أدوار الخبراء"
                      : "Expert Role Management"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "ar"
                      ? "تحديد أنواع الأدوات المتاحة لكل دور"
                      : "Assign which tool types each role can access"}
                  </CardDescription>
                </div>
                <Button onClick={() => setRoleDialogOpen(true)}>
                  <Plus className="me-2 h-4 w-4" />
                  {lang === "ar" ? "إضافة دور" : "Add Role"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isRolesLoading || isToolTypesLoading ? (
                <SkeletonTable rows={4} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang === "ar" ? "الدور" : "Role"}</TableHead>
                      <TableHead>
                        {lang === "ar"
                          ? "أنواع الأدوات المخصصة"
                          : "Assigned Tool Types"}
                      </TableHead>
                      <TableHead className="text-right">
                        {lang === "ar" ? "إجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleMgmtRoles.map((role) => {
                      const hasAssignments = allocations.some(
                        (a) => a.role === role.role_name_en
                      )
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            {getRoleLabel(role)}
                          </TableCell>
                          <TableCell>
                            <ToolTypeMultiSelect
                              value={
                                roleToolTypesMap[role.id] ||
                                role.tool_types ||
                                []
                              }
                              onChange={(toolTypeIds) =>
                                handleRoleToolTypesChange(role.id, toolTypeIds)
                              }
                              toolTypes={allToolTypes}
                              lang={lang}
                              placeholder={
                                lang === "ar"
                                  ? "اختر أنواع الأدوات..."
                                  : "Select tool types..."
                              }
                              emptyMessage={
                                lang === "ar"
                                  ? "لا توجد أنواع أدوات"
                                  : "No tool types found"
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditRole(role)}
                                title={
                                  lang === "ar"
                                    ? "تعديل اسم الدور"
                                    : "Edit role name"
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={hasAssignments || isSavingAll}
                                onClick={() =>
                                  handleDeleteRole(role.id, getRoleLabel(role))
                                }
                                title={
                                  hasAssignments
                                    ? lang === "ar"
                                      ? "لا يمكن حذف دور معين لخبراء"
                                      : "Cannot delete a role assigned to experts"
                                    : undefined
                                }
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
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveAllRoles} disabled={isSavingAll}>
                  {isSavingAll
                    ? lang === "ar"
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : lang === "ar"
                      ? "حفظ الكل"
                      : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "إضافة دور جديد" : "Add New Role"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "أدخل اسمي الدور الجديد (بالإنجليزية والعربية) ثم قم بتحديد أنواع الأدوات المتاحة له"
                : "Enter the new role name in English and Arabic, then assign the tool types it can access"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {lang === "ar" ? "اسم الدور (إنجليزي)" : "Role Name (EN)"}
                </label>
                <Input
                  value={newRoleNameEn}
                  onChange={(e) => setNewRoleNameEn(e.target.value)}
                  placeholder="e.g., Lawyer"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {lang === "ar" ? "اسم الدور (عربي)" : "Role Name (AR)"}
                </label>
                <Input
                  dir="rtl"
                  value={newRoleNameAr}
                  onChange={(e) => setNewRoleNameAr(e.target.value)}
                  placeholder="مثال: محامٍ"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRoleDialogOpen(false)
                setNewRoleNameEn("")
                setNewRoleNameAr("")
              }}
              disabled={isAddingRole}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={
                isAddingRole || !newRoleNameEn.trim() || !newRoleNameAr.trim()
              }
            >
              {isAddingRole
                ? lang === "ar"
                  ? "جارٍ الإضافة..."
                  : "Adding..."
                : lang === "ar"
                  ? "إضافة"
                  : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editRoleDialogOpen}
        onOpenChange={(open) => {
          setEditRoleDialogOpen(open)
          if (!open) setEditingRole(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "تعديل الدور" : "Edit Role"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "تعديل اسم الدور (بالإنجليزية والعربية). تحديث الاسم الإنجليزي سيحدّثه أيضاً في توزيعات الخبراء."
                : "Edit the role name in English and Arabic. Changing the English name also updates it in existing expert allocations."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {lang === "ar" ? "اسم الدور (إنجليزي)" : "Role Name (EN)"}
                </label>
                <Input
                  value={editRoleNameEn}
                  onChange={(e) => setEditRoleNameEn(e.target.value)}
                  placeholder="e.g., Lawyer"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {lang === "ar" ? "اسم الدور (عربي)" : "Role Name (AR)"}
                </label>
                <Input
                  dir="rtl"
                  value={editRoleNameAr}
                  onChange={(e) => setEditRoleNameAr(e.target.value)}
                  placeholder="مثال: محامٍ"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditRoleDialogOpen(false)
                setEditingRole(null)
              }}
              disabled={isUpdatingRole}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={
                isUpdatingRole ||
                !editRoleNameEn.trim() ||
                !editRoleNameAr.trim()
              }
            >
              {isUpdatingRole
                ? lang === "ar"
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : lang === "ar"
                  ? "حفظ"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
