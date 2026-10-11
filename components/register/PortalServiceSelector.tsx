"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { t } from "@/lib/i18n"
import { useLang } from "@/lib/lang-context"
import { usePortals } from "@/hooks/usePortals"
import type { Portal } from "@/lib/portals"

const OTHER_VALUE = "other"

function getPortalLabel(portal: Portal, lang: "en" | "ar"): string {
  if (lang === "ar") {
    return portal.portalName.ar.replace(/^بوابة /, "")
  }
  return portal.title.en
}

export interface PortalServiceValue {
  categoryId: string
  subCategoryId: string
  customCategory: string
  customSubCategory: string
}

interface PortalServiceSelectorProps {
  value?: PortalServiceValue
  onChange: (value: PortalServiceValue) => void
  required?: boolean
  /** "text" (default) renders a free-text input, "select" a portal-service dropdown. */
  issueTypeMode?: "select" | "text"
}

export function PortalServiceSelector({
  value = { categoryId: "", subCategoryId: "", customCategory: "", customSubCategory: "" },
  onChange,
  required = false,
  issueTypeMode = "text",
}: PortalServiceSelectorProps) {
  const { lang } = useLang()
  const { portals: PORTALS, isLoading, error, reload } = usePortals()
  const getPortalById = (id: string) => PORTALS.find((portal) => portal.id === id)

  const { categoryId, subCategoryId, customCategory, customSubCategory } = value

  const portal = getPortalById(categoryId)
  const services = portal?.services || []

  const isCustomCategory = categoryId === OTHER_VALUE
  const isCustomSubCategory = subCategoryId === OTHER_VALUE

  const handleCategoryChange = (newCategoryId: string) => {
    onChange({
      categoryId: newCategoryId,
      subCategoryId: "",
      customCategory: newCategoryId === OTHER_VALUE ? customCategory : "",
      customSubCategory: "",
    })
  }

  const handleSubCategoryChange = (newSubCategoryId: string) => {
    onChange({
      ...value,
      subCategoryId: newSubCategoryId,
      customSubCategory: newSubCategoryId === OTHER_VALUE ? customSubCategory : "",
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          {t({ en: "Service Type", ar: "نوع الخدمة" }, lang)}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select disabled={isLoading} value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue
              placeholder={t(
                { en: "Select service type", ar: "اختر نوع الخدمة" },
                lang
              )}
            />
          </SelectTrigger>
          <SelectContent position="popper" className="max-w-45!">
            {PORTALS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {getPortalLabel(p, lang)}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_VALUE}>
              {t({ en: "Other", ar: "أخرى" }, lang)}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{lang === "ar" ? "تعذر تحميل البوابات." : "Unable to load portals."} <button type="button" className="underline" onClick={() => void reload()}>{lang === "ar" ? "إعادة المحاولة" : "Retry"}</button></p>}
      {isCustomCategory && (
        <div className="space-y-2">
          <Label>
            {t(
              { en: "Custom service type", ar: "اسم نوع الخدمة المخصص" },
              lang
            )}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            value={customCategory}
            onChange={(e) =>
              onChange({ ...value, customCategory: e.target.value })
            }
            placeholder={t(
              { en: "Enter service type", ar: "أدخل اسم نوع الخدمة" },
              lang
            )}
          />
        </div>
      )}

      {categoryId && (
        <div className="space-y-2">
          <Label>
            {t({ en: "Issue Type", ar: "نوع المشكلة" }, lang)}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {issueTypeMode === "text" ? (
            <Input
              value={subCategoryId}
              onChange={(e) =>
                onChange({
                  ...value,
                  subCategoryId: e.target.value,
                  customSubCategory: "",
                })
              }
              placeholder={t(
                { en: "Enter issue type", ar: "أدخل اسم نوع المشكلة" },
                lang
              )}
            />
          ) : (
            <Select value={subCategoryId} onValueChange={handleSubCategoryChange}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    { en: "Select issue type", ar: "اختر نوع المشكلة" },
                    lang
                  )}
                />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60! max-w-40">
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {t(s.name, lang)}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_VALUE}>
                  {t({ en: "Other", ar: "أخرى" }, lang)}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {issueTypeMode === "select" && isCustomSubCategory && (
        <div className="space-y-2">
          <Label>
            {t(
              { en: "Custom issue type", ar: "اسم نوع المشكلة المخصص" },
              lang
            )}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            value={customSubCategory}
            onChange={(e) =>
              onChange({ ...value, customSubCategory: e.target.value })
            }
            placeholder={t(
              { en: "Enter issue type", ar: "أدخل اسم نوع المشكلة" },
              lang
            )}
          />
        </div>
      )}
    </div>
  )
}
