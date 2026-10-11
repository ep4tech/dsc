import assert from 'node:assert/strict';
import PocketBase from 'pocketbase';
const url='http://127.0.0.1:8090';
const admin=new PocketBase(url),root=new PocketBase(url),anon=new PocketBase(url);
await admin.collection('users').authWithPassword('admin@dsc.local','LocalDSC!2026');
await root.collection('_superusers').authWithPassword('admin@dsc.local','LocalDSC!2026');
const created=[];let backup;
async function create(c,d,p=root){const r=await p.collection(c).create(d);created.push([c,r.id]);return r;}
async function login(email){const p=new PocketBase(url);await p.collection('users').authWithPassword(email,'LocalDSC!2026');return p;}
const denied=async f=>assert.rejects(f);
try{
 const expert=await login('expert1@dsc.local'),other=await login('expert2@dsc.local');
 const ownerRecord=await create('users',{email:`feedback-qa-${Date.now()}@dsc.local`,password:'LocalDSC!2026',passwordConfirm:'LocalDSC!2026',name:'Temporary Feedback QA',role:'individual',is_active:true});
 const owner=await login(ownerRecord.email);
 const caseRecord=await create('cases',{user:ownerRecord.id,name:'Temporary feedback case',status:'pending',service_type:'individual'});
 const message=await create('internal_messages',{sender:expert.authStore.record.id,recipient:admin.authStore.record.id,body:'Temporary private message'},expert);
 assert.equal((await admin.collection('internal_messages').getOne(message.id)).body,'Temporary private message');
 await denied(()=>other.collection('internal_messages').getOne(message.id));
 await denied(()=>anon.collection('internal_messages').getOne(message.id));
 await denied(()=>expert.collection('internal_messages').update(message.id,{read:true}));
 await denied(()=>admin.collection('internal_messages').update(message.id,{body:'Changed'}));
 await admin.collection('internal_messages').update(message.id,{read:true});
 assert.equal((await expert.collection('internal_messages').getOne(message.id)).read,true);
 await denied(()=>expert.collection('internal_messages').create({sender:admin.authStore.record.id,recipient:other.authStore.record.id,body:'Spoof'}));
 await denied(()=>expert.collection('internal_messages').create({sender:expert.authStore.record.id,recipient:other.authStore.record.id,body:'Expert to expert'}));
 const contacts=await expert.send('/api/dsc/message-contacts');assert.ok(contacts.length);assert.ok(contacts.every(x=>['admin','super_admin'].includes(x.role)&&!('email' in x)));
 await denied(()=>owner.send('/api/dsc/message-contacts'));
 const feedback=await create('case_feedback',{case:caseRecord.id,author:ownerRecord.id,rating:5,comment:''},owner);
 await owner.collection('case_feedback').update(feedback.id,{rating:4,comment:'Helpful support'});
 assert.equal((await admin.collection('case_feedback').getOne(feedback.id)).rating,4);
 await denied(()=>other.collection('case_feedback').getOne(feedback.id));
 const role=(await root.collection('roles_management').getList(1,1)).items[0];
 assert.ok(role,'A local expert assignment role is required');
 await create('case_experts',{case_id:caseRecord.id,expert_id:expert.authStore.record.id,role:role.role_name_en});
 assert.equal((await expert.collection('case_feedback').getOne(feedback.id)).rating,4);
 await denied(()=>expert.collection('case_feedback').update(feedback.id,{rating:1}));
 await denied(()=>owner.collection('case_feedback').update(feedback.id,{author:expert.authStore.record.id}));
 await denied(()=>owner.collection('case_feedback').create({case:caseRecord.id,author:ownerRecord.id,rating:3}));
 await denied(()=>owner.collection('case_feedback').update(feedback.id,{rating:6}));
 await denied(()=>owner.collection('case_feedback').update(feedback.id,{rating:1.5}));
 await denied(()=>owner.collection('case_feedback').update(feedback.id,{comment:'x'.repeat(2001)}));
 await denied(()=>anon.send('/api/dsc/backups'));
 await denied(()=>expert.send('/api/dsc/backups',{method:'POST',body:{}}));
 await denied(()=>admin.send('/api/dsc/backups/download',{method:'POST',body:{name:'../data.db'}}));
 const b=await admin.send('/api/dsc/backups',{method:'POST',body:{}});backup=b.name;
 const list=await admin.send('/api/dsc/backups');assert.ok(list.some(x=>x.name===backup&&x.size>0));
 const download=await fetch(url+'/api/dsc/backups/download',{method:'POST',headers:{Authorization:admin.authStore.token,'Content-Type':'application/json'},body:JSON.stringify({name:backup})});
 assert.equal(download.status,200);const bytes=new Uint8Array(await download.arrayBuffer());assert.equal(String.fromCharCode(...bytes.slice(0,2)),'PK');
 console.log('PASS private messages, read-only updates, role-scoped contacts, owner feedback editing, bounds, admin-only backup creation and ZIP download.');
}finally{
 for(const [c,id]of created.reverse())await root.collection(c).delete(id);
 if(backup)await root.backups.delete(backup);
}
