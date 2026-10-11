const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('lib/portal-journey.ts', 'utf8');
const moduleState = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: moduleState.exports });
const { portalJourneyHref } = moduleState.exports;
for (const [portal, expected] of [['1','/register/parent'],['2','/register/individual'],['4','/register/individual'],['5','/register/organization']]) assert.equal(portalJourneyHref(portal), expected);
for (const portal of ['1','2','4','5']) {
  for (const [role, expected] of [['parent','/dashboard/parent/cases'],['individual','/dashboard/individual/cases'],['organization','/dashboard/institution/projects'],['expert','/dashboard/expert/cases'],['admin','/dashboard/admin/cases'],['super_admin','/dashboard/admin/cases']]) assert.equal(portalJourneyHref(portal, role), expected);
}
assert.equal(portalJourneyHref('unknown'), '/register');
console.log('PASS: portal-specific guest registration and every signed-in role routes to its own cases/projects across all portals.');
