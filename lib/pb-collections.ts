import { boundedFullList } from "@/lib/bounded-records"
import pb from "./pb"
import type { User } from "@/types/user"
import type { Profile } from "@/types/profile"
import type { Tool, BilingualString } from "@/types/tool"
import type { CaseTool } from "@/types/assignment"
import type { BlogPage, BlogCategory, InfoPage, HomePage } from "@/types/cms"
import type { ToolTypeRecord } from "./tool-types"
import { handlePocketBaseError } from "./pb"

// Transform flat DB fields to nested TypeScript objects
function transformToolFromDB(dbTool: Record<string, unknown>): Tool {
  return {
    id: dbTool.id as string,
    name: {
      en: (dbTool.name_en as string) || "",
      ar: (dbTool.name_ar as string) || "",
    },
    description: (dbTool.description as string) || "",
    type: dbTool.type as Tool["type"],
    serviceType: (dbTool.serviceType as Tool["serviceType"]) || "individual",
    status: (dbTool.status as Tool["status"]) || "active",
    config: (dbTool.config as Tool["config"]) || {},
    created: dbTool.created as string,
    updated: dbTool.updated as string,
  }
}

// Transform nested TypeScript objects to flat DB fields
function transformToolToDB(tool: Partial<Tool>): Record<string, unknown> {
  const dbData: Record<string, unknown> = {}

  if (tool.name) {
    dbData.name_en = tool.name.en
    dbData.name_ar = tool.name.ar
  }
  if (tool.description) {
    dbData.description = tool.description
  }
  if (tool.type) dbData.type = tool.type
  if (tool.serviceType) dbData.serviceType = tool.serviceType
  if (tool.status) dbData.status = tool.status
  if (tool.config) dbData.config = tool.config

  return dbData
}

export const toolsCollection = {
  async getAll(): Promise<Tool[]> {
    const data = await boundedFullList(pb.collection("tools"))
    return data.map(transformToolFromDB)
  },

  async getById(id: string): Promise<Tool> {
    const data = await pb.collection("tools").getOne(id)
    return transformToolFromDB(data)
  },

  async create(data: Partial<Tool>): Promise<Tool> {
    const dbData = transformToolToDB(data)
    const result = await pb.collection("tools").create(dbData)
    return transformToolFromDB(result)
  },

  async update(id: string, data: Partial<Tool>): Promise<Tool> {
    const dbData = transformToolToDB(data)
    const result = await pb.collection("tools").update(id, dbData)
    return transformToolFromDB(result)
  },

  async delete(id: string): Promise<void> {
    await pb.collection("tools").delete(id)
  },

  async getByType(type: string): Promise<Tool[]> {
    const data = await boundedFullList(pb.collection("tools"), {
      filter: pb.filter("type = {:value0}", { value0: type }),
    })
    return data.map(transformToolFromDB)
  },

  async getActive(): Promise<Tool[]> {
    const data = await boundedFullList(pb.collection("tools"), {
      filter: `status = "active"`,
    })
    return data.map(transformToolFromDB)
  },
}

export const casesCollection = {
  async getAll(): Promise<Profile[]> {
    return boundedFullList(pb.collection("cases"), {
      expand: "user",
    })
  },

  async getById(id: string): Promise<Profile> {
    return pb.collection("cases").getOne(id)
  },

  async create(data: Partial<Profile>): Promise<Profile> {
    return pb.collection("cases").create(data)
  },

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    return pb.collection("cases").update(id, data)
  },

  // Update with payment slip file upload using FormData
  async updateWithFiles(
    id: string,
    data: Partial<Profile>,
    files: File[],
    filesToRemove?: string[]
  ): Promise<Profile> {
    const formData = new FormData()

    // Preserve existing slip when adding a new one (PocketBase replaces all if not included)
    if (files.length > 0 && (!filesToRemove || filesToRemove.length === 0)) {
      const existing = await pb.collection("cases").getOne(id)
      if (existing.payment_slip && typeof existing.payment_slip === "string") {
        formData.append("payment_slip", existing.payment_slip)
      }
    }

    files.forEach((file) => {
      formData.append("payment_slip", file)
    })

    if (data.status !== undefined) {
      formData.append("status", data.status)
    }
    if (data.payment_reject_reason !== undefined) {
      formData.append("payment_reject_reason", data.payment_reject_reason)
    }

    if (filesToRemove && filesToRemove.length > 0) {
      formData.append("payment_slip-", filesToRemove.join(","))
    }

    return pb.collection("cases").update(id, formData)
  },

  async delete(id: string): Promise<void> {
    await pb.collection("cases").delete(id)
  },

  async getByUser(userId: string): Promise<Profile[]> {
    return boundedFullList(pb.collection("cases"), {
      filter: pb.filter("user = {:value0}", { value0: userId }),
    })
  },

  async getByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return []
    const filter = ids.map((id) => pb.filter("id = {:value0}", { value0: id })).join(" || ")
    return boundedFullList(pb.collection("cases"), { filter, expand: "user" })
  },

  async getByProgram(programId: string): Promise<Profile[]> {
    return boundedFullList(pb.collection("cases"), {
      filter: pb.filter("program_id = {:value0}", { value0: programId }),
    })
  },

  async getByProgramAndServiceType(
    programId: string,
    serviceType: string
  ): Promise<Profile[]> {
    return boundedFullList(pb.collection("cases"), {
      filter: pb.filter("program_id = {:value0} && service_type = {:value1}", { value0: programId, value1: serviceType }),
    })
  },

  async getByProgramAndPortalType(
    programId: string,
    portalType: string
  ): Promise<Profile[]> {
    return boundedFullList(pb.collection("cases"), {
      filter: pb.filter("program_id = {:value0} && portal_type = {:value1}", { value0: programId, value1: portalType }),
    })
  },
}

export const caseToolsCollection = {
  async getAll(): Promise<CaseTool[]> {
    return boundedFullList(pb.collection("case_tools"))
  },

  async getById(id: string): Promise<CaseTool> {
    return pb.collection("case_tools").getOne(id)
  },

  async create(data: Partial<CaseTool>): Promise<CaseTool> {
    return pb.collection("case_tools").create(data)
  },

  async update(id: string, data: Partial<CaseTool>): Promise<CaseTool> {
    return pb.collection("case_tools").update(id, data)
  },

  // Update with file uploads using FormData
  async updateWithFiles(
    id: string,
    data: Partial<CaseTool>,
    files: File[],
    filesToRemove?: string[]
  ): Promise<CaseTool> {
    const formData = new FormData()

    // Preserve existing media files when adding new ones (PocketBase replaces all if not included)
    if (files.length > 0 && (!filesToRemove || filesToRemove.length === 0)) {
      const existing = await pb.collection("case_tools").getOne(id)
      if (existing.media && Array.isArray(existing.media)) {
        existing.media.forEach((filename: string) => {
          formData.append("media", filename)
        })
      }
    }

    // Add files to upload
    files.forEach((file) => {
      formData.append("media", file)
    })

    // Add other data fields
    if (data.responses !== undefined) {
      formData.append("responses", JSON.stringify(data.responses))
    }
    if (data.status !== undefined) {
      formData.append("status", data.status)
    }
    if (data.name_en !== undefined) {
      formData.append("name_en", data.name_en)
    }
    if (data.name_ar !== undefined) {
      formData.append("name_ar", data.name_ar)
    }
    if (data.is_visible_to_user !== undefined) {
      formData.append("is_visible_to_user", String(data.is_visible_to_user))
    }

    // Remove files if specified
    if (filesToRemove && filesToRemove.length > 0) {
      formData.append("media-", filesToRemove.join(","))
    }

    return pb.collection("case_tools").update(id, formData)
  },

  async delete(id: string): Promise<void> {
    await pb.collection("case_tools").delete(id)
  },

  async getByCase(caseId: string): Promise<CaseTool[]> {
    return boundedFullList(pb.collection("case_tools"), {
      filter: pb.filter("case = {:value0}", { value0: caseId }),
    })
  },

  async getByTool(toolId: string): Promise<CaseTool[]> {
    return boundedFullList(pb.collection("case_tools"), {
      filter: pb.filter("tool = {:value0}", { value0: toolId }),
    })
  },

  async getVisibleToUser(caseId: string): Promise<CaseTool[]> {
    return boundedFullList(pb.collection("case_tools"), {
      filter: pb.filter("case = {:value0} && is_visible_to_user = true", { value0: caseId }),
    })
  },
}

function transformLookupToolType(
  record: Record<string, unknown>
): ToolTypeRecord {
  const key = (record.key as string) || (record.name as string) || ""

  return {
    id: record.id as string,
    key,
    name: key,
    label: {
      en: (record.label_en as string) || (record.name_en as string) || key,
      ar: (record.label_ar as string) || (record.name_ar as string) || key,
    },
  }
}

// Tool Types Collection with caching
const toolTypesCache: Map<string, ToolTypeRecord> = new Map()
const toolTypesCacheById: Map<string, ToolTypeRecord> = new Map()

export const toolTypesCollection = {
  async getAll(): Promise<ToolTypeRecord[]> {
    try {
      const data = await boundedFullList(pb.collection("lookups"), {
        filter: 'type = "tool_types"',
      })

      const records = data.map((type) =>
        transformLookupToolType(type as unknown as Record<string, unknown>)
      )

      records.forEach((type) => {
        toolTypesCache.set(type.key, type)
        toolTypesCacheById.set(type.id, type)
      })

      return records
    } catch {
      const data = await boundedFullList(pb.collection("tool_types"))
      const records = data.map((type) => ({
        id: type.id,
        key: type.name,
        name: type.name,
        label: {
          en: type.name,
          ar: type.name,
        },
      }))

      records.forEach((type) => {
        toolTypesCache.set(type.key, type)
        toolTypesCacheById.set(type.id, type)
      })

      return records
    }
  },

  async getByName(name: string): Promise<ToolTypeRecord> {
    // Check cache first
    if (toolTypesCache.has(name)) {
      return toolTypesCache.get(name)!
    }

    // Fetch from DB
    try {
      const type = await pb
        .collection("lookups")
        .getFirstListItem(pb.filter("type = \"tool_types\" && key = {:value0}", { value0: name }))
      const record = transformLookupToolType(
        type as unknown as Record<string, unknown>
      )
      toolTypesCache.set(record.key, record)
      toolTypesCacheById.set(record.id, record)
      return record
    } catch {
      try {
        const type = await pb
          .collection("tool_types")
          .getFirstListItem(pb.filter("name = {:value0}", { value0: name }))
        const record = {
          id: type.id,
          key: type.name,
          name: type.name,
          label: {
            en: type.name,
            ar: type.name,
          },
        }
        toolTypesCache.set(record.key, record)
        toolTypesCacheById.set(record.id, record)
        return record
      } catch {
        console.error(`Tool type "${name}" not found`)
        throw new Error(`Tool type "${name}" not found`)
      }
    }
  },

  // Get by ID (useful when you have the type ID from case_tools)
  async getById(id: string): Promise<ToolTypeRecord> {
    // Check cache first
    if (toolTypesCacheById.has(id)) {
      return toolTypesCacheById.get(id)!
    }

    // Fetch from DB
    try {
      const type = await pb.collection("lookups").getOne(id)
      const record = transformLookupToolType(
        type as unknown as Record<string, unknown>
      )
      toolTypesCache.set(record.key, record)
      toolTypesCacheById.set(record.id, record)
      return record
    } catch {
      const type = await pb.collection("tool_types").getOne(id)
      const record = {
        id: type.id,
        key: type.name,
        name: type.name,
        label: {
          en: type.name,
          ar: type.name,
        },
      }
      toolTypesCache.set(record.key, record)
      toolTypesCacheById.set(record.id, record)
      return record
    }
  },

  // Clear cache (useful if tool types are modified)
  clearCache() {
    toolTypesCache.clear()
    toolTypesCacheById.clear()
  },
}

export const infoPagesCollection = {
  async getBySlug(slug: string): Promise<InfoPage | null> {
    try {
      const data = await pb
        .collection("info_pages")
        .getFirstListItem(pb.filter("slug = {:value0}", { value0: slug }))
      return data as unknown as InfoPage
    } catch {
      return null
    }
  },

  async getPublishedBySlug(slug: string): Promise<InfoPage | null> {
    try {
      const data = await pb
        .collection("info_pages")
        .getFirstListItem(pb.filter("slug = {:value0} && is_published = true", { value0: slug }))
      return data as unknown as InfoPage
    } catch {
      return null
    }
  },

  async getAll(): Promise<InfoPage[]> {
    const data = await boundedFullList(pb.collection("info_pages"), {
      sort: "order",
    })
    return data as unknown as InfoPage[]
  },

  async getByPortal(portalId: string): Promise<InfoPage[]> {
    const data = await boundedFullList(pb.collection("info_pages"), {
      filter: pb.filter("portal_name = {:value0}", { value0: portalId }),
      sort: "order",
    })
    return data as unknown as InfoPage[]
  },

  async create(data: {
    slug: string
    title_en: string
    title_ar?: string
    portal_name?: string
    content_en?: string
  }): Promise<InfoPage> {

    const count = await boundedFullList(pb
      .collection("info_pages"), { filter: pb.filter("portal_name = {:value0}", { value0: data.portal_name || "" }) })

    const lorem =
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>"
    const result = await pb.collection("info_pages").create({
      slug: data.slug,
      portal_name: data.portal_name || "",
      title_en: data.title_en,
      title_ar: data.title_ar || "",
      content_en: data.content_en || lorem,
      is_published: false,
      order: count.length, 
    })
    return result as unknown as InfoPage
  },

  async update(id: string, data: Partial<InfoPage>): Promise<InfoPage> {
    const result = await pb.collection("info_pages").update(id, data)
    return result as unknown as InfoPage
  },

  async updateWithFiles(
    id: string,
    data: Partial<InfoPage>,
    files: File[],
    filesToRemove?: string[]
  ): Promise<InfoPage> {
    const formData = new FormData()

    // Preserve existing media files when adding new ones (PocketBase replaces all if not included)
    if (files.length > 0 && (!filesToRemove || filesToRemove.length === 0)) {
      const existing = await pb.collection("info_pages").getOne(id)
      if (existing.media && Array.isArray(existing.media)) {
        existing.media.forEach((filename: string) => {
          formData.append("media", filename)
        })
      }
    }

    if (data.portal_name !== undefined)
      formData.append("portal_name", data.portal_name)
    if (data.slug !== undefined) formData.append("slug", data.slug)
    if (data.title_en !== undefined)
      formData.append("title_en", data.title_en)
    if (data.title_ar !== undefined)
      formData.append("title_ar", data.title_ar)
    if (data.content_en !== undefined)
      formData.append("content_en", data.content_en)
    if (data.content_ar !== undefined)
      formData.append("content_ar", data.content_ar)
    if (data.is_published !== undefined)
      formData.append("is_published", String(data.is_published))

    files.forEach((file) => {
      formData.append("media", file)
    })

    if (filesToRemove && filesToRemove.length > 0) {
      formData.append("media-", filesToRemove.join(","))
    }

    const result = await pb.collection("info_pages").update(id, formData)
    return result as unknown as InfoPage
  },

  async updateIcon(id: string, file: File): Promise<InfoPage> {
    const formData = new FormData()
    formData.append("icon", file)
    const result = await pb.collection("info_pages").update(id, formData)
    return result as unknown as InfoPage
  },

  async removeIcon(id: string): Promise<InfoPage> {
    const formData = new FormData()
    formData.append("icon", "")
    const result = await pb.collection("info_pages").update(id, formData)
    return result as unknown as InfoPage
  },

  async delete(id: string): Promise<void> {
    await pb.collection("info_pages").delete(id)
  },
}

export const homePagesCollection = {
  async getBySlug(slug: string): Promise<HomePage | null> {
    try {
      const data = await pb
        .collection("home_pages")
        .getFirstListItem(pb.filter("slug = {:value0}", { value0: slug }))
      return data as unknown as HomePage
    } catch {
      return null
    }
  },

  async getPublishedBySlug(slug: string): Promise<HomePage | null> {
    try {
      const data = await pb
        .collection("home_pages")
        .getFirstListItem(pb.filter("slug = {:value0} && is_published = true", { value0: slug }))
      return data as unknown as HomePage
    } catch {
      return null
    }
  },

  async create(data: {
    slug: string
    title: string
    content_en?: string
  }): Promise<HomePage> {
    const lorem =
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>"
    const result = await pb.collection("home_pages").create({
      slug: data.slug,
      title_en: data.title,
      content_en: data.content_en || lorem,
      is_published: false,
    })
    return result as unknown as HomePage
  },

  async update(id: string, data: Partial<HomePage>): Promise<HomePage> {
    const result = await pb.collection("home_pages").update(id, data)
    return result as unknown as HomePage
  },

  async updateWithFiles(
    id: string,
    data: Partial<HomePage>,
    files: File[],
    filesToRemove?: string[]
  ): Promise<HomePage> {
    const formData = new FormData()

    if (files.length > 0 && (!filesToRemove || filesToRemove.length === 0)) {
      const existing = await pb.collection("home_pages").getOne(id)
      if (existing.media && Array.isArray(existing.media)) {
        existing.media.forEach((filename: string) => {
          formData.append("media", filename)
        })
      }
    }

    if (data.title_en !== undefined) formData.append("title_en", data.title_en)
    if (data.title_ar !== undefined) formData.append("title_ar", data.title_ar)
    if (data.content_en !== undefined)
      formData.append("content_en", data.content_en)
    if (data.content_ar !== undefined)
      formData.append("content_ar", data.content_ar)
    if (data.is_published !== undefined)
      formData.append("is_published", String(data.is_published))

    files.forEach((file) => {
      formData.append("media", file)
    })

    if (filesToRemove && filesToRemove.length > 0) {
      formData.append("media-", filesToRemove.join(","))
    }

    const result = await pb.collection("home_pages").update(id, formData)
    return result as unknown as HomePage
  },

  async delete(id: string): Promise<void> {
    await pb.collection("home_pages").delete(id)
  },
}

function extractAuthorFromRecord(record: Record<string, unknown>): string {
  return (record.author_name as string) || ""
}

function extractThumbnail(record: Record<string, unknown>): string {
  const t = record.thumbnail
  if (!t) return ""
  if (Array.isArray(t)) return t[0] || ""
  return t as string
}

export const blogPagesCollection = {
  async getAll(): Promise<BlogPage[]> {
    const data = await boundedFullList(pb.collection("blog_pages"), {
      sort: "-created",
    })
    return data.map((item) => {
      const author_name = extractAuthorFromRecord(item)
      return {
        id: item.id as string,
        slug: item.slug as string,
        title_en: item.title_en as string,
        title_ar: item.title_ar as string | undefined,
        category: item.category as string,
        content_en: item.content_en as string,
        content_ar: item.content_ar as string | undefined,
        is_published: item.is_published as boolean,
        media: (item.media as string[]) || [],
        thumbnail: extractThumbnail(item),
        author_name,
        created: item.created as string,
        updated: item.updated as string,
      }
    })
  },

  async getBySlug(slug: string): Promise<BlogPage | null> {
    try {
      const data = await pb
        .collection("blog_pages")
        .getFirstListItem(pb.filter("slug = {:value0}", { value0: slug }))
      const author_name = extractAuthorFromRecord(data)
      return {
        id: data.id as string,
        slug: data.slug as string,
        title_en: data.title_en as string,
        title_ar: data.title_ar as string | undefined,
        category: data.category as string,
        content_en: data.content_en as string,
        content_ar: data.content_ar as string | undefined,
        is_published: data.is_published as boolean,
        media: (data.media as string[]) || [],
        thumbnail: extractThumbnail(data),
        author_name,
        created: data.created as string,
        updated: data.updated as string,
      }
    } catch {
      return null
    }
  },

  async getPublishedBySlug(slug: string): Promise<BlogPage | null> {
    try {
      const data = await pb
        .collection("blog_pages")
        .getFirstListItem(pb.filter("slug = {:value0} && is_published = true", { value0: slug }))
      const author_name = extractAuthorFromRecord(data)
      return {
        id: data.id as string,
        slug: data.slug as string,
        title_en: data.title_en as string,
        title_ar: data.title_ar as string | undefined,
        category: data.category as string,
        content_en: data.content_en as string,
        content_ar: data.content_ar as string | undefined,
        is_published: data.is_published as boolean,
        media: (data.media as string[]) || [],
        thumbnail: extractThumbnail(data),
        author_name,
        created: data.created as string,
        updated: data.updated as string,
      }
    } catch {
      return null
    }
  },

  async create(data: {
    slug: string
    title: string
    category?: string
    content_en?: string
    author_name?: string
  }): Promise<BlogPage> {
    const lorem =
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>"
    const result = await pb.collection("blog_pages").create({
      slug: data.slug,
      title_en: data.title,
      category: data.category || "",
      content_en: data.content_en || lorem,
      is_published: false,
      author_name: data.author_name || "",
    })
    const author_name = extractAuthorFromRecord(result)
    return {
      id: result.id as string,
      slug: result.slug as string,
      title_en: result.title_en as string,
      title_ar: result.title_ar as string | undefined,
      category: result.category as string,
      content_en: result.content_en as string,
      content_ar: result.content_ar as string | undefined,
      is_published: result.is_published as boolean,
      media: (result.media as string[]) || [],
      thumbnail: extractThumbnail(result),
      author_name,
      created: result.created as string,
      updated: result.updated as string,
    }
  },

  async update(id: string, data: Partial<BlogPage>): Promise<BlogPage> {
    const result = await pb.collection("blog_pages").update(id, data)
    const author_name = extractAuthorFromRecord(result)
    return {
      id: result.id as string,
      slug: result.slug as string,
      title_en: result.title_en as string,
      title_ar: result.title_ar as string | undefined,
      category: result.category as string,
      content_en: result.content_en as string,
      content_ar: result.content_ar as string | undefined,
      is_published: result.is_published as boolean,
      media: (result.media as string[]) || [],
      thumbnail: extractThumbnail(result),
      author_name,
      created: result.created as string,
      updated: result.updated as string,
    }
  },

  async updateWithFiles(
    id: string,
    data: Partial<BlogPage>,
    files: File[],
    filesToRemove?: string[]
  ): Promise<BlogPage> {
    const formData = new FormData()

    // Preserve existing media files when adding new ones
    if (files.length > 0 && (!filesToRemove || filesToRemove.length === 0)) {
      const existing = await pb.collection("blog_pages").getOne(id)
      if (existing.media && Array.isArray(existing.media)) {
        existing.media.forEach((filename: string) => {
          formData.append("media", filename)
        })
      }
    }

    if (data.title_en !== undefined) formData.append("title_en", data.title_en)
    if (data.title_ar !== undefined) formData.append("title_ar", data.title_ar)
    if (data.slug !== undefined) formData.append("slug", data.slug)
    if (data.category !== undefined) formData.append("category", data.category)
    if (data.content_en !== undefined)
      formData.append("content_en", data.content_en)
    if (data.content_ar !== undefined)
      formData.append("content_ar", data.content_ar)
    if (data.is_published !== undefined)
      formData.append("is_published", String(data.is_published))
    if (data.author_name !== undefined)
      formData.append("author_name", data.author_name)

    files.forEach((file) => {
      formData.append("media", file)
    })

    if (filesToRemove && filesToRemove.length > 0) {
      formData.append("media-", filesToRemove.join(","))
    }

    const result = await pb.collection("blog_pages").update(id, formData)
    return result as unknown as BlogPage
  },

  async updateThumbnail(
    id: string,
    file: File
  ): Promise<BlogPage> {
    const formData = new FormData()
    formData.append("thumbnail", file)
    const result = await pb.collection("blog_pages").update(id, formData)
    return result as unknown as BlogPage
  },

  async removeThumbnail(id: string): Promise<BlogPage> {
    const formData = new FormData()
    formData.append("thumbnail", "")
    const result = await pb.collection("blog_pages").update(id, formData)
    return result as unknown as BlogPage
  },

  async delete(id: string): Promise<void> {
    await pb.collection("blog_pages").delete(id)
  },
}

export const blogCategoriesCollection = {
  async getAll(): Promise<BlogCategory[]> {
    const data = await boundedFullList(pb.collection("blog_categories"), {
      sort: "key",
    })
    return data.map((item) => ({
      id: item.id as string,
      key: item.key as string,
      label_en: item.label_en as string,
      label_ar: item.label_ar as string | undefined,
    }))
  },

  async create(data: {
    key: string
    label_en: string
    label_ar?: string
  }): Promise<BlogCategory> {
    const result = await pb.collection("blog_categories").create(data)
    return {
      id: result.id as string,
      key: result.key as string,
      label_en: result.label_en as string,
      label_ar: result.label_ar as string | undefined,
    }
  },

  async update(
    id: string,
    data: { key?: string; label_en?: string; label_ar?: string }
  ): Promise<BlogCategory> {
    const result = await pb.collection("blog_categories").update(id, data)
    return {
      id: result.id as string,
      key: result.key as string,
      label_en: result.label_en as string,
      label_ar: result.label_ar as string | undefined,
    }
  },

  async delete(id: string): Promise<void> {
    await pb.collection("blog_categories").delete(id)
  },
}

export const caseExpertsCollection = {
  async getAll(): Promise<import("@/types/allocation").CaseExpert[]> {
    return boundedFullList(pb.collection("case_experts"), {
      expand: "expert_id",
    })
  },

  async getByCase(caseId: string): Promise<import("@/types/allocation").CaseExpert[]> {
    return boundedFullList(pb.collection("case_experts"), {
      filter: pb.filter("case_id = {:value0}", { value0: caseId }),
      expand: "expert_id",
    })
  },

  async getByExpert(expertId: string): Promise<import("@/types/allocation").CaseExpert[]> {
    return boundedFullList(pb.collection("case_experts"), {
      filter: pb.filter("expert_id = {:value0}", { value0: expertId }),
      expand: "case_id",
    })
  },

  async getByCaseAndExpert(
    caseId: string,
    expertId: string
  ): Promise<import("@/types/allocation").CaseExpert | null> {
    try {
      const record = await pb
        .collection("case_experts")
        .getFirstListItem(
          `case_id = "${caseId}" && expert_id = "${expertId}"`,
          { expand: "expert_id" }
        )
      return record as unknown as import("@/types/allocation").CaseExpert
    } catch {
      return null
    }
  },

  async create(
    data: Partial<import("@/types/allocation").CaseExpert>
  ): Promise<import("@/types/allocation").CaseExpert> {
    return pb.collection("case_experts").create(data)
  },

  async update(
    id: string,
    data: Partial<import("@/types/allocation").CaseExpert>
  ): Promise<import("@/types/allocation").CaseExpert> {
    return pb.collection("case_experts").update(id, data)
  },

  async delete(id: string): Promise<void> {
    await pb.collection("case_experts").delete(id)
  },
}

export const rolesManagementCollection = {
  async getAll(): Promise<import("@/types/expert-role").RolesManagement[]> {
    return boundedFullList(pb.collection("roles_management"), {
      expand: "tool_types",
    })
  },

  async getById(
    id: string
  ): Promise<import("@/types/expert-role").RolesManagement> {
    return pb.collection("roles_management").getOne(id, {
      expand: "tool_types",
    })
  },

  async update(
    id: string,
    data: Partial<import("@/types/expert-role").RolesManagement>
  ): Promise<import("@/types/expert-role").RolesManagement> {
    return pb.collection("roles_management").update(id, data)
  },

  async create(data: {
    role_name_en: string
    role_name_ar: string
    tool_types?: string[]
  }): Promise<import("@/types/expert-role").RolesManagement> {
    return pb.collection("roles_management").create(data)
  },

  async delete(id: string): Promise<void> {
    await pb.collection("roles_management").delete(id)
  },

  async getByName(
    roleNameEn: string
  ): Promise<import("@/types/expert-role").RolesManagement | null> {
    try {
      const record = await pb
        .collection("roles_management")
        .getFirstListItem(pb.filter("role_name_en = {:value0}", { value0: roleNameEn }), {
          expand: "tool_types",
        })
      return record as unknown as import("@/types/expert-role").RolesManagement
    } catch {
      return null
    }
  },
}

// Rename the role stored on existing case allocations when a role's English name changes
export async function renameRoleInAllocations(
  oldNameEn: string,
  newNameEn: string
): Promise<void> {
  if (!oldNameEn || !newNameEn || oldNameEn === newNameEn) return
  const records = await boundedFullList(pb.collection("case_experts"), {
    filter: pb.filter("role = {:value0}", { value0: oldNameEn }),
  })
  await Promise.all(
    records.map((record) =>
      pb.collection("case_experts").update(record.id, { role: newNameEn })
    )
  )
}

// Get allowed tool type IDs for a given expert role (matched by role_name_en)
export async function getAllowedToolTypesForRole(
  roleNameEn: string
): Promise<string[]> {
  const role = await rolesManagementCollection.getByName(roleNameEn)
  return role?.tool_types || []
}

// Get union of allowed tool type IDs for an expert across all their assigned cases/roles
export async function getAllowedToolTypesForExpert(
  expertId: string
): Promise<string[]> {
  const caseExperts = await caseExpertsCollection.getByExpert(expertId)
  const roleNamesEn = [
    ...new Set(caseExperts.map((ce) => ce.role).filter(Boolean)),
  ]
  const allowedSets = await Promise.all(
    roleNamesEn.map((roleName) => getAllowedToolTypesForRole(roleName as string))
  )
  return [...new Set(allowedSets.flat())]
}

// Get union of allowed tool type IDs for all experts assigned to a case
export async function getAllowedToolTypesForCase(
  caseId: string
): Promise<string[]> {
  const caseExperts = await caseExpertsCollection.getByCase(caseId)
  const roleNamesEn = [
    ...new Set(caseExperts.map((ce) => ce.role).filter(Boolean)),
  ]

  const allowedSets = await Promise.all(
    roleNamesEn.map((roleName) => getAllowedToolTypesForRole(roleName as string))
  )

  return [...new Set(allowedSets.flat())]
}

export { handlePocketBaseError }
export type { User, Tool, Profile, CaseTool }
