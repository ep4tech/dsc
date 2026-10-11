migrate((app)=>{
 const c=app.findCollectionByNameOrId('case_feedback');const field=c.fields.getByName('comment');field.required=false;field.min=0;c.fields.add(field);
 c.updateRule='@request.auth.id != "" && @request.auth.is_active = true && author = @request.auth.id && case.user = @request.auth.id && @request.body.author:changed = false && @request.body.case:changed = false';
 c.indexes=['CREATE UNIQUE INDEX idx_feedback_owner_case ON case_feedback ("case", author)'];app.save(c);
},()=>{});
