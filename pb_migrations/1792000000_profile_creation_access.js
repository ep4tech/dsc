// Tighten profile creation on databases that already ran the original bootstrap.
migrate((app) => {
  const admin = '@request.auth.id != "" && @request.auth.is_active = true && (@request.auth.role = "admin" || @request.auth.role = "super_admin")';
  for (const name of ['parent_profiles', 'individual_profiles', 'organization_profiles']) {
    const collection = app.findCollectionByNameOrId(name);
    collection.createRule = admin + ' || (@request.auth.id != "" && @request.body.user = @request.auth.id)';
    app.save(collection);
  }
}, () => { throw new Error('Restore a reviewed backup to revert profile access rules.'); });
