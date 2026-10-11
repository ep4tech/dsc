// Development-only baseline inferred from application types. Never deploy to production.
migrate((app) => {
  const admin = '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.role = "super_admin")';
  const text = (names) => names.split(' ').filter(Boolean).map(name => ({name,type:'text'}));
  const dates = [{name:'created',type:'autodate',onCreate:true},{name:'updated',type:'autodate',onCreate:true,onUpdate:true}];
  const users = app.findCollectionByNameOrId('users');
  for (const field of [...text('name role contact_number organization_name user_type message'),{name:'is_active',type:'bool'},{name:'avatar',type:'file',maxSelect:1},{name:'attachments',type:'file',maxSelect:10}]) users.fields.add(field.type === 'text' ? new TextField(field) : field.type === 'bool' ? new BoolField(field) : new FileField(field));
  users.listRule = admin + ' || (role = "expert" && is_active = true) || id = @request.auth.id';
  users.viewRule = users.listRule;
  users.createRule = admin + ' || (@request.body.role != "admin" && @request.body.role != "super_admin" && @request.body.is_active != true)';
  users.updateRule = admin + ' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.is_active:changed = false)';
  users.deleteRule = admin;
  users.manageRule = admin;
  app.save(users);
  const make = (name, fields, rules = {}) => {
    const collection = new Collection({name,type:'base',fields:[...fields,...dates],listRule:admin,viewRule:admin,createRule:admin,updateRule:admin,deleteRule:admin,...rules});
    app.save(collection); return collection;
  };
  const relation = {name:'user',type:'relation',collectionId:users.id,maxSelect:1,required:true,cascadeDelete:true};
  const expert = make('expert_profiles', [relation,...text('full_legal_name country_of_residence city whatsapp_country_code whatsapp_number highest_academic_degree degree_title field_of_study consultation_mode fee availability bio'),{name:'age_group',type:'json'},{name:'specialization_type',type:'json'},{name:'profile_photo',type:'file',maxSelect:1},{name:'cv',type:'file',maxSelect:10,protected:true}], {listRule:admin+' || (user.role = "expert" && user.is_active = true) || user = @request.auth.id',viewRule:admin+' || (user.role = "expert" && user.is_active = true) || user = @request.auth.id',createRule:'@request.auth.id != "" && @request.body.user = @request.auth.id',updateRule:admin+' || user = @request.auth.id'});
  for (const [name, fields] of [['parent_profiles','country_of_residence notes'],['individual_profiles','gender date_of_birth country_of_residence emergency_contact_name emergency_contact_phone notes'],['organization_profiles','organization_name organization_type country city website responsible_person_name responsible_person_title responsible_person_phone notes']]) make(name,[relation,...text(fields)],{createRule:'@request.auth.id != "" && @request.body.user = @request.auth.id',listRule:admin+' || user = @request.auth.id',viewRule:admin+' || user = @request.auth.id'});
  make('lookups',[...text('key type label_en label_ar'),{name:'order',type:'number'},{name:'is_active',type:'bool'}],{listRule:'',viewRule:''});
  const category = make('blog_categories',text('key label_en label_ar'),{listRule:'',viewRule:''});
  for (const name of ['blog_pages','home_pages','info_pages']) make(name,[...text('slug portal_name title_en title_ar content_en content_ar author_name icon'),{name:'category',type:'relation',collectionId:category.id,maxSelect:1},{name:'is_published',type:'bool'},{name:'order',type:'number'},{name:'media',type:'file',maxSelect:10},{name:'thumbnail',type:'file',maxSelect:1}],{listRule:'is_published = true || '+admin,viewRule:'is_published = true || '+admin});
  make('settings',[...text('key value'),{name:'data',type:'json'}],{listRule:'',viewRule:''});
  // Other modules start with empty records until their production schema is available.
  for (const name of ['cases','case_experts','case_tools','tools','tool_types','roles_management']) make(name,[relation,...text('expert_id title name status')]);
  const record = new Record(users);
  record.set('email','admin@dsc.local'); record.set('password','LocalDSC!2026'); record.set('passwordConfirm','LocalDSC!2026'); record.set('name','Local Development Admin'); record.set('role','super_admin'); record.set('is_active',true); record.set('verified',true); app.save(record);
  for(let i=1;i<=4;i++) {
    const user = new Record(users); user.set('email',`expert${i}@dsc.local`);user.set('password','LocalDSC!2026');user.set('name',`Demo Expert ${i}`);user.set('role','expert');user.set('is_active',true);app.save(user);
    const profile = new Record(expert);profile.set('user',user.id);profile.set('bio','Local demonstration profile for development.');profile.set('specialization_type',['Education']);app.save(profile);
  }
}, () => {});
