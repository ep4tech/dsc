type Localized = { en: string; ar: string }
type JourneyStep = Localized & { detail: Localized }
type RegistrationRole = {
  key: "parent" | "individual" | "organization" | "expert"
  name: Localized
  registerAs: string
  description: Localized
  imageAlt: Localized
  steps: JourneyStep[]
}
const step = (
  en: string,
  ar: string,
  detailEn: string,
  detailAr: string
): JourneyStep => ({ en, ar, detail: { en: detailEn, ar: detailAr } })

export const registrationRoles: RegistrationRole[] = [
  {
    key: "parent",
    name: { en: "Parent", ar: "ولي أمر" },
    registerAs: "كولي أمر",
    description: {
      en: "Register as a parent to access programmes, events and resources to support your child's development.",
      ar: "سجّل كولي أمر للوصول إلى البرامج والفعاليات والموارد التي تدعم نمو طفلك وتطوره.",
    },
    imageAlt: {
      en: "A father supporting his child as they learn together",
      ar: "أب يدعم طفله أثناء التعلم معاً",
    },
    steps: [
      step(
        "Create Account",
        "إنشاء حساب",
        "Start with your contact details and a secure password.",
        "ابدأ ببيانات التواصل وكلمة مرور آمنة."
      ),
      step(
        "Add Your Child’s Information",
        "إضافة معلومات طفلك",
        "Share your child's details to help identify appropriate support.",
        "أضف بيانات طفلك للمساعدة في تحديد الدعم المناسب."
      ),
      step(
        "Browse & Register for Programmes",
        "استعراض البرامج والتسجيل فيها",
        "Explore available programmes and their registration requirements.",
        "تعرّف على البرامج المتاحة ومتطلبات التسجيل فيها."
      ),
      step(
        "Complete Assessment",
        "إكمال التقييم",
        "Where needed, an assessment helps clarify your child's needs.",
        "يساعد التقييم عند الحاجة في توضيح احتياجات طفلك."
      ),
      step(
        "Choose Individual Plan",
        "اختيار الخطة الفردية",
        "Discuss suitable goals and a plan with the support team.",
        "ناقش الأهداف المناسبة والخطة مع فريق الدعم."
      ),
      step(
        "Access Intervention",
        "الحصول على التدخل",
        "Take part in the support recommended in your child's plan.",
        "شارك في الدعم الموصى به ضمن خطة طفلك."
      ),
      step(
        "Follow-up",
        "المتابعة",
        "Review progress with the team and discuss any changes needed.",
        "راجع التقدم مع الفريق وناقش التعديلات المطلوبة."
      ),
      step(
        "View Outcomes",
        "الاطلاع على النتائج",
        "Reflect on progress and agree on the next steps.",
        "اطّلع على التقدم واتفق على الخطوات التالية."
      ),
    ],
  },
  {
    key: "individual",
    name: { en: "Individual", ar: "فرد" },
    registerAs: "كفرد",
    description: {
      en: "Register as an individual to join programmes and events for personal development.",
      ar: "سجّل كفرد للانضمام إلى البرامج والفعاليات التي تدعم تطورك الشخصي.",
    },
    imageAlt: {
      en: "An individual learning and working on a laptop",
      ar: "شخص يتعلم ويعمل على حاسوب محمول",
    },
    steps: [
      step(
        "Create Account",
        "إنشاء حساب",
        "Register with your details and a secure password.",
        "سجّل بياناتك واختر كلمة مرور آمنة."
      ),
      step(
        "Complete Your Profile",
        "إكمال ملفك الشخصي",
        "Add the information needed for your participation.",
        "أضف المعلومات اللازمة لمشاركتك."
      ),
      step(
        "Browse & Register for Programmes",
        "استعراض البرامج والتسجيل فيها",
        "Find a programme that fits your interests and check its requirements.",
        "ابحث عن برنامج يناسب اهتماماتك واطّلع على متطلباته."
      ),
      step(
        "Attend Events & Lectures",
        "حضور الفعاليات والمحاضرات",
        "Check the dates and attendance details for your chosen events.",
        "راجع مواعيد الفعاليات التي اخترتها وتفاصيل الحضور."
      ),
      step(
        "Access Resources & Articles",
        "الوصول إلى الموارد والمقالات",
        "Explore learning resources and articles to support your development.",
        "استكشف الموارد التعليمية والمقالات التي تدعم تطورك."
      ),
      step(
        "Manage Your Bookings",
        "إدارة حجوزاتك",
        "Keep track of your registrations and booking details.",
        "تابع تسجيلاتك وتفاصيل حجوزاتك."
      ),
      step(
        "Track Your Progress",
        "متابعة تقدمك",
        "Review your learning and participation over time.",
        "راجع تعلمك ومشاركاتك بمرور الوقت."
      ),
      step(
        "Get Certificates",
        "الحصول على الشهادات",
        "Receive certificates where offered after meeting programme requirements.",
        "احصل على الشهادات في البرامج التي توفرها بعد استيفاء متطلباتها."
      ),
    ],
  },
  {
    key: "organization",
    name: { en: "Organization", ar: "مؤسسة" },
    registerAs: "كمؤسسة",
    description: {
      en: "Register your organization to enroll in programmes, manage participants and work with us.",
      ar: "سجّل مؤسستك للالتحاق بالبرامج وإدارة المشاركين والتعاون معنا.",
    },
    imageAlt: {
      en: "A modern glass office building",
      ar: "مبنى مكاتب حديث بواجهة زجاجية",
    },
    steps: [
      step(
        "Create Account",
        "إنشاء حساب",
        "Register your organization and its main contact.",
        "سجّل مؤسستك وبيانات مسؤول التواصل."
      ),
      step(
        "Complete Organization Profile",
        "إكمال ملف المؤسسة",
        "Provide relevant organization details and areas of interest.",
        "أضف بيانات المؤسسة ومجالات اهتمامها."
      ),
      step(
        "Verification",
        "التحقق",
        "The team may review the information and request supporting documents.",
        "قد يراجع الفريق البيانات ويطلب مستندات داعمة."
      ),
      step(
        "Partnership",
        "الشراكة",
        "Discuss shared goals and suitable partnership opportunities.",
        "ناقش الأهداف المشتركة وفرص الشراكة المناسبة."
      ),
      step(
        "Collaboration",
        "التعاون",
        "Coordinate the scope and responsibilities with the DSC team.",
        "نسّق نطاق العمل والمسؤوليات مع فريق DSC."
      ),
      step(
        "Implementation",
        "التنفيذ",
        "Put the agreed activities and programmes into action.",
        "ابدأ تنفيذ الأنشطة والبرامج المتفق عليها."
      ),
      step(
        "Evaluation",
        "التقييم",
        "Review the results against your agreed goals.",
        "راجع النتائج مقارنة بالأهداف المتفق عليها."
      ),
      step(
        "Continuity",
        "الاستمرارية",
        "Discuss future collaboration and ongoing support.",
        "ناقش التعاون المستقبلي والدعم المستمر."
      ),
    ],
  },
  {
    key: "expert",
    name: { en: "Expert", ar: "خبير" },
    registerAs: "كخبير",
    description: {
      en: "Register as an expert to offer your services, participate in programmes and share your knowledge.",
      ar: "سجّل كخبير لتقديم خدماتك والمشاركة في البرامج ومشاركة معرفتك.",
    },
    imageAlt: {
      en: "A male professional expert holding a tablet",
      ar: "خبير يحمل جهازاً لوحياً",
    },
    steps: [
      step(
        "Create Account",
        "إنشاء حساب",
        "Register your contact details to begin your expert application.",
        "سجّل بيانات التواصل لبدء طلب الانضمام كخبير."
      ),
      step(
        "Complete Your Professional Profile",
        "إكمال ملفك المهني",
        "Share your qualifications, experience and specializations.",
        "أضف مؤهلاتك وخبراتك وتخصصاتك."
      ),
      step(
        "Verification",
        "التحقق",
        "The team reviews professional information and supporting documents.",
        "يراجع الفريق المعلومات المهنية والمستندات الداعمة."
      ),
      step(
        "Approval",
        "الموافقة",
        "Receive the team's decision after the review process.",
        "تلقّ قرار الفريق بعد استكمال المراجعة."
      ),
      step(
        "Assignment",
        "التكليف",
        "Discuss suitable opportunities based on your expertise and availability.",
        "ناقش الفرص المناسبة وفقاً لخبرتك ومدى تفرغك."
      ),
      step(
        "Service",
        "تقديم الخدمة",
        "Deliver the agreed services or programme activities.",
        "قدّم الخدمات أو أنشطة البرامج المتفق عليها."
      ),
      step(
        "Follow-up",
        "المتابعة",
        "Review feedback and coordinate any follow-up with the team.",
        "راجع الملاحظات ونسّق المتابعة مع الفريق."
      ),
      step(
        "Payment",
        "المستحقات",
        "Confirm payment details according to the agreed terms.",
        "أكّد تفاصيل المستحقات وفقاً للشروط المتفق عليها."
      ),
    ],
  },
]
