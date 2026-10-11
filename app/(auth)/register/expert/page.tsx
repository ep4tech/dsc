import { ExpertApplicationForm } from "@/components/register/ExpertApplicationForm"
import { RegistrationHeading } from "@/components/register/RegistrationHeading"

export default function ExpertRegisterPage() {
  return (
    <div className="space-y-6">
      <RegistrationHeading
        title={{ en: "Apply as Expert", ar: "التقديم كخبير" }}
      />
      <ExpertApplicationForm />
    </div>
  )
}
