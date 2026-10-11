import assert from 'node:assert/strict';
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
await pb.collection('users').authWithPassword('admin@dsc.local', 'LocalDSC!2026');
const expert = (await pb.collection('users').getFullList({ filter: 'role="expert"' }))[0];
const profile = await pb.collection('expert_profiles').getFirstListItem(`user="${expert.id}"`);
const saved = { short_bio_en: profile.short_bio_en || '', short_bio_ar: profile.short_bio_ar || '' };
const display = { public_name_en: 'Bilingual display expert', public_name_ar: 'خبير العرض بلغتين', public_qualification_en: 'Educational counselling certificate', public_qualification_ar: 'شهادة الإرشاد التربوي', public_specialty_en: 'Learning support', public_specialty_ar: 'الدعم التعليمي' };
for (const field of Object.keys(display)) saved[field] = profile[field] || '';
try {
  await pb.collection('expert_profiles').update(profile.id, display);
  const value = 'a '.repeat(124) + '!?';
  assert.equal(value.length, 250);
  await pb.collection('expert_profiles').update(profile.id, { short_bio_en: value, short_bio_ar: 'نبذة قصيرة، تشمل المسافات وعلامات الترقيم.' });
  const anonymous = new PocketBase(pb.baseURL);
  const publicRecord = await anonymous.collection('experts_public').getOne(profile.id);
  assert.equal(publicRecord.short_bio_en, value);
  assert.equal(publicRecord.short_bio_ar, 'نبذة قصيرة، تشمل المسافات وعلامات الترقيم.');
  assert.equal(publicRecord.bio, undefined);
  assert.equal(publicRecord.highest_academic_degree, undefined);
  for (const [field, value] of Object.entries(display)) assert.equal(publicRecord[field], value);
  assert.ok((await pb.collection('expert_profiles').getOne(profile.id)).highest_academic_degree);
  for (const field of ['short_bio_en', 'short_bio_ar']) {
    await assert.rejects(pb.collection('expert_profiles').update(profile.id, { [field]: ' '.repeat(250) + '!' }), error => error.status === 400);
  }
  await pb.collection('expert_profiles').update(profile.id, { short_bio_en: '', short_bio_ar: '' });
  assert.equal((await anonymous.collection('experts_public').getOne(profile.id)).short_bio_en, '');
  console.log('PASS: bilingual names/certificates/specialties/biographies, biography bounds including spaces/punctuation, and highest academic qualification retained privately and excluded from public display.');
} finally {
  await pb.collection('expert_profiles').update(profile.id, saved);
}
