# DSC report corrections — 11 October 2026

Reviewed all 156 findings from the attached report. Existing work was preserved; no deployment, database migration execution, or external messages were performed.

## Changes

- Messaging: verify PocketBase tokens on a separate request-scoped client; administrative email requires an active administrator. Private Telegram notifications require an active user. Public contact and consultation routes have fixed recipients and validate bounded JSON. Upstream errors are replaced with generic responses.
- Public consultation email is now sent to the consultation team, with the visitor as reply-to. Arbitrary HTML and arbitrary visitor-selected email recipients are no longer accepted from guests. Expert signup sends a fixed administrative notification using the newly registered expert's token; attachments remain in the protected application records for administrators to review.
- Throttling: enforce process-wide and client/token ceilings with HTTP 429 and Retry-After. The in-memory limits apply per server instance and reset on restart. Set DSC_TRUST_PROXY=true only behind a proxy that overwrites x-forwarded-for; otherwise unknown clients share a conservative limit. A multi-instance production deployment also needs gateway or shared-store limits.
- CMS: parse and sanitize HTML with sanitize-html, allowing formatting, safe links, images, and specific video hosts while stripping executable elements, event handlers, unsafe URLs, and unsafe CSS.
- Database reads: bind filter values, including additional first-item queries absent from the report. Application full-list calls use pages of 200 and an explicit ceiling of 10,000; larger datasets raise an error rather than silently truncate. Explicit singleton queries request one record.
- Profile creation: authenticated owners or active administrators only. A forward migration is supplied for existing databases: pb_migrations/1792000000_profile_creation_access.js. This source change requires your normal migration deployment process to affect an existing database.
- Diagnostics: replace reported application any types with typed boundaries, derive read-only answers and assignment counts directly, subscribe to auth-store initialization, and use an external-store snapshot for language-cookie hydration. PocketBase hooks and CJS tests have an appropriately scoped CommonJS lint override. Two edit-form effects retain documented local exemptions because they initialize editable drafts from asynchronously loaded records.
- Errors: reject malformed project metadata; log editor fallback cleanup and integration-test cleanup failures.

## Validation

TypeScript passes; ESLint has zero errors (remaining warnings include unused declarations, hook dependencies, and image optimization suggestions). Existing contact, portal journey, portal management, project validation, and expert management tests pass. New security regression tests pass without external message delivery. Production build succeeds. Browser workflows and effective live database rules were not exercised.

## Finding dispositions

Large-module findings are size signals, not demonstrated functional defects; broad file splitting was not required for these fixes. Test execution of trusted repository source is intentional. Public lookup/configuration collections and curated public content projections remain readable by design. Historical expert-profile read rules are superseded by the existing private/public separation migration 1791800000_expert_cases_access.js.

| # | Report position | Disposition |
|---|---|---|
| 1 | `app/api/contact/route.ts:8` | Corrected in application code; see changes and regression validation above. |
| 2 | `app/api/contact/route.ts:8` | Corrected in application code; see changes and regression validation above. |
| 3 | `app/api/send-email/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 4 | `app/api/send-email/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 5 | `app/api/send-email/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 6 | `app/api/send-email/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 7 | `app/api/send-message/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 8 | `app/api/send-message/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 9 | `app/api/send-message/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 10 | `app/api/send-message/route.ts:5` | Corrected in application code; see changes and regression validation above. |
| 11 | `app/api/telegram-notify/route.ts:4` | Corrected in application code; see changes and regression validation above. |
| 12 | `app/api/telegram-notify/route.ts:4` | Corrected in application code; see changes and regression validation above. |
| 13 | `app/api/telegram-notify/route.ts:4` | Corrected in application code; see changes and regression validation above. |
| 14 | `app/api/telegram-notify/route.ts:4` | Corrected in application code; see changes and regression validation above. |
| 15 | `app/blog/page.tsx:11` | Corrected in application code; see changes and regression validation above. |
| 16 | `app/blog/page.tsx:14` | Corrected in application code; see changes and regression validation above. |
| 17 | `app/blog/[slug]/page.tsx:27` | Corrected in application code; see changes and regression validation above. |
| 18 | `app/cms/blog/[slug]/page.tsx:85` | Corrected in application code; see changes and regression validation above. |
| 19 | `app/cms/blog/[slug]/page.tsx:85` | Corrected in application code; see changes and regression validation above. |
| 20 | `app/cms/home-pages/page.tsx:44` | Corrected in application code; see changes and regression validation above. |
| 21 | `app/cms/info/[portalId]/page.tsx:54` | Corrected in application code; see changes and regression validation above. |
| 22 | `app/cms/info/[portalId]/page.tsx:55` | Corrected in application code; see changes and regression validation above. |
| 23 | `app/dashboard/admin/allocations/page.tsx:178` | Corrected in application code; see changes and regression validation above. |
| 24 | `app/dashboard/admin/allocations/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 25 | `app/dashboard/admin/assignments/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 26 | `app/dashboard/admin/cases/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 27 | `app/dashboard/admin/training/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 28 | `app/dashboard/admin/users/[id]/page.tsx:275` | Corrected in application code; see changes and regression validation above. |
| 29 | `app/dashboard/admin/users/[id]/page.tsx:299` | Corrected in application code; see changes and regression validation above. |
| 30 | `app/dashboard/admin/users/[id]/page.tsx:341` | Corrected in application code; see changes and regression validation above. |
| 31 | `app/dashboard/admin/users/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 32 | `app/dashboard/cases/[id]/tasks/[toolId]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 33 | `app/dashboard/individual/cases/[id]/tasks/[toolId]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 34 | `app/dashboard/institution/projects/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 35 | `app/dashboard/institution/projects/[id]/tasks/[toolId]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 36 | `app/dashboard/parent/cases/[id]/tasks/[toolId]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 37 | `app/portal/[id]/page.tsx:27` | Corrected in application code; see changes and regression validation above. |
| 38 | `app/portal/[id]/page.tsx:28` | Corrected in application code; see changes and regression validation above. |
| 39 | `app/programmes/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 40 | `app/programmes/training_programmes/[id]/page.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 41 | `components/cms/CmsContent.tsx:38` | Corrected in application code; see changes and regression validation above. |
| 42 | `components/cms/RichTextEditor.tsx:63` | Corrected in application code; see changes and regression validation above. |
| 43 | `components/cms/RichTextEditor.tsx:112` | Corrected in application code; see changes and regression validation above. |
| 44 | `components/cms/RichTextEditor.tsx:208` | Corrected in application code; see changes and regression validation above. |
| 45 | `components/cms/RichTextEditor.tsx:215` | Corrected in application code; see changes and regression validation above. |
| 46 | `components/cms/RichTextEditor.tsx:226` | Corrected in application code; see changes and regression validation above. |
| 47 | `components/dashboard/ExpertApproval.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 48 | `components/dashboard/ExpertTaskAssignment.tsx:38` | Corrected in application code; see changes and regression validation above. |
| 49 | `components/dashboard/ExpertTaskAssignment.tsx:42` | Corrected in application code; see changes and regression validation above. |
| 50 | `components/dashboard/UserManagement.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 51 | `components/expert/ExpertProfileEditor.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 52 | `components/register/ExpertApplicationForm.tsx:1` | Reviewed: module-size signal; no functional defect established. |
| 53 | `components/register/UserTypeSelector.tsx:30` | Corrected in application code; see changes and regression validation above. |
| 54 | `hooks/useAuth.ts:82` | Corrected in application code; see changes and regression validation above. |
| 55 | `hooks/useLookups.ts:28` | Corrected in application code; see changes and regression validation above. |
| 56 | `hooks/usePaymentSettings.ts:16` | Corrected in application code; see changes and regression validation above. |
| 57 | `hooks/usePaymentSettings.ts:39` | Corrected in application code; see changes and regression validation above. |
| 58 | `hooks/useUsers.ts:15` | Corrected in application code; see changes and regression validation above. |
| 59 | `hooks/useUsers.ts:89` | Corrected in application code; see changes and regression validation above. |
| 60 | `hooks/useUsers.ts:89` | Corrected in application code; see changes and regression validation above. |
| 61 | `hooks/useUsers.ts:90` | Corrected in application code; see changes and regression validation above. |
| 62 | `hooks/useUsers.ts:91` | Corrected in application code; see changes and regression validation above. |
| 63 | `hooks/useUsers.ts:116` | Corrected in application code; see changes and regression validation above. |
| 64 | `hooks/useUsers.ts:117` | Corrected in application code; see changes and regression validation above. |
| 65 | `lib/pb-collections.ts:49` | Corrected in application code; see changes and regression validation above. |
| 66 | `lib/pb-collections.ts:75` | Corrected in application code; see changes and regression validation above. |
| 67 | `lib/pb-collections.ts:76` | Corrected in application code; see changes and regression validation above. |
| 68 | `lib/pb-collections.ts:82` | Corrected in application code; see changes and regression validation above. |
| 69 | `lib/pb-collections.ts:91` | Corrected in application code; see changes and regression validation above. |
| 70 | `lib/pb-collections.ts:148` | Corrected in application code; see changes and regression validation above. |
| 71 | `lib/pb-collections.ts:149` | Corrected in application code; see changes and regression validation above. |
| 72 | `lib/pb-collections.ts:156` | Corrected in application code; see changes and regression validation above. |
| 73 | `lib/pb-collections.ts:160` | Corrected in application code; see changes and regression validation above. |
| 74 | `lib/pb-collections.ts:161` | Corrected in application code; see changes and regression validation above. |
| 75 | `lib/pb-collections.ts:169` | Corrected in application code; see changes and regression validation above. |
| 76 | `lib/pb-collections.ts:170` | Corrected in application code; see changes and regression validation above. |
| 77 | `lib/pb-collections.ts:178` | Corrected in application code; see changes and regression validation above. |
| 78 | `lib/pb-collections.ts:179` | Corrected in application code; see changes and regression validation above. |
| 79 | `lib/pb-collections.ts:186` | Corrected in application code; see changes and regression validation above. |
| 80 | `lib/pb-collections.ts:255` | Corrected in application code; see changes and regression validation above. |
| 81 | `lib/pb-collections.ts:256` | Corrected in application code; see changes and regression validation above. |
| 82 | `lib/pb-collections.ts:261` | Corrected in application code; see changes and regression validation above. |
| 83 | `lib/pb-collections.ts:262` | Corrected in application code; see changes and regression validation above. |
| 84 | `lib/pb-collections.ts:267` | Corrected in application code; see changes and regression validation above. |
| 85 | `lib/pb-collections.ts:268` | Corrected in application code; see changes and regression validation above. |
| 86 | `lib/pb-collections.ts:296` | Corrected in application code; see changes and regression validation above. |
| 87 | `lib/pb-collections.ts:311` | Corrected in application code; see changes and regression validation above. |
| 88 | `lib/pb-collections.ts:436` | Corrected in application code; see changes and regression validation above. |
| 89 | `lib/pb-collections.ts:443` | Corrected in application code; see changes and regression validation above. |
| 90 | `lib/pb-collections.ts:444` | Corrected in application code; see changes and regression validation above. |
| 91 | `lib/pb-collections.ts:460` | Corrected in application code; see changes and regression validation above. |
| 92 | `lib/pb-collections.ts:460` | Corrected in application code; see changes and regression validation above. |
| 93 | `lib/pb-collections.ts:631` | Corrected in application code; see changes and regression validation above. |
| 94 | `lib/pb-collections.ts:635` | Corrected in application code; see changes and regression validation above. |
| 95 | `lib/pb-collections.ts:644` | Corrected in application code; see changes and regression validation above. |
| 96 | `lib/pb-collections.ts:841` | Corrected in application code; see changes and regression validation above. |
| 97 | `lib/pb-collections.ts:886` | Corrected in application code; see changes and regression validation above. |
| 98 | `lib/pb-collections.ts:892` | Corrected in application code; see changes and regression validation above. |
| 99 | `lib/pb-collections.ts:893` | Corrected in application code; see changes and regression validation above. |
| 100 | `lib/pb-collections.ts:899` | Corrected in application code; see changes and regression validation above. |
| 101 | `lib/pb-collections.ts:900` | Corrected in application code; see changes and regression validation above. |
| 102 | `lib/pb-collections.ts:942` | Corrected in application code; see changes and regression validation above. |
| 103 | `lib/pb-collections.ts:996` | Corrected in application code; see changes and regression validation above. |
| 104 | `lib/pb-collections.ts:997` | Corrected in application code; see changes and regression validation above. |
| 105 | `lib/pb-collections.ts:1` | Reviewed: module-size signal; no functional defect established. |
| 106 | `lib/pb-lectures.ts:127` | Corrected in application code; see changes and regression validation above. |
| 107 | `lib/pb-lectures.ts:135` | Corrected in application code; see changes and regression validation above. |
| 108 | `lib/pb-lectures.ts:188` | Corrected in application code; see changes and regression validation above. |
| 109 | `lib/pb-lectures.ts:197` | Corrected in application code; see changes and regression validation above. |
| 110 | `lib/pb-lectures.ts:198` | Corrected in application code; see changes and regression validation above. |
| 111 | `lib/pb-lectures.ts:207` | Corrected in application code; see changes and regression validation above. |
| 112 | `lib/pb-lectures.ts:208` | Corrected in application code; see changes and regression validation above. |
| 113 | `lib/pb-lectures.ts:244` | Corrected in application code; see changes and regression validation above. |
| 114 | `lib/pb-training.ts:227` | Corrected in application code; see changes and regression validation above. |
| 115 | `lib/pb-training.ts:234` | Corrected in application code; see changes and regression validation above. |
| 116 | `lib/pb-training.ts:248` | Corrected in application code; see changes and regression validation above. |
| 117 | `lib/pb-training.ts:302` | Corrected in application code; see changes and regression validation above. |
| 118 | `lib/pb-training.ts:310` | Corrected in application code; see changes and regression validation above. |
| 119 | `lib/pb-training.ts:311` | Corrected in application code; see changes and regression validation above. |
| 120 | `lib/pb-training.ts:318` | Corrected in application code; see changes and regression validation above. |
| 121 | `lib/pb-training.ts:319` | Corrected in application code; see changes and regression validation above. |
| 122 | `lib/pb-training.ts:329` | Corrected in application code; see changes and regression validation above. |
| 123 | `lib/pb-training.ts:330` | Corrected in application code; see changes and regression validation above. |
| 124 | `lib/pb-training.ts:367` | Corrected in application code; see changes and regression validation above. |
| 125 | `lib/pb-training.ts:374` | Corrected in application code; see changes and regression validation above. |
| 126 | `lib/pb-training.ts:375` | Corrected in application code; see changes and regression validation above. |
| 127 | `lib/pb-training.ts:382` | Corrected in application code; see changes and regression validation above. |
| 128 | `lib/pb-training.ts:383` | Corrected in application code; see changes and regression validation above. |
| 129 | `lib/pb.ts:19` | Corrected in application code; see changes and regression validation above. |
| 130 | `lib/pb.ts:282` | Corrected in application code; see changes and regression validation above. |
| 131 | `lib/portal-data.ts:40` | Corrected in application code; see changes and regression validation above. |
| 132 | `lib/team-experts.ts:47` | Corrected in application code; see changes and regression validation above. |
| 133 | `local-backend/1780000000_local_bootstrap.js:20` | Corrected: profile creation requires an authenticated owner; forward migration supplied. |
| 134 | `local-backend/1780000000_local_bootstrap.js:21` | Corrected: profile creation requires an authenticated owner; forward migration supplied. |
| 135 | `local-backend/1780000000_local_bootstrap.js:22` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 136 | `local-backend/1780000000_local_bootstrap.js:23` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 137 | `local-backend/1780000000_local_bootstrap.js:25` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 138 | `local-backend/1791600000_local_events.js:10` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 139 | `local-backend/seed-demo.mjs:5` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 140 | `local-backend/seed-demo.mjs:10` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 141 | `pb_hooks/lib/project-validation.js:15` | Corrected in application code; see changes and regression validation above. |
| 142 | `pb_migrations/1791500000_expert_management.js:9` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 143 | `pb_migrations/1791500000_expert_management.js:10` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 144 | `pb_migrations/1791800000_expert_cases_access.js:11` | Reviewed: intentional public configuration/content projection; historical private expert access superseded by 1791800000. |
| 145 | `tests/expert-biographies.mjs:5` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 146 | `tests/expert-management.test.ts:14` | Corrected in application code; see changes and regression validation above. |
| 147 | `tests/expert-management.test.ts:15` | Corrected in application code; see changes and regression validation above. |
| 148 | `tests/expert-management.test.ts:28` | Corrected in application code; see changes and regression validation above. |
| 149 | `tests/local-workflows.mjs:11` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 150 | `tests/local-workflows.mjs:32` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 151 | `tests/local-workflows.mjs:33` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 152 | `tests/local-workflows.mjs:34` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 153 | `tests/local-workflows.mjs:35` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 154 | `tests/local-workflows.mjs:40` | Reviewed: controlled local test/seed tooling, not an application request; complete local fixture enumeration retained. |
| 155 | `tests/local-workflows.mjs:42` | Corrected in application code; see changes and regression validation above. |
| 156 | `tests/portal-management.test.cjs:11` | Reviewed: executes trusted local TypeScript in a test harness; no runtime request input. |

## Refreshed heuristic scan

The static scan now reports 45 review signals (down from 156). It still flags messaging routes because its text patterns do not follow guardMessaging/messagingUser into the shared security module, and flags the CMS render sink without tracing the sanitizer. The remaining signals also include reviewed module-size warnings, intentionally public projections/configuration, and local test/seed enumeration. The scan was run with --static-only; compiler, lint, tests, and build were run separately as described above. Latest lint result: zero errors and 153 warnings.
