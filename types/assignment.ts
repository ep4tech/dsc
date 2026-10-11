import type { ToolConfig } from "./tool"

export type AssignmentStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"

export interface CaseTool {
  assigned_expert?: string
  specialization?: string
  task_brief?: string
  id: string
  case: string
  type: string // tool_type relation ID (e.g., "pbc_xxxxx" for "plan")
  name_en?: string
  name_ar?: string
  is_not_template?: boolean
  responses: Record<string, unknown>
  status: AssignmentStatus
  is_visible_to_user: boolean
  assigned_at: string
  media: string[]
  config?: ToolConfig // Full config for the tool/assignment
  created: string
  updated: string
}
