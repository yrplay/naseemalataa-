import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
const context = fs.readFileSync(path.resolve(process.cwd(), 'src/context/SiteContext.tsx'), 'utf8');
const loginGate = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminLoginGate.tsx'), 'utf8');

test('staff identities are private and only super-admin can enumerate profiles', () => {
  assert.ok(rules.includes('match /staff_profiles/{staffUid}'));
  assert.ok(rules.includes('allow list: if isSuperAdmin()'));
  assert.ok(rules.includes('request.auth.uid == staffUid || isSuperAdmin()'));
  assert.ok(rules.includes('get(/databases/$(database)/documents/staff_profiles/$(request.auth.uid)).data.active == true'));
});

test('public storefront payload excludes staff directory and access codes', () => {
  const start = context.indexOf('function buildPublicCopyObject');
  const end = context.indexOf('function offloadLargeImagesForFirestore', start);
  assert.ok(start >= 0 && end > start);
  const builder = context.slice(start, end);
  assert.ok(!builder.includes('staffMembers'));
  assert.ok(!builder.includes('accessCode'));
  assert.ok(!context.includes("localStorage.getItem(ADMIN_SESSION_KEY)"));
});

test('admin privileges require a private UID-bound grant, never a hard-coded email or public allowlist', () => {
  assert.ok(rules.includes("admin.role == 'super_admin'") || rules.includes(".data.role == 'super_admin'"));
  assert.ok(rules.includes(".data.uid == request.auth.uid"));
  assert.ok(!rules.includes("request.auth.token.email == 'yr.play.com@gmail.com'"));
  assert.ok(!loginGate.includes('authorizedEmails'));
  assert.ok(!loginGate.includes("cleanEmail === 'yr.play.com@gmail.com'"));
  assert.ok(rules.includes('allow create, update, delete: if false'));
});

test('CMS publishing is restricted to private super-admin records and legacy allowlist can only be removed', () => {
  assert.ok(rules.includes("allow update: if isSuperAdmin() && docId == 'main'"));
  assert.ok(rules.includes('request.resource.data.version == resource.data.version + 1'));
  assert.ok(rules.includes("!request.resource.data.keys().hasAny(['authorizedEmails'])"));
});
