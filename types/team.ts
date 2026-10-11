export interface TeamExpert {
  id: string
  name: string
  photoUrl: string | null
  roles: string[]
  degree: string | null
  fieldOfStudy: string | null
  bio: string
  shortBioEn?: string
  publicNameEn?: string
  publicNameAr?: string
  publicQualificationEn?: string
  publicQualificationAr?: string
  publicSpecialtyEn?: string
  publicSpecialtyAr?: string
  shortBioAr?: string
}
