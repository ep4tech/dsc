migrate((app)=>{
 const admins='@request.auth.id != "" && @request.auth.is_active = true && (@request.auth.role = "admin" || @request.auth.role = "super_admin")';
 const users=app.findCollectionByNameOrId('users');const profiles=app.findCollectionByNameOrId('expert_profiles');const cases=app.findCollectionByNameOrId('cases');const allocations=app.findCollectionByNameOrId('case_experts');const tasks=app.findCollectionByNameOrId('case_tools');
 users.listRule=admins+' || id = @request.auth.id';users.viewRule=users.listRule;app.save(users);
 profiles.listRule=admins+' || (@request.auth.id != "" && user = @request.auth.id)';profiles.viewRule=profiles.listRule;profiles.updateRule=admins+' || (@request.auth.role = "expert" && user = @request.auth.id && @request.body.user:changed = false)';
 for(const name of ['country_of_residence','city'])if(!profiles.fields.getByName(name))profiles.fields.add(new TextField({name,max:100}));
 profiles.createRule=admins+' || (@request.auth.role = "expert" && @request.body.user = @request.auth.id)';
 app.save(profiles);
 const bank=app.findCollectionByNameOrId('expert_bank_details');bank.listRule=admins;bank.viewRule=admins;bank.updateRule=admins;bank.deleteRule=admins;app.save(bank);
 // The only anonymously readable projection of experts contains public display fields.
 app.save(new Collection({name:'experts_public',type:'view',listRule:'',viewRule:'',viewQuery:'SELECT expert_profiles.id, users.name, expert_profiles.profile_photo, expert_profiles.highest_academic_degree, expert_profiles.degree_title, expert_profiles.specialization_type FROM expert_profiles JOIN users ON expert_profiles.user = users.id WHERE users.role = \'expert\' AND users.is_active = true'}));
 const access=admins+' || (@request.auth.id != "" && (user = @request.auth.id || (@collection.case_experts.case_id ?= id && @collection.case_experts.expert_id ?= @request.auth.id)))';
 cases.listRule=access;cases.viewRule=access;cases.createRule=admins+' || (@request.auth.id != "" && @request.body.user = @request.auth.id && @request.body.is_paid != true && @request.body.payment_amount = 0 && @request.body.status = "pending")';
 cases.updateRule=admins+' || (@request.auth.id != "" && user = @request.auth.id && @request.body.user:changed = false && @request.body.is_paid:changed = false && @request.body.payment_amount:changed = false && (@request.body.status:changed = false || @request.body.status = "under_review"))';cases.deleteRule=admins;app.save(cases);
 allocations.listRule=admins+' || expert_id = @request.auth.id || case_id.user = @request.auth.id';allocations.viewRule=allocations.listRule;allocations.createRule=admins;allocations.updateRule=admins;allocations.deleteRule=admins;app.save(allocations);
 for(const f of [{name:'assigned_expert',type:'relation',collectionId:users.id,maxSelect:1},{name:'specialization',type:'text',max:100},{name:'task_brief',type:'text',max:3000}])if(!tasks.fields.getByName(f.name))tasks.fields.add(f.type==='relation'?new RelationField(f):new TextField(f));
 const taskAccess=admins+' || (@request.auth.id != "" && ((case.user = @request.auth.id && is_visible_to_user = true) || (@collection.case_experts.case_id ?= case && @collection.case_experts.expert_id ?= @request.auth.id && (assigned_expert = "" || assigned_expert = @request.auth.id))))';
 tasks.listRule=taskAccess;tasks.viewRule=taskAccess;tasks.createRule=admins;
 tasks.updateRule=admins+' || (@request.auth.role = "expert" && @request.auth.is_active = true && assigned_expert = @request.auth.id && @request.body.case:changed = false && @request.body.type:changed = false && @request.body.config:changed = false && @request.body.assigned_expert:changed = false && @request.body.specialization:changed = false && @request.body.task_brief:changed = false && @request.body.is_visible_to_user:changed = false)';tasks.deleteRule=admins;app.save(tasks);
 for(const name of ['roles_management','tools']){const c=app.findCollectionByNameOrId(name);c.listRule='@request.auth.id != ""';c.viewRule=c.listRule;c.createRule=admins;c.updateRule=admins;c.deleteRule=admins;app.save(c);}
},()=>{throw new Error('Restore a reviewed backup to revert access rules.');});
