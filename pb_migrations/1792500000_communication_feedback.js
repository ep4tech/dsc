migrate((app) => {
 const users=app.findCollectionByNameOrId('users'), cases=app.findCollectionByNameOrId('cases');
 const active='@request.auth.id != "" && @request.auth.is_active = true';
 const admin='('+active+' && (@request.auth.role = "admin" || @request.auth.role = "super_admin"))';
 function make(name,fields){const c=new Collection({name,type:'base'});fields.forEach(f=>c.fields.add(f));c.fields.add(new AutodateField({name:'created',onCreate:true}));c.fields.add(new AutodateField({name:'updated',onCreate:true,onUpdate:true}));app.save(c);return c;}
 const m=make('internal_messages',[
 new RelationField({name:'sender',collectionId:users.id,required:true,maxSelect:1}),
 new RelationField({name:'recipient',collectionId:users.id,required:true,maxSelect:1}),
 new TextField({name:'body',required:true,min:1,max:4000}),new BoolField({name:'read'})]);
 m.listRule=active+' && (sender = @request.auth.id || recipient = @request.auth.id)';m.viewRule=m.listRule;
 m.createRule=active+' && sender = @request.auth.id && read = false && recipient.is_active = true && ((@request.auth.role = "expert" && (recipient.role = "admin" || recipient.role = "super_admin")) || (('+admin+') && recipient.role = "expert"))';
 m.updateRule=active+' && recipient = @request.auth.id && @request.body.sender:changed = false && @request.body.recipient:changed = false && @request.body.body:changed = false';
 m.deleteRule=null;app.save(m);
 const f=make('case_feedback',[
 new RelationField({name:'case',collectionId:cases.id,required:true,maxSelect:1}),new RelationField({name:'author',collectionId:users.id,required:true,maxSelect:1}),
 new NumberField({name:'rating',required:true,min:1,max:5,onlyInt:true}),new TextField({name:'comment',max:2000})]);
 f.listRule=active+' && ('+admin+' || case.user = @request.auth.id || (@collection.case_experts.case_id ?= case && @collection.case_experts.expert_id ?= @request.auth.id))';f.viewRule=f.listRule;
 f.createRule=active+' && author = @request.auth.id && case.user = @request.auth.id';
 f.updateRule=active+' && author = @request.auth.id && case.user = @request.auth.id && @request.body.author:changed = false && @request.body.case:changed = false';
 f.indexes=['CREATE UNIQUE INDEX idx_feedback_owner_case ON case_feedback ("case", author)'];f.deleteRule=null;app.save(f);
},()=>{throw new Error('Restore a reviewed backup to revert communication data.');});
