// Add timestamps to portal databases created before the timestamp correction.
migrate(
  (app) => {
    const c = app.findCollectionByNameOrId("portals")
    if (!c.fields.getByName("created"))
      c.fields.add(
        new AutodateField({ name: "created", onCreate: true, onUpdate: false })
      )
    if (!c.fields.getByName("updated"))
      c.fields.add(
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
      )
    app.save(c)
  },
  () => {}
)
