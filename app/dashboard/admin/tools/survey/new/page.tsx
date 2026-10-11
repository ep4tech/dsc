"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTools } from "@/hooks/useTools"
import { useAssignments } from "@/hooks/useAssignments"
import { useProfiles } from "@/hooks/useProfiles"
import { useLang } from "@/lib/lang-context"
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
import { SurveyPreview } from "@/components/tool-renderers/SurveyPreview"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react"
import type {
  SurveyConfig,
  SurveyQuestion,
  SurveyOption,
  SurveyAnswerType,
} from "@/types/tool"
import { useToolTypes } from "@/hooks/useToolTypes"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const ANSWER_TYPES: {
  value: SurveyAnswerType
  label: { en: string; ar: string }
}[] = [
  {
    value: "single_choice",
    label: { en: "Single Choice (Radio)", ar: "اختيار واحد (أزرار اختيار)" },
  },
  {
    value: "multiple_choice",
    label: { en: "Multiple Choice (Checkbox)", ar: "اختيار من متعدد (خانات)" },
  },
]

interface SurveyBuilderPageProps {
  params?: Promise<{ id?: string }>
  searchParams?: Promise<{ caseId?: string }>
}

export default function SurveyBuilderPage({
  params,
  searchParams,
}: SurveyBuilderPageProps = {}) {
  const router = useRouter()
  const { lang } = useLang()
  const {
    addTool,
    updateTool,
    getToolById,
    isLoading: isToolsLoading,
  } = useTools()
  const { assignTool } = useAssignments()
  const { getProfileById } = useProfiles()
  const { toolTypes, fetchToolTypes } = useToolTypes()
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)
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
    answerType: "single_choice" as SurveyAnswerType,
  })

  const [options, setOptions] = useState<SurveyOption[]>([
    {
      id: generateId(),
      value: "very_satisfied",
      label: "Very Satisfied",
      order: 0,
    },
    { id: generateId(), value: "satisfied", label: "Satisfied", order: 1 },
    { id: generateId(), value: "neutral", label: "Neutral", order: 2 },
    { id: generateId(), value: "unsatisfied", label: "Unsatisfied", order: 3 },
    {
      id: generateId(),
      value: "very_unsatisfied",
      label: "Very Unsatisfied",
      order: 4,
    },
  ])

  const [questions, setQuestions] = useState<SurveyQuestion[]>([])

  useEffect(() => {
    if (!isEditMode || !editId || isToolsLoading) return
    if (hasInitialized.current) return

    // Initialize the editable draft once the asynchronous tool data is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    const tool = getToolById(editId)
    if (tool && tool.config) {
      const config = tool.config as SurveyConfig
      setFormData({
        nameEn: tool.name.en,
        nameAr: tool.name.ar,
        answerType: config.answerType || "single_choice",
      })
      setOptions(config.options || [])
      setQuestions(config.questions || [])
    }
    setIsLoading(false)
    hasInitialized.current = true
  }, [isEditMode, editId, isToolsLoading, getToolById])

  const addOption = () => {
    const newOption: SurveyOption = {
      id: generateId(),
      value: `option_${options.length + 1}`,
      label: `Option ${options.length + 1}`,
      order: options.length,
    }
    setOptions([...options, newOption])
  }

  const updateOption = (id: string, label: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, label } : o)))
  }

  const removeOption = (id: string) => {
    if (options.length <= 3) return
    setOptions(options.filter((o) => o.id !== id))
  }

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: generateId(),
      text: "",
      required: false,
      order: questions.length,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleReorder = (reordered: SurveyQuestion[]) => {
    setQuestions(reordered)
  }

  const handleSubmit = async () => {
    if (!formData.nameEn || options.length < 3 || questions.length === 0) return
    setIsSubmitting(true)

    const config: SurveyConfig = {
      title: { en: formData.nameEn, ar: formData.nameAr },
      answerType: formData.answerType,
      options: options.map((o, idx) => ({ ...o, order: idx })),
      questions: questions.map((q, idx) => ({ ...q, order: idx })),
      media: [],
    }

    if (isEditMode && editId) {
      await updateTool(editId, {
        name: { en: formData.nameEn, ar: formData.nameAr },
        config,
      })
      router.push(`/dashboard/admin/tools/survey/${editId}`)
    } else {
      const toolTypes = await fetchToolTypes()
      const type = toolTypes.find((t) => t.key === "survey")?.id
      if (!type) {
        setIsSubmitting(false)
        return
      }

      if (!isTemplate && caseId) {
        await assignTool({
          case: caseId,
          type: type,
          name_en: formData.nameEn,
          name_ar: formData.nameAr,
          is_not_template: true,
          config,
          is_visible_to_user: true,
          status: "pending",
        })
        router.push(`/dashboard/admin/cases/${caseId}`)
      } else {
        await addTool({
          name: { en: formData.nameEn, ar: formData.nameAr },
          type: type,
          serviceType: "individual",
          status: "active",
          config,
        })
        router.push(`/dashboard/admin/tools`)
      }
    }
  }

  const renderQuestionItem = (question: SurveyQuestion, index: number) => {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-3 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
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
                onClick={() => removeQuestion(question.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <Input
            placeholder={
              lang === "ar" ? "أدخل نص السؤال" : "Enter question text"
            }
            value={question.text}
            onChange={(e) =>
              updateQuestion(question.id, {
                text: e.target.value,
              })
            }
          />
        </div>
      </div>
    )
  }

  const renderOptionItem = (option: SurveyOption, index: number) => {
    return (
      <div key={option.id} className="flex items-center gap-2">
        <Input
          placeholder={lang === "ar" ? "نص الخيار" : "Option label"}
          value={option.label}
          onChange={(e) => updateOption(option.id, e.target.value)}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => removeOption(option.id)}
          disabled={options.length <= 3}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
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
                  ? "تعديل الاستبيان"
                  : "Edit Survey"
                : lang === "ar"
                  ? "إنشاء استبيان"
                  : "Create Survey"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? lang === "ar"
                  ? "تحديث أسئلة وخيارات الاستبيان"
                  : "Update survey questions and options"
                : lang === "ar"
                  ? "أنشئ استبياناً بخيارات مشتركة لجميع الأسئلة"
                  : "Build a survey with shared options for all questions"}
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
                    {lang === "ar"
                      ? "اسم الاستبيان (إنجليزي)"
                      : "Survey Name (EN)"}
                  </Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    placeholder={
                      lang === "ar" ? "عنوان الاستبيان" : "Survey title"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {lang === "ar"
                      ? "اسم الاستبيان (عربي)"
                      : "Survey Name (AR)"}
                  </Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    placeholder="عنوان الاستبيان"
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
            <CardHeader>
              <CardTitle>
                {lang === "ar" ? "نوع الإجابة" : "Answer Type"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.answerType}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    answerType: v as SurveyAnswerType,
                  })
                }
              >
                <SelectTrigger className="w-64">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {lang === "ar"
                  ? "الخيارات (مشتركة لجميع الأسئلة)"
                  : "Options (Shared for all questions)"}
              </CardTitle>
              <Button size="sm" onClick={addOption}>
                <Plus className="me-2 h-4 w-4" />
                {lang === "ar" ? "إضافة خيار" : "Add Option"}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {lang === "ar"
                  ? "مطلوب 3 خيارات كحد أدنى. ستستخدم جميع الأسئلة هذه الخيارات."
                  : "Minimum 3 options required. All questions will use these options."}
              </p>
              <div className="space-y-2">
                {options.map((opt, idx) => renderOptionItem(opt, idx))}
              </div>
            </CardContent>
          </Card>

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
                  {lang === "ar"
                    ? "لا توجد أسئلة بعد. أضف واحداً للبدء."
                    : "No questions yet. Add one to start."}
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
                !formData.nameEn ||
                options.length < 3 ||
                questions.length === 0 ||
                isSubmitting
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
                    ? "إنشاء استبيان"
                    : "Create Survey"}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="sticky top-6 max-h-[calc(100vh-12rem)] overflow-auto rounded-lg border bg-card p-4">
            <p className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              {lang === "ar" ? "معاينة مباشرة" : "Live Preview"}
            </p>
            <SurveyPreview
              config={{
                title: { en: formData.nameEn, ar: formData.nameAr },
                answerType: formData.answerType,
                options: options,
                questions: questions,
                media: [],
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
