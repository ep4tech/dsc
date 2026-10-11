migrate((app)=>{
 const admins='@request.auth.id != "" && @request.auth.is_active = true && (@request.auth.role = "admin" || @request.auth.role = "super_admin")';
 const users=app.findCollectionByNameOrId('users');
 users.updateRule=admins+' || (@request.auth.id != "" && id = @request.auth.id && @request.body.role:changed = false && @request.body.is_active:changed = false)';
 users.manageRule=admins;users.deleteRule=admins;app.save(users);
 const profiles=app.findCollectionByNameOrId('expert_profiles');profiles.deleteRule=admins;
 const cv=profiles.fields.getByName('cv');if(cv&&cv.type==='file')cv.protected=true;
 for(const name of ['city','country_of_residence']){const field=profiles.fields.getByName(name);if(field.type==='text')field.max=100;}
 app.save(profiles);
},()=>{});
