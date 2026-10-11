"use client"

import { useState } from "react"
import { useLang } from "@/lib/lang-context"
import type { MultipleChoiceConfig, MCQuestion } from "@/types/tool"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "../ui/textarea"

interface MultipleChoicePreviewProps {
  config: MultipleChoiceConfig
  responses?: Record<string, unknown>
  readOnly?: boolean
}

export function MultipleChoicePreview({ config, responses = {}, readOnly = false }: MultipleChoicePreviewProps) {
  const { lang } = useLang()
  const [draftAnswers, setAnswers] = useState<Record<string, unknown>>(responses)
  const [showAnswers, setShowAnswers] = useState(false)

  const answers = readOnly ? responses : draftAnswers

  const handleAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const renderMedia = (question: MCQuestion) => {
    if (!question.mediaUrl) {
      return (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          {lang === "ar" ? "لم يتم تحميل الوسائط" : "No media uploaded"}
        </div>
      )
    }
    if (question.mediaType === "image") {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <img
            src={question.mediaUrl}
            alt="Media"
            className="h-full w-full object-contain"
          />
        </div>
      )
    }
    if (question.mediaType === "video") {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
          <video src={question.mediaUrl} className="h-full w-full object-contain" />
        </div>
      )
    }
    if (question.mediaType === "audio") {
      return (
        <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
          <audio src={question.mediaUrl} controls className="w-full" />
        </div>
      )
    }
    return null
  }

  const renderQuestion = (question: MCQuestion, index: number) => {
    const value = answers[question.id] as string | number | string[] | undefined
    const showOptions =
      question.answerType === "single_choice" ||
      question.answerType === "multiple_choice"
    const correctOptions =
      question.options?.filter((o) => o.isCorrect).map((o) => o.value) || []
    const isMedia = question.answerType === "media"

    return (
      <div
        key={question.id}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="mt-0.5">
            {index + 1}
          </Badge>
          <Label className="flex-1 font-medium">
            {question.text}
            {question.required && (
              <span className="ms-1 text-destructive">*</span>
            )}
          </Label>
        </div>

        <div className="ms-7 space-y-3">
          {isMedia && renderMedia(question)}

          {question.answerType === "text" && (
            <Textarea
              placeholder={
                lang === "ar" ? "أدخل إجابتك..." : "Enter your answer..."
              }
              value={(value as string) || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
          )}
          {question.answerType === "number" && (
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={(value as string) || ""}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[^0-9]/g, "")
              handleAnswer(question.id, filtered)
            }}
            />
          )}
          {showOptions && question.answerType === "single_choice" && (
            <RadioGroup
              value={(value as string) || ""}
              onValueChange={(v) => handleAnswer(question.id, v)}
            >
              {question.options?.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`mc-preview-${question.id}-${opt.value}`}
                  />
                  <Label
                    htmlFor={`mc-preview-${question.id}-${opt.value}`}
                    className={
                      showAnswers && opt.isCorrect
                        ? "font-medium text-green-600"
                        : ""
                    }
                  >
                    {opt.label} {showAnswers && opt.isCorrect && "✓"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {showOptions && question.answerType === "multiple_choice" && (
            <div className="space-y-2">
              {question.options?.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`mc-preview-${question.id}-${opt.value}`}
                    checked={((value as string[]) || []).includes(opt.value)}
                    onCheckedChange={(checked) => {
                      const current = (value as string[]) || []
                      if (checked)
                        handleAnswer(question.id, [...current, opt.value])
                      else
                        handleAnswer(
                          question.id,
                          current.filter((v) => v !== opt.value)
                        )
                    }}
                  />
                  <Label
                    htmlFor={`mc-preview-${question.id}-${opt.value}`}
                    className={
                      showAnswers && opt.isCorrect
                        ? "font-medium text-green-600"
                        : ""
                    }
                  >
                    {opt.label} {showAnswers && opt.isCorrect && "✓"}
                  </Label>
                </div>
              ))}
            </div>
          )}
          {isMedia && question.responseType === "text" && (
            <Input
              placeholder={
                lang === "ar" ? "اكتب إجابتك..." : "Type your answer..."
              }
              value={(value as string) || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
          )}
          {isMedia && question.responseType === "video" && (
            <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "سجل فيديو إجابتك" : "Record video response"}
            </div>
          )}
          {isMedia && question.responseType === "audio" && (
            <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              {lang === "ar" ? "سجل صوت إجابتك" : "Record audio response"}
            </div>
          )}
        </div>
      </div>
    )
  }

  const sortedQuestions = [...config.questions].sort(
    (a, b) => a.order - b.order
  )

  if (sortedQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No questions yet
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{config.title[lang]}</h3>
      {sortedQuestions.map((q, idx) => renderQuestion(q, idx))}
      {!readOnly && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? "Hide Answers" : "Show Correct Answers"}
          </Button>
        </div>
      )}
      {!readOnly && (
        <div className="rounded-lg bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">Your Answers:</p>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
