"use client"

import { useState, useEffect, useCallback } from "react"
import { caseToolsCollection } from "@/lib/pb-collections"
import type { CaseTool } from "@/types/assignment"
import type { ToolConfig } from "@/types/tool"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"

export function useAssignments(caseId?: string) {
  const [assignments, setAssignments] = useState<CaseTool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setLoadError("")
    try {
      let data: CaseTool[]
      if (caseId) {
        data = await caseToolsCollection.getByCase(caseId)
      } else {
        data = await caseToolsCollection.getAll()
      }
      setAssignments(data)
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
      setLoadError(getErrorMessage(error))
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    // Fetch external records when the selected scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssignments()
  }, [fetchAssignments])

  // Create assignment/document in case_tools
  // Works for both template-based (survey, etc.) and case-specific (plan, report, attachment)
  const assignTool = async (data: {
    case: string
    type: string // tool_type ID
    name_en?: string
    name_ar?: string
    is_not_template?: boolean
    config: ToolConfig
    is_visible_to_user?: boolean
    status?: CaseTool["status"]
  }) => {
    try {
      const newAssignment = await caseToolsCollection.create({
        case: data.case,
        type: data.type,
        name_en: data.name_en,
        name_ar: data.name_ar,
        is_not_template: data.is_not_template ?? false,
        config: data.config,
        status: data.status ?? "pending",
        is_visible_to_user: data.is_visible_to_user ?? true,
        responses: {},
        media: [],
      })
      setAssignments((prev) => [...prev, newAssignment])
      return newAssignment.id
    } catch (error) {
      console.error("Failed to create assignment:", error)
      throw error
    }
  }

  const updateAssignment = async (id: string, data: Partial<CaseTool>) => {
    try {
      const updated = await caseToolsCollection.update(id, data)
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (error) {
      console.error("Failed to update assignment:", error)
      throw error
    }
  }

  const updateAssignmentWithFiles = async (
    id: string,
    data: Partial<CaseTool>,
    files: File[],
    filesToRemove?: string[]
  ) => {
    try {
      const updated = await caseToolsCollection.updateWithFiles(
        id,
        data,
        files,
        filesToRemove
      )
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
      return updated
    } catch (error) {
      console.error("Failed to update assignment with files:", error)
      throw error
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      await caseToolsCollection.delete(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Failed to delete assignment:", error)
      throw error
    }
  }

  const getAssignmentsByCase = (caseId: string) =>
    assignments.filter((a) => a.case === caseId)

  const getAssignmentsByType = (typeId: string) =>
    assignments.filter((a) => a.type === typeId)

  const getVisibleAssignments = (caseId: string) =>
    assignments.filter((a) => a.case === caseId && a.is_visible_to_user)

  return {
    assignments,
    isLoading,
    loadError,
    assignTool,
    updateAssignment,
    updateAssignmentWithFiles,
    deleteAssignment,
    getAssignmentsByCase,
    getAssignmentsByType,
    getVisibleAssignments,
    refresh: fetchAssignments,
  }
}
