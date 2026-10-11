migrate(
  (app) => {
    const admins =
      '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.role = "super_admin") && @request.auth.is_active = true'
    const users = app.findCollectionByNameOrId("users")
    const order = new Collection({
      type: "base",
      name: "expert_display_settings",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: admins,
      deleteRule: null,
      fields: [
        { name: "key", type: "text", required: true },
        { name: "expert_ids", type: "json", maxSize: 100000 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_expert_display_key ON expert_display_settings (key)",
      ],
    })
    app.save(order)
    const record = new Record(order)
    record.set("key", "landing")
    record.set("expert_ids", [])
    app.save(record)
    app.save(
      new Collection({
        type: "base",
        name: "expert_bank_details",
        listRule:
          admins + ' || (@request.auth.id != "" && user = @request.auth.id)',
        viewRule:
          admins + ' || (@request.auth.id != "" && user = @request.auth.id)',
        createRule: null,
        updateRule: admins,
        deleteRule: admins,
        fields: [
          {
            name: "user",
            type: "relation",
            collectionId: users.id,
            maxSelect: 1,
            required: true,
            cascadeDelete: true,
          },
          {
            name: "iban",
            type: "text",
            required: true,
            min: 15,
            max: 34,
            pattern: "^[A-Z]{2}[0-9]{2}[A-Z0-9]+$",
          },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_expert_bank_user ON expert_bank_details (user)",
        ],
      })
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("expert_bank_details"))
    app.delete(app.findCollectionByNameOrId("expert_display_settings"))
  }
)
