migrate(
  (app) => {
    const admins =
      '@request.auth.id != "" && @request.auth.is_active = true && (@request.auth.role = "admin" || @request.auth.role = "super_admin")'
    const c = new Collection({ name: "portals", type: "base" })
    // Add constructed fields explicitly: native field objects in constructor JSON
    // are not retained by the PocketBase JS bridge.
    const fields = [
      new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
      new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
      new TextField({
        name: "portal_key",
        required: true,
        max: 80,
        pattern: "^[a-z0-9-]+$",
      }),
      new TextField({ name: "title_en", required: true, min: 2, max: 120 }),
      new TextField({ name: "title_ar", required: true, min: 2, max: 120 }),
      new TextField({ name: "description_en", required: true, max: 600 }),
      new TextField({ name: "description_ar", required: true, max: 600 }),
      new SelectField({
        name: "icon",
        required: true,
        maxSelect: 1,
        values: [
          "heartHandshake",
          "brain",
          "graduationCap",
          "building2",
          "heart",
          "users",
          "bookOpen",
          "lightbulb",
          "briefcase",
          "globe",
        ],
      }),
      new FileField({
        name: "picture",
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      }),
      new SelectField({
        name: "registration_type",
        required: true,
        maxSelect: 1,
        values: ["parent", "individual", "organization", "expert"],
      }),
      new TextField({
        name: "accent",
        required: true,
        pattern: "^#[0-9a-fA-F]{6}$",
      }),
      new NumberField({ name: "order", min: 0 }),
      new BoolField({ name: "is_deleted" }),
      new JSONField({ name: "config", maxSize: 100000 }),
    ]
    fields.forEach((field) => c.fields.add(field))
    c.indexes = ["CREATE UNIQUE INDEX idx_portal_key ON portals (portal_key)"]
    app.save(c)
    c.listRule = "is_deleted = false || (" + admins + ")"
    c.viewRule = "is_deleted = false || (" + admins + ")"
    c.createRule = admins
    c.updateRule = admins
    c.deleteRule = null
    app.save(c)
    const defaults = [
      {
        id: "1",
        title: { en: "Special Needs", ar: "الاحتياجات الخاصة" },
        portalName: {
          en: "Special Needs Portal",
          ar: "بوابة الاحتياجات الخاصة",
        },
        image: "/portals/portal-1.jpg",
        banner: "/banners/banner-1.png",
        tagline: {
          en: "Supporting Abilities, Empowering Potential",
          ar: "دعم القدرات، تمكين الإمكانات",
        },
        heroTitle: {
          en: "Multidimensional diagnosis and assessment serving as a starting point for treatment—if required—followed by the development of capabilities for creativity, innovation, and entrepreneurship",
          ar: "تشخيص متعدد الأبعاد (كنقطة انطلاق) نحو العلاج إن كان مطلوباً، ثم تطوير القدرات نحو الإبداع والابتكار والريادة",
        },
        heroText: {
          en: "We offer early intervention programs and personalized support plans for every individual.",
          ar: "نقدم برامج التدخل المبكر وخطط الدعم المخصصة لكل فرد.",
        },
        philosophy: {
          en: "Understand the Need, Identify the Cause, Build the Path Forward. Every person may carry a special need, whether its indicators fully meet specialized diagnostic criteria or remain incomplete. Because indicators differ from one individual to another, no two cases are truly identical. We therefore do not stop at naming an indicator: we distinguish between transient, situational indicators and those that are persistent and recurring, while tracing behavioral, physical, psychological, learning, and social indicators to their true roots—organic, neurological, psychological, environmental, social, or nutritional.\n\n The ten service icons are not rigid methodologies, but broad categories for organizing cases. Our methodology is one: comprehensive multidimensional assessment before any decision or plan, followed by an individualized plan, specialized implementation, continuous outcome measurement, and evidence-based refinement. Each case begins by establishing its true starting point, followed by multidisciplinary planning and delivery in-center, through home visits, or online, with the family as a full partner.\n\n Start with the multidimensional assessment to understand abilities and needs, and identify the nature of the indicators and their causes, then move with us to the individualized plan, intervention, development, and outcome measurement. Start now — accurate understanding is the first step toward growth.",
          ar: "قد يحمل كل إنسان احتياجًا خاصًا، سواء اكتملت مؤشرات تشخيصه وفق الأدلة المتخصصة أم لم تكتمل بعد. ولأن المؤشرات تختلف بين الأفراد، فلا توجد حالتان متطابقتان تمامًا. لذلك لا نكتفي بتسمية المؤشر، بل نميّز بين العارض الظرفي والمؤشر المستمر والمتكرر، ونتتبّع كل مؤشر سلوكي أو جسدي أو نفسي أو تعلّمي أو اجتماعي إلى مسببه الحقيقي: العضوي، العصبي، النفسي، البيئي، الاجتماعي أو التغذوي.\n\nالأيقونات العشر هنا ليست مناهج جامدة، بل مجالات عامة لتنظيم الحالات. أما منهجنا فواحد: تقييم شامل متعدد الأبعاد قبل أي قرار أو خطة، ثم خطة فردية، وتنفيذ متخصص، وقياس مستمر للأثر وتعديل الخطة وفق النتائج. تبدأ الرحلة بتسجيل الحالة وتحديد نقطة البداية، ثم يعمل فريق متعدد التخصصات على بناء الخطة وتنفيذها في المركز أو المنزل أو أونلاين، مع شراكة كاملة مع الأسرة. لا نعالج المؤشر فقط؛ نفهم الحالة ونعالج ما يقف خلفه. ابدأ بتقييمك متعدد الأبعاد، ودعنا نبني لهذه الحالة مسارها الخاص.\n\nابدأ الآن بفهم الحالة وتحديد احتياجها\nأنشئ حسابك لدى DSC مجانًا، ثم سجّل كل حالة تحتاج إلى خدماتنا الآن أو مستقبلًا.\nابدأ بالتقييم متعدد الأبعاد لفهم القدرات والاحتياجات، وتحديد طبيعة المؤشرات وأسبابها، ثم انتقل معنا إلى الخطة الفردية، والتدخل، والتطوير، وقياس النتائج.\nابدأ الآن — فالفهم الدقيق هو أول خطوة نحو التطور.",
        },
        ctaLabel: { en: "Get Started Now", ar: "ابدأ الآن" },
        ctaHref: "/register",
        accent: "#008f53",
        secondary: "#0f3090",
        menu: [
          { en: "Home", ar: "الرئيسية" },
          { en: "About Us", ar: "من نحن" },
          { en: "Services", ar: "الخدمات" },
          { en: "Resources", ar: "الموارد" },
          { en: "Blog", ar: "المدونة" },
          { en: "For Families", ar: "للأسر" },
          { en: "For Professionals", ar: "للمتخصصين" },
          { en: "Contact Us", ar: "تواصل معنا" },
        ],
        services: [
          {
            id: "autism-spectrum-disorder",
            icon: "heartHandshake",
            name: { en: "Autism Spectrum Disorder", ar: "اضطراب طيف التوحد" },
          },
          {
            id: "learning-disabilities",
            icon: "bookOpen",
            name: { en: "Learning Disabilities", ar: "صعوبات التعلم" },
          },
          {
            id: "speech-language-disorders",
            icon: "messageCircle",
            name: {
              en: "Speech & Language Disorders",
              ar: "اضطرابات الكلام واللغة",
            },
          },
          {
            id: "intellectual-disability",
            icon: "brain",
            name: { en: "Intellectual Disability", ar: "الإعاقة الذهنية" },
          },
          {
            id: "behavior-challenges",
            icon: "heart",
            name: { en: "Behavior Challenges", ar: "التحديات السلوكية" },
          },
          {
            id: "sensory-processing-disorder",
            icon: "eye",
            name: {
              en: "Sensory Processing Disorder",
              ar: "اضطراب المعالجة الحسية",
            },
          },
          {
            id: "motor-skills-development",
            icon: "accessibility",
            name: {
              en: "Motor Skills Development",
              ar: "تطوير المهارات الحركية",
            },
          },
          {
            id: "family-support",
            icon: "users",
            name: { en: "Family Support", ar: "دعم الأسرة" },
          },
          {
            id: "assessments-evaluations",
            icon: "clipboardCheck",
            name: {
              en: "Assessments & Evaluations",
              ar: "التقييمات والفحوصات",
            },
          },
        ],
        icon: "heartHandshake",
        registrationType: "parent",
      },
      {
        id: "2",
        title: { en: "Mental Health", ar: "الصحة النفسية" },
        portalName: { en: "Mental Health Portal", ar: "بوابة الصحة النفسية" },
        tagline: {
          en: "Better Balance, Better Living",
          ar: "توازن أفضل، حياة أفضل",
        },
        image: "/portals/portal-2.jpg",
        banner: "/banners/banner-2.png",
        heroTitle: {
          en: "Confidential care and practical tools for emotional wellbeing",
          ar: "رعاية سرية وأدوات عملية للصحة النفسية",
        },
        heroText: {
          en: "Access counseling tracks, stress-management plans, and guided support from qualified professionals.",
          ar: " الوصول إلى مسارات الإرشاد وخطط إدارة التوتر والدعم الموجه من متخصصين مؤهلين.",
        },
        philosophy: {
          en: "Understand the Person, Not Just the Symptoms\n\nMental health exists on a continuum, and every person has a unique position on it—with strengths, vulnerabilities, and risk factors shaping their trajectory. We therefore distinguish between transient, situational emotional or behavioral indicators and those that are persistent and recurring, while tracing them to their underlying organic, neurological, psychological, environmental, social, or nutritional causes.\n\nBecause no two psychological profiles are identical, our process begins with comprehensive psychological assessment before any therapeutic decision, using appropriate diagnostic tools to map cognitive, emotional, and behavioral indicators and their underlying causes. An individualized plan is then developed, delivered, measured, and refined according to real outcome data, with confidentiality, transparency, and partnership with the client or family when appropriate.\n\nThe portal addresses anxiety and stress, mood, trauma and loss, family and relationships, burnout and resilience, youth mental health, crisis and safety, digital wellbeing and behavioral addictions, and psychological profiling and personality analysis. Do not begin with a label. Begin by understanding your psychological reality. Register for assessment, and let us turn understanding into a practical path toward better balance and better living.\n\nStart now by understanding your psychological reality. Create your free DSC account, then register your own case or any case that needs our services now or in the future. Start with the appropriate psychological assessment to understand strengths, challenges, and influencing factors, then move to a support or intervention plan, follow-up, and progress measurement, with full confidentiality and privacy.",
          ar: "الصحة النفسية مسار متدرج، ولكل إنسان موقعه الخاص عليه، بما يحمله من نقاط قوة ومواطن هشاشة وعوامل خطر. لذلك لا نتعامل مع كل عرض بالطريقة نفسها؛ بل نميّز بين المؤشر الانفعالي أو السلوكي العابر والظرفي وبين المستمر والمتكرر، ونتتبّع جذوره الحقيقية: العضوية، العصبية، النفسية، البيئية، الاجتماعية أو التغذوية.\n\nولأن لا ملفين نفسيين متطابقين تمامًا، يبدأ منهجنا بتقييم نفسي شامل قبل أي قرار علاجي، باستخدام أدوات تشخيصية مناسبة لرسم المؤشرات المعرفية والانفعالية والسلوكية ومسبباتها، ثم بناء خطة فردية وتنفيذها ومتابعة أثرها وتعديلها وفق البيانات الفعلية، مع الخصوصية والشفافية والشراكة مع المستفيد أو أسرته عند الحاجة.\n\nوتشمل الرحلة القلق والضغط والمزاج والصدمات والعلاقات والأسرة والاحتراق النفسي والشباب والأزمات والصحة الرقمية والملف النفسي وتحليل الشخصية.\n\nلا تبدأ من اسم المشكلة؛ ابدأ بفهم واقعك النفسي. سجّل طلب التقييم، ولنحوّل الفهم إلى مسار عملي نحو توازن أفضل وحياة أفضل.\n\nابدأ الآن بفهم واقعك النفسي\nأنشئ حسابك لدى DSC مجانًا، ثم سجّل حالتك أو أي حالة تحتاج إلى خدماتنا الآن أو مستقبلًا.\nابدأ بالتقييم النفسي المناسب لفهم نقاط القوة ومواطن التحدي والعوامل المؤثرة، ثم انتقل إلى خطة الدعم أو التدخل، والمتابعة، وقياس التقدم بسرية وخصوصية.\nابدأ الآن — لأن فهم ما يحدث هو بداية التغيير.",
        },
        ctaLabel: { en: "Start Your Wellness Plan", ar: "ابدأ خطة العافية" },
        ctaHref: "/register",
        accent: "#631a7b",
        secondary: "#0f3090",
        menu: [
          { en: "Home", ar: "الرئيسية" },
          { en: "About", ar: "من نحن" },
          { en: "Care Programs", ar: "برامج الرعاية" },
          { en: "Self-Help Library", ar: "مكتبة المساعدة الذاتية" },
          { en: "Professionals", ar: "المتخصصون" },
          { en: "Community", ar: "المجتمع" },
          { en: "Blog", ar: "المدونة" },
          { en: "Contact", ar: "تواصل معنا" },
        ],
        services: [
          {
            id: "anxiety-support",
            icon: "Heart",
            name: { en: "Anxiety Support", ar: "دعم القلق" },
          },
          {
            id: "depression-care",
            icon: "CloudMoon",
            name: { en: "Depression Care", ar: "رعاية الاكتئاب" },
          },
          {
            id: "family-counseling",
            icon: "Users",
            name: { en: "Family Counseling", ar: "الإرشاد الأسري" },
          },
          {
            id: "trauma-recovery",
            icon: "Shield",
            name: { en: "Trauma Recovery", ar: "التعافي من الصدمات" },
          },
          {
            id: "burnout-prevention",
            icon: "Flame",
            name: { en: "Burnout Prevention", ar: "الوقاية من الإرهاق" },
          },
          {
            id: "youth-mental-health",
            icon: "Smile",
            name: { en: "Youth Mental Health", ar: "صحة الشباب النفسية" },
          },
          {
            id: "mindfulness-programs",
            icon: "Flower2",
            name: { en: "Mindfulness Programs", ar: "برامج الوعي الذاتي" },
          },
          {
            id: "crisis-guidance",
            icon: "PhoneCall",
            name: { en: "Crisis Guidance", ar: "إرشاد الأزمات" },
          },
          {
            id: "workplace-wellbeing",
            icon: "Building2",
            name: { en: "Workplace Wellbeing", ar: "رفاهية مكان العمل" },
          },
          {
            id: "assessment-services",
            icon: "ClipboardCheck",
            name: { en: "Assessment Services", ar: "خدمات التقييم" },
          },
        ],
        icon: "brain",
        registrationType: "individual",
      },
      {
        id: "4",
        title: { en: "Education and Innovation", ar: "التعليم والابتكار" },
        portalName: { en: "Education Portal", ar: "بوابة التعليم" },
        image: "/portals/portal-4.jpg",
        banner: "/banners/banner-4.png",
        tagline: { en: "Learning That Moves Forward", ar: "تعلم يتقدم للأمام" },
        heroTitle: {
          en: "Build modern learning journeys for students and educators",
          ar: "بناء رحلات تعليمية حديثة للطلاب والمعلمين",
        },
        heroText: {
          en: "From curriculum support to digital classrooms, we help institutions deliver measurable learning growth.",
          ar: "من دعم المناهج إلى الفصول الرقمية، نساعد المؤسسات على تقديم نمو تعليمي قابل للقياس.",
        },
        philosophy: {
          en: "From the Real Starting Point to Mastery and Possibility\n\nEducation that ignores the learner's true starting point can place them on the wrong path. We therefore identify the actual depth and gaps within each skill, distinguish transient and situational learning difficulties—arising from instructional gaps, temporary circumstances, or environmental factors—from persistent and recurring difficulties, and trace their roots to organic, neurological, psychological, environmental, social, or nutritional causes.\n\nEvery skill pathway follows one clear structure: an individualized foundation track for learners who need to build the basics, and a separate refinement-and-mastery track for those who already have them and seek excellence. No learner is pushed beyond their foundation, and no learner is held back after mastering it. The journey begins with multidimensional assessment, followed by an individualized learning plan by stage and subject, continuous progress measurement, and evidence-based refinement.\n\nThe portal covers language, mathematics, natural sciences, digital skills and AI, research and graduate preparation, economics, accounting and marketing, health qualification, self-leadership and advanced thinking, creativity, invention, innovation, and entrepreneurship. We do not place everyone on the same path. We identify the starting point, then build the road to mastery. Begin your assessment and discover your path toward excellence and innovation.\n\nStart from your real level, and build your path toward mastery. Create your free DSC account, then register every educational or skill-based case that needs our services now or in the future. Start with the multidimensional assessment to identify your real starting point, mastered skills, and gaps and their causes, then get an individualized educational path that takes you from foundation to mastery and innovation based on your actual progress.\nStart now — don't learn from an assumed starting point; start from your real level.",
          ar: "التعليم الذي لا يبدأ من نقطة انطلاق حقيقية قد يضع المتعلم في المسار الخطأ. لذلك نحدد أولًا العمق الفعلي لكل مهارة وثغراتها، ونميّز بين صعوبة عابرة وظرفية ناتجة عن فجوة تعليمية أو ظرف مؤقت أو عامل بيئي، وبين صعوبة مستمرة ومتكررة، ثم نبحث عن سببها الحقيقي: عضوي، عصبي، نفسي، بيئي، اجتماعي أو تغذوي.\n\nكل مسار مهاري هنا يقوم على بنية واضحة: برنامج تأسيسي فردي لمن يحتاج إلى بناء الأساس، وبرنامج صقل وإتقان لمن يمتلكه ويريد الانتقال إلى التميز؛ فلا يُدفع متعلم إلى مستوى لا يستعد له، ولا يُعاد إلى مستوى تجاوز حاجته. يبدأ المسار بتقييم متعدد الأبعاد، ثم خطة تعلم فردية حسب المرحلة والمادة، مع قياس مستمر للتقدم وتعديل الخطة وفق البيانات.\n\nوتشمل البوابة اللغة، والرياضيات، والعلوم، والمهارات الرقمية والذكاء الاصطناعي، والبحث والدراسات العليا، والاقتصاد والمحاسبة والتسويق، والتأهيل الصحي، والقيادة والتفكير المتقدم، والإبداع والاختراع والابتكار وريادة الأعمال.\n\nلا نضع الجميع في المسار نفسه؛ نحدد نقطة البداية ثم نبني الطريق إلى الإتقان. ابدأ بتقييم قدراتك، واكتشف مسارك نحو التميز والابتكار.\n\nابدأ من مستواك الحقيقي، وابنِ طريقك نحو الإتقان\nأنشئ حسابك لدى DSC مجانًا، ثم سجّل كل حالة تعليمية أو مهارية تحتاج إلى خدماتنا الآن أو مستقبلًا.\nابدأ بالتقييم متعدد الأبعاد لتحديد نقطة البداية الفعلية، والمهارات المتقنة، والفجوات وأسبابها، ثم احصل على مسار تعليمي فردي ينتقل بك من التأسيس إلى الإتقان والابتكار وفق تقدمك الفعلي.\nابدأ الآن — لا تتعلم من نقطة افتراضية؛ ابدأ من مستواك الحقيقي.",
        },
        ctaLabel: { en: "Browse Education Services", ar: "تصفح خدمات التعليم" },
        ctaHref: "/register",
        accent: "#0f3090",
        secondary: "#008f53",
        menu: [
          { en: "Home", ar: "الرئيسية" },
          { en: "About", ar: "من نحن" },
          { en: "Programs", ar: "البرامج" },
          { en: "Schools", ar: "المدارس" },
          { en: "Teachers", ar: "المعلمون" },
          { en: "Resources", ar: "الموارد" },
          { en: "Events", ar: "الفعاليات" },
          { en: "Contact", ar: "تواصل معنا" },
        ],
        services: [
          {
            id: "curriculum-design",
            icon: "BookOpen",
            name: { en: "Curriculum Design", ar: "تصميم المناهج" },
          },
          {
            id: "teacher-training",
            icon: "Presentation",
            name: { en: "Teacher Training", ar: "تدريب المعلمين" },
          },
          {
            id: "learning-assessment",
            icon: "ClipboardList",
            name: { en: "Learning Assessment", ar: "تقييم التعلم" },
          },
          {
            id: "inclusive-education",
            icon: "Accessibility",
            name: { en: "Inclusive Education", ar: "التعليم الشامل" },
          },
          {
            id: "digital-learning",
            icon: "Monitor",
            name: { en: "Digital Learning", ar: "التعلم الرقمي" },
          },
          {
            id: "student-support",
            icon: "UserCheck",
            name: { en: "Student Support", ar: "دعم الطلاب" },
          },
          {
            id: "parent-engagement",
            icon: "HeartHandshake",
            name: { en: "Parent Engagement", ar: "مشاركة أولياء الأمور" },
          },
          {
            id: "institutional-planning",
            icon: "Building",
            name: { en: "Institutional Planning", ar: "التخطيط المؤسسي" },
          },
          {
            id: "stem-development",
            icon: "FlaskConical",
            name: { en: "STEM Development", ar: "تطوير STEM" },
          },
          {
            id: "accreditation-readiness",
            icon: "Award",
            name: { en: "Accreditation Readiness", ar: "جاهزية الاعتماد" },
          },
        ],
        icon: "graduationCap",
        registrationType: "individual",
      },
      {
        id: "5",
        title: { en: "Institutional Diagnosis & Development", ar: "المؤسسات" },
        portalName: {
          en: "Institutional Diagnosis & Development Portal",
          ar: "بوابة التشخيص والتطوير المؤسسي",
        },
        image: "/portals/portal-5.jpg",
        banner: "/banners/banner-5.png",
        tagline: {
          en: "Performance Through Strategy",
          ar: "الأداء من خلال الاستراتيجية",
        },
        heroTitle: {
          en: "Enable institutions to perform with clarity, systems, and evidence",
          ar: "تمكين المؤسسات من الأداء بالوضوح والأنظمة والأدلة",
        },
        heroText: {
          en: "Access consulting, diagnostics, and strategic implementation models tailored to organizational goals.",
          ar: "الوصول إلى الاستشارات والتشخيصات ونماذج التنفيذ الاستراتيجي المصممة لتحقيق الأهداف التنظيمية.",
        },
        philosophy: {
          en: "Diagnose the Reality, Address the Root, Build for Sustainable Growth\n\nAn institution is a living system, and a complex system cannot be responsibly developed without first understanding its actual condition. We therefore look beyond visible weaknesses—declining performance, recurring conflict, or stalled initiatives—to distinguish transient indicators from structural and recurring ones, tracing their roots to leadership, structure, processes, culture, market conditions, or the psychological, physical, and behavioral conditions of the people who operate the institution.\n\nWhether the goal is preparing a founder or leader, establishing a new venture, or developing an existing institution, every engagement begins with comprehensive multidimensional diagnosis before any development plan. The journey then moves continuously from founder and leadership readiness and structured establishment, through institutional diagnosis and targeted development, to strategic and executive planning, organizational building, quality, accreditation, and global-ranking readiness. Implementation is monitored against predefined milestones, measured through real outcomes, and refined in partnership with institutional leadership.\n\nDo not begin institutional development with assumptions. Diagnose first, uncover the roots of the gaps, and turn them into an actionable, measurable path toward sustainable growth and excellence. Start by diagnosing your institution, then build its development on evidence\nCreate your institution's free DSC account, then register your institution and its current or future needs.\n\nStart with the multidimensional institutional diagnosis to understand structure, leadership, operations, culture, performance, and strengths and challenges and their roots, then move to the development and implementation plan, impact measurement, and continuous improvement.\nStart now — diagnose the reality, treat the roots, and build a future more capable of growth.",
          ar: "على النمو\n\nالمؤسسة كيان حيّ؛ ولا يمكن تطوير نظام معقد بمسؤولية دون تشخيص دقيق لواقعه. لذلك لا نتوقف عند ضعف ظاهر—كتراجع الأداء أو نزاع متكرر أو مبادرة متعثرة—بل نميّز بين المؤشر العابر والمؤشر البنيوي المتكرر، ونتتبّع جذوره في القيادة، والهيكل، والإجراءات، والثقافة، والسوق، أو الحالات النفسية والجسدية والسلوكية للأفراد الذين يديرون المؤسسة.\n\nسواء كان الهدف تأهيل مؤسس أو قائد، تأسيس مشروع، أو تطوير مؤسسة قائمة، يبدأ تدخلنا دائمًا بتشخيص شامل متعدد الأبعاد قبل أي خطة، ثم ينتقل بصورة متصلة من التأهيل والتأسيس إلى التشخيص المؤسسي، وعلاج نقاط الضعف، والتخطيط الاستراتيجي والتنفيذي، والبناء التنظيمي، ثم الجودة والاعتماد والاستعداد للتصنيفات العالمية. وتُنفذ الخطط على مراحل مع قياس الأثر مقابل مؤشرات محددة مسبقًا وتعديلها وفق البيانات، بالشراكة مع القيادة.\n\nلا تبدأ تطوير مؤسستك بالتخمين. ابدأ بتشخيصها، واكتشف جذور الفجوات، وحوّلها إلى خطة قابلة للتنفيذ والقياس والنمو المستدام.\n\nابدأ بتشخيص مؤسستك، ثم ابنِ تطورها على أساس من الأدلة\nأنشئ حساب مؤسستك لدى DSC مجانًا، ثم سجّل مؤسستك واحتياجاتها الحالية أو المستقبلية.\nابدأ بالتشخيص المؤسسي متعدد الأبعاد لفهم الهيكل، والقيادة، والعمليات، والثقافة، والأداء، ومواطن القوة والتحديات وجذورها، ثم انتقل إلى خطة التطوير والتنفيذ وقياس الأثر والتحسين المستمر.\nابدأ الآن — شخّص الواقع، عالج الجذور، وابنِ مستقبلًا أكثر قدرة على النمو.",
        },
        ctaLabel: { en: "Request Institutional Plan", ar: "اطلب خطة مؤسسية" },
        ctaHref: "/register",
        accent: "#121e31",
        secondary: "#00a4e4",
        menu: [
          { en: "Home", ar: "الرئيسية" },
          { en: "About", ar: "من نحن" },
          { en: "Consulting", ar: "الاستشارات" },
          { en: "Diagnostics", ar: "التشخيصات" },
          { en: "Resources", ar: "الموارد" },
          { en: "Partners", ar: "الشركاء" },
          { en: "Insights", ar: "الرؤى" },
          { en: "Contact", ar: "تواصل معنا" },
        ],
        services: [
          {
            id: "strategic-planning",
            icon: "ChartLine",
            name: { en: "Strategic Planning", ar: "التخطيط الاستراتيجي" },
          },
          {
            id: "policy-development",
            icon: "FileText",
            name: { en: "Policy Development", ar: "تطوير السياسات" },
          },
          {
            id: "operational-excellence",
            icon: "Settings",
            name: { en: "Operational Excellence", ar: "التميز التشغيلي" },
          },
          {
            id: "leadership-programs",
            icon: "Crown",
            name: { en: "Leadership Programs", ar: "برامج القيادة" },
          },
          {
            id: "change-management",
            icon: "ArrowLeftRight",
            name: { en: "Change Management", ar: "إدارة التغيير" },
          },
          {
            id: "governance-models",
            icon: "Scale",
            name: { en: "Governance Models", ar: "نماذج الحوكمة" },
          },
          {
            id: "quality-assurance",
            icon: "ShieldCheck",
            name: { en: "Quality Assurance", ar: "ضمان الجودة" },
          },
          {
            id: "kpi-frameworks",
            icon: "Gauge",
            name: { en: "KPI Frameworks", ar: "أطر مؤشرات الأداء" },
          },
          {
            id: "capacity-building",
            icon: "Layers",
            name: { en: "Capacity Building", ar: "بناء القدرات" },
          },
          {
            id: "impact-measurement",
            icon: "Target",
            name: { en: "Impact Measurement", ar: "قياس الأثر" },
          },
        ],
        icon: "building2",
        registrationType: "organization",
      },
    ]
    defaults.forEach((p, i) => {
      const record = new Record(c)
      record.load({
        portal_key: p.id,
        title_en: p.title.en,
        title_ar: p.title.ar,
        description_en: p.tagline.en,
        description_ar: p.tagline.ar,
        icon: p.icon,
        registration_type: p.registrationType,
        accent: p.accent,
        order: i,
        is_deleted: false,
        config: p,
      })
      app.save(record)
    })
  },
  () => {
    throw new Error(
      "Restore a reviewed backup to roll back portal content safely."
    )
  }
)
