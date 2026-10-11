import { boundedFullList } from "@/lib/bounded-records"
import pb from "./pb"
import type {
  Lecture,
  LectureRegistration,
  CreateLectureInput,
  UpdateLectureInput,
} from "@/types/lecture"

const LECTURES_COLLECTION = "public_lectures"
const REGISTRATIONS_COLLECTION = "event_registrations"
const PUBLIC_LECTURES_PUBLIC_COLLECTION = "public_lectures_public"

// ---------------------------------------------------------------------------
// Transformers: between PocketBase flat/snake-case and app nested/camelCase
// ---------------------------------------------------------------------------

function getThumbnailUrl(record: Record<string, unknown>): string | undefined {
  const thumbnail = record.thumbnail
  if (!thumbnail) return undefined
  if (Array.isArray(thumbnail) && thumbnail.length > 0) {
    return pb.files.getUrl(record as never, thumbnail[0] as string)
  }
  return undefined
}

export function lectureFromDB(record: Record<string, unknown>): Lecture {
  return {
    id: record.id as string,
    title: record.title as Lecture["title"],
    description: record.description as Lecture["description"],
    speaker: record.speaker as Lecture["speaker"],
    schedule: record.schedule as Lecture["schedule"],
    duration: record.duration as number,
    meetingLink: (record.meeting_link as string) || undefined,
    recordingUrl: (record.recording_url as string) || undefined,
    currentRegistrations: (record.current_registrations as number) || 0,
    is_public: record.is_public as boolean,
    thumbnail: getThumbnailUrl(record),
    status: record.status as Lecture["status"],
    created: record.created as string,
    updated: record.updated as string,
  }
}

function lectureToDB(
  data: Partial<CreateLectureInput | UpdateLectureInput>
): Record<string, unknown> {
  const dbData: Record<string, unknown> = {}

  if (data.title !== undefined) dbData.title = data.title
  if (data.description !== undefined) dbData.description = data.description
  if (data.speaker !== undefined) dbData.speaker = data.speaker
  if (data.schedule !== undefined) dbData.schedule = data.schedule
  if (data.duration !== undefined) dbData.duration = data.duration
  if (data.meetingLink !== undefined) dbData.meeting_link = data.meetingLink
  if (data.recordingUrl !== undefined) dbData.recording_url = data.recordingUrl
  if (data.is_public !== undefined) dbData.is_public = data.is_public
  if (data.status !== undefined) dbData.status = data.status

  return dbData
}

function buildLectureFormData(
  data: Partial<CreateLectureInput | UpdateLectureInput>,
  file?: File
): FormData {
  const formData = new FormData()
  const dbData = lectureToDB(data)

  Object.entries(dbData).forEach(([key, value]) => {
    if (value === undefined) return
    if (typeof value === "string") {
      formData.append(key, value)
    } else {
      // JSON fields (title, description, speaker, schedule)
      formData.append(key, JSON.stringify(value))
    }
  })

  if (file) {
    formData.append("thumbnail", file)
  }

  return formData
}

export function registrationFromDB(
  record: Record<string, unknown>
): LectureRegistration {
  return {
    id: record.id as string,
    lectureId: (record.lecture_id as string) || (record.lectureId as string),
    userId: (record.user_id as string) || (record.userId as string),
    userName: (record.user_name as string) || "",
    email: (record.email as string) || "",
    phone: (record.phone as string) || undefined,
    registeredAt: (record.registered_at as string) || (record.created as string),
    notes: (record.notes as string) || undefined,
    status: record.status as LectureRegistration["status"],
  }
}

function registrationToDB(
  data: Partial<LectureRegistration>
): Record<string, unknown> {
  const dbData: Record<string, unknown> = {}

  if (data.lectureId !== undefined) dbData.lecture_id = data.lectureId
  if (data.userId !== undefined) dbData.user_id = data.userId
  if (data.userName !== undefined) dbData.user_name = data.userName
  if (data.email !== undefined) dbData.email = data.email
  if (data.phone !== undefined) dbData.phone = data.phone
  if (data.registeredAt !== undefined)
    dbData.registered_at = data.registeredAt
  if (data.notes !== undefined) dbData.notes = data.notes
  if (data.status !== undefined) dbData.status = data.status

  return dbData
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

export const lecturesCollection = {
  async getAll(): Promise<Lecture[]> {
    const data = await boundedFullList(pb.collection(LECTURES_COLLECTION), {
      sort: "-created",
    })
    console.log(data)
    return data.map((item) => lectureFromDB(item as unknown as Record<string, unknown>))
  },

  async getPublished(): Promise<Lecture[]> {
    const data = await boundedFullList(pb.collection(LECTURES_COLLECTION), {
      filter: 'status = "published"',
      sort: "schedule.dateTime",
    })
    return data.map((item) => lectureFromDB(item as unknown as Record<string, unknown>))
  },

  async getById(id: string): Promise<Lecture> {
    const data = await pb.collection(LECTURES_COLLECTION).getOne(id)
    return lectureFromDB(data as unknown as Record<string, unknown>)
  },

  async create(data: CreateLectureInput, file?: File): Promise<Lecture> {
    const result = file
      ? await pb
          .collection(LECTURES_COLLECTION)
          .create(buildLectureFormData(data, file))
      : await pb.collection(LECTURES_COLLECTION).create(lectureToDB(data))
    return lectureFromDB(result as unknown as Record<string, unknown>)
  },

  async update(
    id: string,
    data: UpdateLectureInput,
    file?: File
  ): Promise<Lecture> {
    const result = file
      ? await pb
          .collection(LECTURES_COLLECTION)
          .update(id, buildLectureFormData(data, file))
      : await pb.collection(LECTURES_COLLECTION).update(id, lectureToDB(data))
    return lectureFromDB(result as unknown as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(LECTURES_COLLECTION).delete(id)
  },

  async incrementRegistrations(id: string, delta: number): Promise<void> {
    const existing = await pb.collection(LECTURES_COLLECTION).getOne(id)
    const current = (existing.current_registrations as number) || 0
    await pb
      .collection(LECTURES_COLLECTION)
      .update(id, { current_registrations: Math.max(0, current + delta) })
  },
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export const lectureRegistrationsCollection = {
  async getAll(): Promise<LectureRegistration[]> {
    const data = await boundedFullList(pb.collection(REGISTRATIONS_COLLECTION), {
      sort: "-created",
    })
    return data.map((item) =>
      registrationFromDB(item as unknown as Record<string, unknown>)
    )
  },

  async getByLecture(lectureId: string): Promise<LectureRegistration[]> {
    const data = await boundedFullList(pb.collection(REGISTRATIONS_COLLECTION), {
      filter: pb.filter("lecture_id = {:value0}", { value0: lectureId }),
      sort: "-created",
    })
    return data.map((item) =>
      registrationFromDB(item as unknown as Record<string, unknown>)
    )
  },

  async getByUser(userId: string): Promise<LectureRegistration[]> {
    const data = await boundedFullList(pb.collection(REGISTRATIONS_COLLECTION), {
      filter: pb.filter("user_id = {:value0}", { value0: userId }),
      sort: "-created",
    })
    return data.map((item) =>
      registrationFromDB(item as unknown as Record<string, unknown>)
    )
  },

  async create(data: Partial<LectureRegistration>): Promise<LectureRegistration> {
    const result = await pb
      .collection(REGISTRATIONS_COLLECTION)
      .create(registrationToDB(data))
    return registrationFromDB(result as unknown as Record<string, unknown>)
  },

  async update(
    id: string,
    data: Partial<LectureRegistration>
  ): Promise<LectureRegistration> {
    const result = await pb
      .collection(REGISTRATIONS_COLLECTION)
      .update(id, registrationToDB(data))
    return registrationFromDB(result as unknown as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(REGISTRATIONS_COLLECTION).delete(id)
  },
}

// ---------------------------------------------------------------------------
// Public Lectures Public
// ---------------------------------------------------------------------------

export const publicLecturesPublicCollection = {
  async getAll(): Promise<Lecture[]> {
    const data = await boundedFullList(pb.collection(PUBLIC_LECTURES_PUBLIC_COLLECTION), {
      sort: "-created",
    })
    return data.map((item) => lectureFromDB(item as unknown as Record<string, unknown>))
  },

  async getById(id: string): Promise<Lecture> {
    const data = await pb.collection(PUBLIC_LECTURES_PUBLIC_COLLECTION).getOne(id)
    return lectureFromDB(data as unknown as Record<string, unknown>)
  },
}
