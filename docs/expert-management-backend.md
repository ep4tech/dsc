# Expert management backend

Install `pb_migrations/1791500000_expert_management.js` and `pb_hooks/expert-registration.pb.js` beside the existing PocketBase executable (PocketBase 0.23+). Run `pocketbase migrate up`, then restart PocketBase to load the hook. These changes have not been applied to the remote server.

The migration adds a public singleton `expert_display_settings` record. Active admins/super admins can update the ordered expert profile IDs; visitors can only read. Profiles absent from the saved order appear after ordered profiles in their previous creation-date order. Deleted/inactive IDs do not appear.

IBAN is optional and validated both in the form and server hook. It is saved atomically with creation of the new expert user in `expert_bank_details`. The later access migration limits bank reads to active admins only. It is not stored in public profiles, application emails, or the landing-page payload. The registration preflight prevents account creation with an IBAN until the hook and collection are installed.

`1791800000_expert_cases_access.js` and `1791900000_case_signup_defaults.js` add a safe public expert projection, private expert records, owner profile editing, case access rules, and specialist task fields. Deploy all new `pb_hooks` files together, including their `lib` directory. The transactional allocation endpoint preserves saved assignments if any input fails validation. Task assignment requires an active expert allocated to the same case with the selected specialization. Project creation/editing is validated on the server as well as in the form.

These rules were tested on the local reconstructed database. Review against the production schema and existing access rules, especially relation fields, before deployment. Local-only schema reconstruction stays under `local-backend` and must not be deployed to production. Public expert projection includes the existing portrait and name, qualification, specialization and the explicitly public English/Arabic short biographies (250 characters each). Contact details, residence, CVs, legacy application messages and IBAN are excluded.

To roll back, remove the hook and run the migration down. Rolling back removes saved ordering and bank records; export needed data first.

Migration 1792100000_expert_short_biographies.js adds short_bio_en and short_bio_ar with database limits of 250 characters and includes them in experts_public. Registration and expert/admin profile editing use these fields; legacy bio data is retained privately and is not displayed as a short biography.


Migration 1792200000_bilingual_expert_display.js adds independent English/Arabic public names, certificate titles and specialties (100/200 character limits), while removing highest_academic_degree from experts_public. The highest-degree dropdown remains a single stored value in registration. Registration and expert/admin editing share the bilingual public field component. Legacy public display values remain a fallback for older profiles until bilingual entries are completed.
