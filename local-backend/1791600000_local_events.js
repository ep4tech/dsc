// Local-only event collections. Production must use its reviewed schema.
migrate((app) => {
 const admin='@request.auth.role = "admin" || @request.auth.role = "super_admin"';
 const fields=(names,type)=>names.split(' ').map(name=>({name,type}));
 const dates=[{name:'created',type:'autodate',onCreate:true},{name:'updated',type:'autodate',onCreate:true,onUpdate:true}];
 const make=(name,extra,rules={})=>{const c=new Collection({name,type:'base',fields:[...extra,...dates],listRule:admin,viewRule:admin,createRule:admin,updateRule:admin,deleteRule:admin,...rules});app.save(c);return c};
 const common=[...fields('duration max_participants current_registrations','number'),...fields('status type location coordinator notes meeting_link recording_url','text'),{name:'is_public',type:'bool'},{name:'thumbnail',type:'file',maxSelect:2}];
 make('programs',[...common,...fields('name category trainer_name goals schedule','json')],{listRule:'is_public = true || '+admin,viewRule:'is_public = true || '+admin});
 const lectures=make('public_lectures',[...common,...fields('title description speaker schedule','json')],{listRule:'is_public = true || '+admin,viewRule:'is_public = true || '+admin});
 app.save(new Collection({name:'public_lectures_public',type:'view',viewQuery:'SELECT id, title, description, speaker, schedule, duration, thumbnail, status, is_public, current_registrations, created, updated FROM public_lectures WHERE is_public = true',listRule:'',viewRule:''}));
 make('event_registrations',fields('program_id lecture_id user_id user_name email phone registered_at status certificate_id notes','text'));
 make('event_certificates',[...fields('user_id program_id user_name certificate_number issue_date notes','text'),{name:'program_name',type:'json'},{name:'file',type:'file',maxSelect:1}]);
},()=>{});
