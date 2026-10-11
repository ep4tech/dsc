// Local development fixtures only; never run against a production server.
import PocketBase from 'pocketbase';
const pb=new PocketBase('http://127.0.0.1:8090');
await pb.collection('users').authWithPassword('admin@dsc.local','LocalDSC!2026');
async function ensure(collection,filter,data){if(collection==='users'){const existing=(await pb.collection('users').getFullList()).find(user=>user.email===data.email);return existing ?? pb.collection(collection).create(data)}try{return await pb.collection(collection).getFirstListItem(filter)}catch(e){if(e.status!==404)throw e;return pb.collection(collection).create(data)}}
const organization=await ensure('users','email="organization@dsc.local"',{email:'organization@dsc.local',password:'LocalDSC!2026',passwordConfirm:'LocalDSC!2026',role:'organization',name:'Demo Organization',is_active:true});
await ensure('organization_profiles',`user="${organization.id}"`,{user:organization.id,organization_name:'Demo Organization',country:'Jordan',city:'Amman'});
const roles=['educational_support','assessment_and_diagnosis','training_and_workshops','special_education'];
let firstExpert;
const experts=await pb.collection('users').getFullList({filter:'role="expert"'});
for(let i=1;i<=4;i++){const user=experts.find(expert=>expert.email===`expert${i}@dsc.local`);if(!user)throw new Error(`Missing local demo expert ${i}`);if(i===1)firstExpert=user;const profile=await pb.collection('expert_profiles').getFirstListItem(`user="${user.id}"`);await pb.collection('expert_profiles').update(profile.id,{highest_academic_degree:'doctorate_phd',degree_title:'',specialization_type:[roles[i-1]],country_of_residence:'Jordan',city:i%2?'Amman':'Irbid'});}
const type=await pb.collection('lookups').getFirstListItem('type="tool_types" && key="report"');
const role=await ensure('roles_management','role_name_en="Learning support"',{role_name_en:'Learning support',role_name_ar:'الدعم التعليمي',tool_types:[type.id]});
const project=await ensure('cases',`user="${organization.id}" && name="Demo learning project"`,{user:organization.id,name:'Demo learning project',date_of_birth:'2026-10-10',grade:'Training',notes:'Local demo project for reviewing creation, editing and expert tasks.',service_type:'organization',status:'pending',case_details:{project_name:'Demo learning project',project_type:'Training',start_date:'2026-10-10',end_date:'2026-11-10'}});
await ensure('case_experts',`case_id="${project.id}" && expert_id="${firstExpert.id}"`,{case_id:project.id,expert_id:firstExpert.id,role:role.role_name_en});
await ensure('case_tools',`case="${project.id}" && name_en="Learning review"`,{case:project.id,type:type.id,name_en:'Learning review',name_ar:'مراجعة تعليمية',status:'assigned',assigned_expert:firstExpert.id,specialization:'educational_support',task_brief:'Review the project learning needs and record recommended next steps.',is_visible_to_user:true,responses:{}});
console.log('Local demonstration organization, project, profiles and expert task are ready.');
