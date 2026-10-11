"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTools } from "@/hooks/useTools"
import { useAssignments } from "@/hooks/useAssignments"
import { useProfiles } from "@/hooks/useProfiles"
import { useLang } from "@/lib/lang-context"
import { caseToolsCollection } from "@/lib/pb-collections"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DragList } from "@/components/ui/drag-list"
import { MultipleChoicePreview } from "@/components/tool-renderers/MultipleChoicePreview"
import { MediaUpload } from "@/components/ui/media-upload"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Image,
  Video,
  Music,
  X,
} from "lucide-react"
import type {
  MultipleChoiceConfig,
  MCQuestion,
  MCAnswerType,
  MediaType,
  ResponseType,
} from "@/types/tool"
import { useToolTypes } from "@/hooks/useToolTypes"
import pb from "@/lib/pb"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const ANSWER_TYPES: {
  value: MCAnswerType
  label: { en: string; ar: string }
}[] = [
  { value: "text", label: { en: "Text", ar: "نص" } },
  { value: "number", label: { en: "Number", ar: "رقم" } },
  {
    value: "single_choice",
    label: {
      en: "Single Choice (mark correct)",
      ar: "اختيار واحد (حدد الصحيح)",
    },
  },
  {
    value: "multiple_choice",
    label: {
      en: "Multiple Choice (mark correct)",
      ar: "اختيار من متعدد (حدد الصحيح)",
    },
  },
  {
    value: "media",
    label: { en: "Media (image/video/audio)", ar: "وسائط (صورة/فيديو/صوت)" },
  },
]

const DEFAULT_OPTIONS = [
  { value: "opt1", label: "Option 1", isCorrect: false },
  { value: "opt2", label: "Option 2", isCorrect: false },
  { value: "opt3", label: "Option 3", isCorrect: false },
  { value: "opt4", label: "Option 4", isCorrect: false },
  { value: "opt5", label: "Option 5", isCorrect: false },
]

interface MultipleChoiceBuilderPageProps {
  params?: Promise<{ id?: string }>
  searchParams?: Promise<{ caseId?: string }>
}

export default function MultipleChoiceBuilderPage({
  params,
  searchParams,
}: MultipleChoiceBuilderPageProps = {}) {
  const router = useRouter()
  const { lang } = useLang()
  const { updateTool, getToolById, isLoading: isToolsLoading } = useTools()
  const { assignTool } = useAssignments()
  const { getProfileById } = useProfiles()
  const { toolTypes, fetchToolTypes } = useToolTypes()
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Edit mode detection
  const resolvedParams = params ? use(params) : undefined
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined
  const editId = resolvedParams?.id
  const caseId = resolvedSearchParams?.caseId
  const isEditMode = !!editId

  const [isTemplate, setIsTemplate] = useState(true)
  const selectedCase = caseId ? getProfileById(caseId) : null

  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
  })

  const [questions, setQuestions] = useState<MCQuestion[]>([])
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [currentMediaQuestionId, setCurrentMediaQuestionId] = useState<
    string | null
  >(null)

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && editId && !isToolsLoading) {
      // Initialize the editable draft once the asynchronous tool data is available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true)
      const tool = getToolById(editId)
      if (tool && tool.config) {
        const config = tool.config as MultipleChoiceConfig
        setFormData({
          nameEn: tool.name.en,
          nameAr: tool.name.ar,
        })
        setQuestions(config.questions || [])
      }
      setIsLoading(false)
    }
  }, [isEditMode, editId, isToolsLoading])

  const addQuestion = () => {
    const newQuestion: MCQuestion = {
      id: generateId(),
      text: "",
      answerType: "single_choice",
      options: [...DEFAULT_OPTIONS],
      required: false,
      order: questions.length,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<MCQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleReorder = (reordered: MCQuestion[]) => {
    setQuestions(reordered)
  }

  const handleSubmit = async () => {
    if (!formData.nameEn || questions.length === 0) return
    setIsSubmitting(true)

    const toolTypes = await fetchToolTypes()
    const type = toolTypes.find((t) => t.key === "multiple_answer")?.id
    if (!type) {
      setIsSubmitting(false)
      return
    }

    const baseQuestions = questions.map((q, idx) => ({ ...q, order: idx }))
    const pendingEntries = Array.from(pendingFiles.entries())

    const baseConfig: MultipleChoiceConfig = {
      title: { en: formData.nameEn, ar: formData.nameAr },
      questions: baseQuestions,
      media: [],
    }

    let finalConfig: MultipleChoiceConfig

    // Helper: build finalConfig from uploaded URLs
    const buildFinalConfig = (uploadedUrls: string[]): MultipleChoiceConfig => {
      const finalQuestions = baseQuestions.map((q) => {
        const pendingIndex = pendingEntries.findIndex(([id]) => id === q.id)
        if (pendingIndex >= 0 && uploadedUrls[pendingIndex]) {
          return { ...q, mediaUrl: uploadedUrls[pendingIndex] }
        }
        return q
      })
      return {
        title: { en: formData.nameEn, ar: formData.nameAr },
        questions: finalQuestions,
        media: uploadedUrls,
      }
    }

    if (isEditMode && editId) {
      const mediaFormData = new FormData()
      for (const [, file] of pendingEntries) {
        mediaFormData.append("media", file)
      }
      mediaFormData.append("config", JSON.stringify(baseConfig))

      const record = await pb.collection("tools").update(editId, mediaFormData)
      const uploadedUrls = (record.media as string[]).map((filename) =>
        pb.files.getUrl(record, filename)
      )

      finalConfig = buildFinalConfig(uploadedUrls)

      await updateTool(editId, {
        name: { en: formData.nameEn, ar: formData.nameAr },
        config: finalConfig,
      })
      router.push(`/dashboard/admin/tools/multiple-choice/${editId}`)
      return
    }

    // Create mode: only 2 paths
    if (!isTemplate && caseId) {
      // Assignment: create in case_tools, upload media there
      const assignment = await caseToolsCollection.create({
        case: caseId,
        type: type,
        name_en: formData.nameEn,
        name_ar: formData.nameAr,
        is_not_template: true,
        config: baseConfig,
        status: "pending",
        is_visible_to_user: true,
        responses: {},
        media: [],
      })

      if (pendingEntries.length > 0) {
        const files = pendingEntries.map(([, file]) => file)
        const updated = await caseToolsCollection.updateWithFiles(
          assignment.id,
          {},
          files
        )
        const uploadedUrls = (updated.media as string[]).map((filename) =>
          pb.files.getUrl(updated, filename)
        )
        finalConfig = buildFinalConfig(uploadedUrls)
        await caseToolsCollection.update(assignment.id, { config: finalConfig })
      } else {
        finalConfig = baseConfig
      }

      router.push(`/dashboard/admin/cases/${caseId}`)
    } else {
      // Template (with or without case): create in tools, upload media there
      const mediaFormData = new FormData()
      mediaFormData.append("name_en", formData.nameEn)
      mediaFormData.append("name_ar", formData.nameAr)
      mediaFormData.append("type", type)
      mediaFormData.append("serviceType", "individual")
      mediaFormData.append("status", "active")
      mediaFormData.append("config", JSON.stringify(baseConfig))
      for (const [, file] of pendingEntries) {
        mediaFormData.append("media", file)
      }

      const record = await pb.collection("tools").create(mediaFormData)
      const uploadedUrls = (record.media as string[]).map((filename) =>
        pb.files.getUrl(record, filename)
      )

      finalConfig = buildFinalConfig(uploadedUrls)

      await updateTool(record.id, {
        name: { en: formData.nameEn, ar: formData.nameAr },
        config: finalConfig,
      })

      if (caseId) {
        await caseToolsCollection.create({
          case: caseId,
          type: type,
          name_en: formData.nameEn,
          name_ar: formData.nameAr,
          is_not_template: false,
          config: finalConfig,
          is_visible_to_user: true,
          status: "pending",
          responses: {},
          media: [],
        })
      }

      router.push(`/dashboard/admin/tools`)
    }
  }

  const getMediaIcon = (type?: MediaType) => {
    switch (type) {
      case "image":
        return Image
      case "video":
        return Video
      case "audio":
        return Music
      default:
        return Image
    }
  }

  const handleMediaUpload = (data: {
    file: File
    mediaType: MediaType
    responseType: ResponseType
  }) => {
    if (!currentMediaQuestionId) return
    updateQuestion(currentMediaQuestionId, {
      mediaType: data.mediaType,
      mediaUrl: "",
      responseType: data.responseType,
    })
    setPendingFiles((prev) =>
      new Map(prev).set(currentMediaQuestionId, data.file)
    )
    setCurrentMediaQuestionId(null)
  }

  const handleRemoveMedia = (questionId: string) => {
    updateQuestion(questionId, {
      mediaType: undefined,
      mediaUrl: undefined,
      responseType: undefined,
    })
    setPendingFiles((prev) => {
      const next = new Map(prev)
      next.delete(questionId)
      return next
    })
  }

  const renderQuestionItem = (question: MCQuestion, index: number) => {
    const showOptions =
      question.answerType === "single_choice" ||
      question.answerType === "multiple_choice"
    const showCorrect = showOptions
    const isMedia = question.answerType === "media"
    const pendingFile = pendingFiles.get(question.id)
    const mediaPreviewSrc = pendingFile
      ? URL.createObjectURL(pendingFile)
      : question.mediaUrl

    return (
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {lang === "ar" ? "سؤال" : "Question"} {index + 1}
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`req-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) =>
                updateQuestion(question.id, { required: !!checked })
              }
            />
            <Label htmlFor={`req-${question.id}`} className="text-xs">
              {lang === "ar" ? "إجباري" : "Required"}
            </Label>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                removeQuestion(question.id)
                setPendingFiles((prev) => {
                  const next = new Map(prev)
                  next.delete(question.id)
                  return next
                })
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <Input
          placeholder={lang === "ar" ? "سؤال" : "Question"}
          value={question.text}
          onChange={(e) =>
            updateQuestion(question.id, { text: e.target.value })
          }
        />

        <Select
          value={question.answerType}
          onValueChange={(v) =>
            updateQuestion(question.id, { answerType: v as MCAnswerType })
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANSWER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label[lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isMedia && (
          <div className="space-y-3 rounded-md border p-3">
            <Label className="text-xs">
              {lang === "ar" ? "وسائط السؤال" : "Media Prompt"}
            </Label>
            {!question.mediaType ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMediaQuestionId(question.id)
                  setUploadOpen(true)
                }}
              >
                <Plus className="me-1 h-3 w-3" />
                {lang === "ar" ? "اختر الوسائط" : "Select Media"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/30 p-2">
                  {question.mediaType === "image" && mediaPreviewSrc && (
                    <img
                      src={mediaPreviewSrc}
                      alt={lang === "ar" ? "معاينة" : "Preview"}
                      className="h-32 w-full rounded object-cover"
                    />
                  )}
                  {question.mediaType === "video" && mediaPreviewSrc && (
                    <video
                      src={mediaPreviewSrc}
                      className="h-32 w-full rounded object-cover"
                    />
                  )}
                  {question.mediaType === "audio" && (
                    <div className="flex h-12 items-center justify-center rounded bg-muted">
                      <Music className="h-6 w-6" />
                    </div>
                  )}
                  {question.mediaType === "audio" && mediaPreviewSrc && (
                    <audio
                      src={mediaPreviewSrc}
                      controls
                      className="mt-2 w-full"
                    />
                  )}
                  {!mediaPreviewSrc && (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      {lang === "ar" ? "لا توجد معاينة" : "No preview"}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {(() => {
                      const Icon = getMediaIcon(question.mediaType)
                      return <Icon className="h-4 w-4" />
                    })()}
                    <span className="capitalize">{question.mediaType}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize">
                      {question.responseType}{" "}
                      {lang === "ar" ? "استجابة" : "response"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMedia(question.id)}
                  >
                    <X className="me-1 h-3 w-3" />
                    {lang === "ar" ? "إزالة" : "Remove"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {showOptions && (
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs">
              {lang === "ar"
                ? "الخيارات - حدد الإجابة الصحيحة"
                : "Options - check correct answer(s)"}
            </Label>
            {question.options.map((opt, optIdx) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`correct-${question.id}-${optIdx}`}
                  checked={opt.isCorrect}
                  onCheckedChange={(checked) => {
                    const newOptions = question.options.map((o, i) =>
                      i === optIdx ? { ...o, isCorrect: !!checked } : o
                    )
                    updateQuestion(question.id, { options: newOptions })
                  }}
                />
                <Input
                  placeholder={lang === "ar" ? "خيار" : "Option"}
                  value={opt.label}
                  onChange={(e) => {
                    const newOptions = question.options.map((o, i) =>
                      i === optIdx ? { ...o, label: e.target.value } : o
                    )
                    updateQuestion(question.id, { options: newOptions })
                  }}
                  className="flex-1"
                />
                {opt.isCorrect && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newOptions = [
                  ...question.options,
                  {
                    value: generateId(),
                    label: `Option ${question.options.length + 1}`,
                    isCorrect: false,
                  },
                ]
                updateQuestion(question.id, { options: newOptions })
              }}
            >
              <Plus className="me-1 h-3 w-3" />
              {lang === "ar" ? "إضافة خيار" : "Add Option"}
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {lang === "ar" ? "جارٍ التحميل..." : "Loading..."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {isEditMode
                ? lang === "ar"
                  ? "تعديل"
                  : "Edit"
                : lang === "ar"
                  ? "إنشاء"
                  : "Create"}{" "}
              {lang === "ar"
                ? "منشئ الإجابة المتعددة"
                : "Multiple Answer Builder"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? lang === "ar"
                  ? "تحديث أسئلة وإجابات الاختبار"
                  : "Update quiz questions and answers"
                : lang === "ar"
                  ? "أنشئ اختباراً بالإجابات الصحيحة"
                  : "Build quiz with correct answer(s)"}
            </p>
          </div>
        </div>
        <Button
          variant={showPreview ? "default" : "outline"}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <EyeOff className="me-2 h-4 w-4" />
          ) : (
            <Eye className="me-2 h-4 w-4" />
          )}
          {showPreview
            ? lang === "ar"
              ? "إخفاء المعاينة"
              : "Hide Preview"
            : lang === "ar"
              ? "معاينة"
              : "Preview"}
        </Button>
      </div>

      <div
        className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "معلومات أساسية" : "Basic Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {lang === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}
                  </Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    placeholder={
                      lang === "ar" ? "عنوان الاختبار" : "Quiz title"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    placeholder="عنوان الاختبار"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {caseId && selectedCase && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {lang === "ar" ? "معلومات الحالة" : "Case Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {lang === "ar" ? "الحالة:" : "Case:"}
                  </span>
                  <span>{selectedCase.name}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {(caseId || !isEditMode) && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTemplate"
                    checked={isTemplate}
                    onCheckedChange={(checked) =>
                      setIsTemplate(checked === true)
                    }
                  />
                  <label
                    htmlFor="isTemplate"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {lang === "ar"
                      ? "حفظ كقالب (متاح للاستخدام المستقبلي)"
                      : "Save as template (available for future use)"}
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{lang === "ar" ? "الأسئلة" : "Questions"}</CardTitle>
              <Button size="sm" onClick={addQuestion}>
                <Plus className="me-2 h-4 w-4" />
                {lang === "ar" ? "إضافة سؤال" : "Add Question"}
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  {lang === "ar" ? "لا توجد أسئلة بعد." : "No questions yet."}
                </p>
              ) : (
                <DragList
                  items={questions}
                  onReorder={handleReorder}
                  renderItem={renderQuestionItem}
                  keyExtractor={(q) => q.id}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.nameEn || questions.length === 0 || isSubmitting
              }
            >
              {isSubmitting
                ? isEditMode
                  ? lang === "ar"
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : lang === "ar"
                    ? "جارٍ الإنشاء..."
                    : "Creating..."
                : isEditMode
                  ? lang === "ar"
                    ? "حفظ التغييرات"
                    : "Save Changes"
                  : lang === "ar"
                    ? "إنشاء"
                    : "Create"}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="sticky top-6 max-h-[calc(100vh-12rem)] overflow-auto rounded-lg border bg-card p-4">
            <p className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {lang === "ar" ? "معاينة مباشرة" : "Live Preview"}
            </p>
            <MultipleChoicePreview
              config={{
                title: { en: formData.nameEn, ar: formData.nameAr },
                questions,
                media: [],
              }}
            />
          </div>
        )}
      </div>

      <MediaUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleMediaUpload}
      />
    </div>
  )
}
