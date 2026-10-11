"use client"

import { useState } from "react"
import { useLang } from "@/lib/lang-context"
import type { SurveyConfig, SurveyQuestion, SurveyOption } from "@/types/tool"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SurveyPreviewProps {
  config: SurveyConfig
  responses?: Record<string, unknown>
  readOnly?: boolean
}

export function SurveyPreview({ config, responses = {}, readOnly = false }: SurveyPreviewProps) {
  const { lang } = useLang()
  const [draftAnswers, setAnswers] = useState<Record<string, unknown>>(responses)

  const answers = readOnly ? responses : draftAnswers

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleMultipleAnswer = (
    questionId: string,
    value: string,
    checked: boolean
  ) => {
    const current = ((answers[questionId] as string[]) || []).filter(Boolean)
    if (checked) {
      setAnswers((prev) => ({ ...prev, [questionId]: [...current, value] }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: current.filter((v) => v !== value),
      }))
    }
  }

  const isMultipleChoice = config.answerType === "multiple_choice"
  const sortedOptions = [...config.options].sort((a, b) => a.order - b.order)
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

  if (sortedOptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No options defined
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{config.title[lang]}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="min-w-[200px] border-b-2 border-border bg-muted/30 p-3 text-left text-sm font-semibold">
                Questions
              </th>
              {sortedOptions.map((opt) => (
                <th
                  key={opt.id}
                  className="min-w-[100px] border-b-2 border-border bg-muted/30 p-2 text-center text-sm font-semibold"
                >
                  {opt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedQuestions.map((question) => {
              const value = answers[question.id]
              const selectedSingle = value as string | undefined
              const selectedMultiple = (value as string[]) || []

              return (
                <tr
                  key={question.id}
                  className="border-b border-border hover:bg-muted/10"
                >
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">
                        {question.order + 1}
                      </Badge>
                      <Label className="flex-1 font-medium">
                        {question.text}
                        {question.required && (
                          <span className="ms-1 text-destructive">*</span>
                        )}
                      </Label>
                    </div>
                  </td>
                  {sortedOptions.map((opt) => {
                    if (isMultipleChoice) {
                      const isChecked = selectedMultiple.includes(opt.value)
                      return (
                        <td key={opt.id} className="p-2 text-center">
                          <Checkbox
                            id={`preview-${question.id}-${opt.id}`}
                            checked={isChecked}
                            disabled={readOnly}
                            onCheckedChange={readOnly ? undefined : (checked) =>
                              handleMultipleAnswer(
                                question.id,
                                opt.value,
                                !!checked
                              )
                            }
                          />
                        </td>
                      )
                    } else {
                      const isSelected = selectedSingle === opt.value
                      return (
                        <td key={opt.id} className="p-2 text-center">
                          <RadioGroup
                            value={selectedSingle || ""}
                            onValueChange={readOnly ? undefined : (v) =>
                              handleSingleAnswer(question.id, v)
                            }
                          >
                            <RadioGroupItem
                              value={opt.value}
                              id={`preview-${question.id}-${opt.id}`}
                            />
                          </RadioGroup>
                        </td>
                      )
                    }
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
