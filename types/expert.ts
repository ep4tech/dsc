export interface ExpertProfile {
  id: string
  user: string
  profile_photo?: string
  country_of_residence?: string
  city?: string
  whatsapp_country_code?: string
  whatsapp_number?: string
  highest_academic_degree?: string
  degree_title?: string
  field_of_study?: string
  age_group?: string[] | string
  /** Multi-select values; older rows may hold a single free-text entry. */
  specialization_type?: string[] | string
  consultation_mode?: string
  fee?: string | number
  availability?: string
  bio?: string
  short_bio_en?: string
  public_name_en?: string
  public_name_ar?: string
  public_qualification_en?: string
  public_qualification_ar?: string
  public_specialty_en?: string
  public_specialty_ar?: string
  short_bio_ar?: string
  cv?: string[] | string
  created?: string
  updated?: string
}

/**
 * The editable shape of an expert profile. Files are tracked separately from
 * the stored filenames so an edit can keep, add, or remove documents before a
 * single save.
 */
export interface ExpertProfileDraft {
  name: string
  countryOfResidence: string
  city: string
  whatsappCountryCode: string
  whatsappNumber: string
  highestAcademicDegree: string
  degreeTitle: string
  fieldOfStudy: string
  ageGroup: string[]
  /** Values for the `specialization_type` multi-select field. */
  specialization: string[]
  consultationMode: string
  fee: string
  availability: string
  bio: string
  shortBioEn: string
  publicNameEn: string
  publicNameAr: string
  publicQualificationEn: string
  publicQualificationAr: string
  publicSpecialtyEn: string
  publicSpecialtyAr: string
  shortBioAr: string
  /** A freshly picked profile photo, replacing the stored one on save. */
  newPhoto: File | null
  /** Whether the stored profile photo should be cleared on save. */
  removePhoto: boolean
  /** Stored CV filenames to preserve. */
  keptCv: string[]
  /** Newly picked CV files to upload. */
  newCv: File[]
}
