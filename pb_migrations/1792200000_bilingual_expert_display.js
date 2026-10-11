migrate(
  (app) => {
    const profiles = app.findCollectionByNameOrId("expert_profiles")
    for (const name of [
      "public_name_en",
      "public_name_ar",
      "public_qualification_en",
      "public_qualification_ar",
      "public_specialty_en",
      "public_specialty_ar",
    ]) {
      if (!profiles.fields.getByName(name))
        profiles.fields.add(
          new TextField({
            name,
            max: name.startsWith("public_name_") ? 100 : 200,
          })
        )
    }
    app.save(profiles)
    const experts = app.findCollectionByNameOrId("experts_public")
    experts.viewQuery =
      "SELECT expert_profiles.id, users.name, expert_profiles.profile_photo, expert_profiles.degree_title, expert_profiles.specialization_type, expert_profiles.short_bio_en, expert_profiles.short_bio_ar, expert_profiles.public_name_en, expert_profiles.public_name_ar, expert_profiles.public_qualification_en, expert_profiles.public_qualification_ar, expert_profiles.public_specialty_en, expert_profiles.public_specialty_ar FROM expert_profiles JOIN users ON expert_profiles.user = users.id WHERE users.role = 'expert' AND users.is_active = true"
    app.save(experts)
  },
  () => {
    throw new Error(
      "Review a backup before reverting bilingual public expert display fields."
    )
  }
)
