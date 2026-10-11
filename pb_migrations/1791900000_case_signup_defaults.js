migrate((app)=>{
 const cases=app.findCollectionByNameOrId('cases');
 const admin='@request.auth.id != "" && @request.auth.is_active = true && (@request.auth.role = "admin" || @request.auth.role = "super_admin")';
 cases.createRule=admin+' || (@request.auth.id != "" && @request.body.user = @request.auth.id && (@request.body.is_paid:isset = false || @request.body.is_paid = false) && (@request.body.payment_amount:isset = false || @request.body.payment_amount = 0) && @request.body.status = "pending")';
 app.save(cases);
},()=>{});
