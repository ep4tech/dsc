const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(path, dependency) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:()=>dependency});
 return exports;
}
const validators=load('lib/validators.ts');
const {validateContact,escapeContactHtml}=load('lib/contact-validation.ts',validators);
const valid={name:'Local QA',email:'qa@example.test',countryCode:'+962',phoneNumber:'790000000',description:'A valid message for the contact form.'};
assert.equal(Object.keys(validateContact(valid)).length,0);
for(const [field,value] of [['name',' '],['name','x'.repeat(101)],['email','invalid'],['email','x'.repeat(255)+'@test.example'],['countryCode',''],['phoneNumber','123456'],['phoneNumber','1'.repeat(16)],['phoneNumber','7900abc00'],['description','short'],['description','x'.repeat(2001)]])assert.ok(validateContact({...valid,[field]:value})[field],field);
assert.equal(Object.keys(validateContact({...valid,name:'xy',description:'x'.repeat(10),phoneNumber:'1'.repeat(7)})).length,0);
assert.notEqual(validateContact({...valid,name:''},'ar').name,validateContact({...valid,name:''},'en').name);
assert.equal(escapeContactHtml('<script>"x"&'), '&lt;script&gt;&quot;x&quot;&amp;');
console.log('Contact bounds, localization, phone/email formats and HTML escaping passed.');
