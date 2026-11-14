import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
const context = fs.readFileSync(path.resolve(process.cwd(), 'src/context/SiteContext.tsx'), 'utf8');
test('employee identities are private and only super-admin can enumerate profiles', () => {
  assert.ok(rules.includes('match /staff_profiles/{staffUid}'));
  assert.ok(rules.includes('allow list: if isSuperAdmin()'));
  assert.ok(rules.includes('request.auth.uid == staffUid || isSuperAdmin()'));
  assert.ok(rules.includes('get(/databases/$(database)/documents/staff_profiles/$(request.auth.uid)).data.active == true'));
  assert.ok(!rules.includes("'authorizedEmails'"));
});
test('public storefront payload excludes staff directory and access codes', () => {
  const start = context.indexOf('function buildPublicCopyObject');
  const end = context.indexOf('function offloadLargeImagesForFirestore', start);
  assert.ok(start >= 0 && end > start);
  const builder = context.slice(start, end);
  assert.ok(!builder.includes('staffMembers'));
  assert.ok(!builder.includes('accessCode'));
});
test('CMS publishing is super-admin-only until granular server-side RBAC exists', () => {
  assert.ok(rules.includes('allow update: if isSuperAdmin() && isValidId(docId)'));
  assert.ok(rules.includes('request.resource.data.version == resource.data.version + 1'));
});
