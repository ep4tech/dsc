migrate(
  (app) => {
    const profiles = app.findCollectionByNameOrId("expert_profiles")
    for (const name of ["short_bio_en", "short_bio_ar"]) {
      if (!profiles.fields.getByName(name))
        profiles.fields.add(new TextField({ name, max: 250 }))
    }
    app.save(profiles)
    const publicExperts = app.findCollectionByNameOrId("experts_public")
    publicExperts.viewQuery =
      "SELECT expert_profiles.id, users.name, expert_profiles.profile_photo, expert_profiles.highest_academic_degree, expert_profiles.degree_title, expert_profiles.specialization_type, expert_profiles.short_bio_en, expert_profiles.short_bio_ar FROM expert_profiles JOIN users ON expert_profiles.user = users.id WHERE users.role = 'expert' AND users.is_active = true"
    app.save(publicExperts)
  },
  (app) => {
    const publicExperts = app.findCollectionByNameOrId("experts_public")
    publicExperts.viewQuery =
      "SELECT expert_profiles.id, users.name, expert_profiles.profile_photo, expert_profiles.highest_academic_degree, expert_profiles.degree_title, expert_profiles.specialization_type FROM expert_profiles JOIN users ON expert_profiles.user = users.id WHERE users.role = 'expert' AND users.is_active = true"
    app.save(publicExperts)
    const profiles = app.findCollectionByNameOrId("expert_profiles")
    profiles.fields.removeByName("short_bio_en")
    profiles.fields.removeByName("short_bio_ar")
    app.save(profiles)
  }
)
