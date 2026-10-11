"use client"

import {
  BookOpen,
  Briefcase,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquareText,
  Paperclip,
  Pencil,
  Phone,
  User as UserIcon,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format-date"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import {
  ageGroupLabel,
  consultationModeLabel,
  countryLabel,
} from "@/lib/expert-options"
import { degreeLabel, specializationLabel } from "@/components/team/team-labels"
import {
  dash,
  EMPTY_DASH,
  fieldText as text,
  InfoRow,
  ProfileHero,
  SectionCard,
  TagList,
} from "@/components/profile/ProfilePrimitives"
import {
  profileFileUrl,
  profilePhotoName,
  toStringList,
} from "@/hooks/useExpertProfile"
import type { ExpertProfile } from "@/types/expert"

interface ExpertProfileViewProps {
  name: string
  email: string
  profile: ExpertProfile | null
  fileToken: string
  onEdit?: () => void
  /** Overrides the heading when shown to someone other than the expert. */
  title?: string
  subtitle?: string
  /** Hides the heading row entirely, for embedding in another page. */
  hideHeading?: boolean
  /** Hero caption for the creation date. */
  memberSinceLabel?: string
}

export function ExpertProfileView({
  name,
  email,
  profile,
  fileToken,
  onEdit,
  title,
  subtitle,
  hideHeading,
  memberSinceLabel,
}: ExpertProfileViewProps) {
  const { lang } = useLang()

  const fileUrl = (filename: string) =>
    profileFileUrl(profile, filename, fileToken)

  const photo = profilePhotoName(profile)
  const photoUrl = profileFileUrl(profile, photo, fileToken)
  const cvFiles = toStringList(profile?.cv)
  // Stored values may be enum keys or free text, so resolve through the label
  // map and fall back for genuine prose. Kept as raw/display pairs so React
  // keys stay unique even when two stored values share a label.
  const specializationEntries = toStringList(profile?.specialization_type).map(
    (value) => ({ raw: value, label: specializationLabel(value, lang) })
  )
  const specializationLabels = specializationEntries.map((item) => item.label)
  const degree = text(profile?.highest_academic_degree)
  const consultationMode = text(profile?.consultation_mode)
  const city = text(profile?.city)
  const country = countryLabel(text(profile?.country_of_residence), lang)
  const whatsapp = text(profile?.whatsapp_number)
  const whatsappCode = text(profile?.whatsapp_country_code)
  const location = [city, country].filter(Boolean).join(", ")
  const fieldOfStudy = text(profile?.field_of_study)

  return (
    <div className="space-y-6">
      {!hideHeading && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {title ?? t({ en: "My Profile", ar: "ملفي الشخصي" }, lang)}
            </h1>
            <p className="text-muted-foreground">
              {subtitle ??
                t(
                  {
                    en: "Review the details you submitted when you applied.",
                    ar: "راجع البيانات التي أدخلتها عند التقديم.",
                  },
                  lang
                )}
            </p>
          </div>
          {onEdit && !hideHeading && (
            <Button onClick={onEdit}>
              <Pencil className="me-2 h-4 w-4" />
              {t({ en: "Edit Profile", ar: "تعديل الملف" }, lang)}
            </Button>
          )}
        </div>
      )}

      {/* Hero */}
      <ProfileHero
        name={name}
        photoUrl={photoUrl}
        action={
          onEdit && hideHeading ? (
            <Button
              onClick={onEdit}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Pencil className="me-2 h-4 w-4" />
              {t({ en: "Edit Profile", ar: "تعديل الملف" }, lang)}
            </Button>
          ) : undefined
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <bdi dir="ltr">{email}</bdi>
            </span>
            {location && (
              <>
                <span aria-hidden className="opacity-50">
                  |
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              </>
            )}
          </>
        }
        chip={
          degree || fieldOfStudy
            ? [degree ? degreeLabel(degree, lang) : "", fieldOfStudy]
                .filter(Boolean)
                .join(" · ")
            : ""
        }
        badges={specializationEntries.map((item) => ({
          key: item.raw,
          label: item.label,
        }))}
        footer={
          profile?.created ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-white/75">
              <CalendarClock className="h-3.5 w-3.5" />
              {memberSinceLabel ??
                t({ en: "Member since", ar: "عضو منذ" }, lang)}{" "}
              {formatDate(profile.created)}
            </p>
          ) : null
        }
      />

      {/* Contact */}
      <SectionCard
        icon={UserIcon}
        title={t(
          { en: "Personal & Contact", ar: "البيانات الشخصية والتواصل" },
          lang
        )}
        description={t(
          {
            en: "How clients can reach you",
            ar: "كيف يمكن للعملاء التواصل معك",
          },
          lang
        )}
      >
        <InfoRow
          icon={Mail}
          label={t({ en: "Email", ar: "البريد الإلكتروني" }, lang)}
        >
          <bdi dir="ltr">{email}</bdi>
        </InfoRow>
        <InfoRow
          icon={Globe}
          label={t({ en: "Country of Residence", ar: "بلد الإقامة" }, lang)}
        >
          {dash(country)}
        </InfoRow>
        <InfoRow
          icon={MapPin}
          label={t({ en: "City of Residence", ar: "مدينة الإقامة" }, lang)}
        >
          {dash(city)}
        </InfoRow>
        <InfoRow
          icon={Phone}
          label={t({ en: "WhatsApp Number", ar: "رقم الواتساب" }, lang)}
        >
          {whatsapp
            ? `${whatsappCode ? `${whatsappCode} ` : ""}${whatsapp}`
            : EMPTY_DASH}
        </InfoRow>
      </SectionCard>

      {/* Academic */}
      <SectionCard
        icon={GraduationCap}
        title={t({ en: "Academic Background", ar: "الخلفية العلمية" }, lang)}
        description={t(
          { en: "Your qualifications", ar: "مؤهلاتك العلمية" },
          lang
        )}
      >
        <InfoRow
          icon={GraduationCap}
          label={t(
            { en: "Highest Academic Degree", ar: "أعلى مؤهل أكاديمي" },
            lang
          )}
        >
          {degree ? degreeLabel(degree, lang) : EMPTY_DASH}
        </InfoRow>
        <InfoRow
          icon={BookOpen}
          label={t({ en: "Degree Title", ar: "عنوان الشهادة" }, lang)}
        >
          {dash(text(profile?.degree_title))}
        </InfoRow>
        <InfoRow
          icon={BookOpen}
          label={t({ en: "Field of Study", ar: "مجال الدراسة" }, lang)}
        >
          {dash(fieldOfStudy)}
        </InfoRow>
      </SectionCard>

      {/* Professional */}
      <SectionCard
        icon={Briefcase}
        title={t({ en: "Professional Details", ar: "البيانات المهنية" }, lang)}
        description={t(
          {
            en: "What you offer and when you are available",
            ar: "ما تقدمه ومتى تكون متاحاً",
          },
          lang
        )}
      >
        <InfoRow
          icon={UserIcon}
          label={t(
            { en: "Field of Service Provision", ar: "مجال تقديم الخدمات" },
            lang
          )}
        >
          {specializationLabels.length > 0 ? (
            specializationLabels.join(", ")
          ) : (
            <span className="text-muted-foreground">{EMPTY_DASH}</span>
          )}
        </InfoRow>
        <InfoRow
          icon={UserIcon}
          label={t({ en: "Age Group", ar: "الفئة العمرية" }, lang)}
        >
          <TagList
            values={toStringList(profile?.age_group).map((item) =>
              ageGroupLabel(item, lang)
            )}
          />
        </InfoRow>
        <InfoRow
          icon={Globe}
          label={t({ en: "Consultation Mode", ar: "وضع الاستشارة" }, lang)}
        >
          {consultationMode
            ? consultationModeLabel(consultationMode, lang)
            : EMPTY_DASH}
        </InfoRow>
        <InfoRow
          icon={Wallet}
          label={t({ en: "First Session Fee", ar: "رسوم الجلسة الأولى" }, lang)}
        >
          {dash(text(profile?.fee))}
        </InfoRow>
        <InfoRow
          icon={CalendarClock}
          label={t({ en: "Availability", ar: "أوقات التوفر" }, lang)}
        >
          {dash(text(profile?.availability))}
        </InfoRow>
        <InfoRow
          icon={Briefcase}
          label={t({ en: "Documents", ar: "المستندات" }, lang)}
        >
          {cvFiles.length === 0 ? (
            <span className="text-muted-foreground">{EMPTY_DASH}</span>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cvFiles.map((filename) => (
                <a
                  key={filename}
                  href={fileUrl(filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{filename}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>
              ))}
            </div>
          )}
        </InfoRow>
      </SectionCard>

      {/* About */}
      <Card className="gap-4 py-5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-4 w-4" />
            </span>
            <CardTitle>{t({ en: "About Me", ar: "نبذة عني" }, lang)}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {text(
            lang === "ar" ? profile?.short_bio_ar : profile?.short_bio_en
          ).trim() ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {text(
                lang === "ar" ? profile?.short_bio_ar : profile?.short_bio_en
              )}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t(
                  {
                    en: "You have not added a short biography in this language yet.",
                    ar: "لم تقم بإضافة نبذة قصيرة بهذه اللغة بعد.",
                  },
                  lang
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {photo && (
        <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {t(
              { en: "View full-size photo", ar: "عرض الصورة بالحجم الكامل" },
              lang
            )}
          </a>
        </p>
      )}
    </div>
  )
}
