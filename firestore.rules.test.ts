import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

test('firestore.rules enforces all 8 pillars, Tier 1 Super Admin, Tier 2 Staff RBAC, version safety, and self-delete prevention', () => {
  // 1. Default deny catch-all
  assert.ok(rulesContent.includes('match /{document=**}'));
  assert.ok(rulesContent.includes('allow read, write: if false;'));

  // 2. Email verification, isSuperAdmin(), and isAuthorizedStaff() checks
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes("request.auth.token.email == 'yr.play.com@gmail.com'"));
  assert.ok(rulesContent.includes('function isSuperAdmin()'));
  assert.ok(
    rulesContent.includes('exists(/databases/$(database)/documents/admins/$(request.auth.uid))')
  );
  assert.ok(rulesContent.includes('function isAuthorizedStaff()'));
  assert.ok(
    rulesContent.includes(
      'request.auth.token.email in get(/databases/$(database)/documents/site_content/main).data.authorizedEmails'
    )
  );

  // 3. Strict schema keys, Total Array Guarding on authorizedEmails, version increment, and size limits for SiteContent
  assert.ok(
    rulesContent.includes(
      "data.keys().hasAll(['payloadJson', 'authorizedEmails', 'updatedBy', 'version', 'createdAt', 'updatedAt'])"
    )
  );
  assert.ok(rulesContent.includes('data.authorizedEmails.size() <= 50'));
  assert.ok(rulesContent.includes('data.authorizedEmails[0] is string'));
  assert.ok(rulesContent.includes('data.payloadJson.size() <= 900000'));
  assert.ok(rulesContent.includes('data.updatedBy == request.auth.uid'));
  assert.ok(rulesContent.includes('incoming().version == resource.data.version + 1'));

  // 4. Tier 2 Staff cannot mutate authorizedEmails, and Super Admins cannot delete their own /admins/{uid} record
  assert.ok(rulesContent.includes('incoming().authorizedEmails == existing().authorizedEmails'));
  assert.ok(rulesContent.includes('request.auth.token.email in existing().authorizedEmails'));
  assert.ok(rulesContent.includes('adminUid != request.auth.uid'));

  // 5. SiteMedia chunked storage rules enforce strict schema, size limit (<= 850000), and authorized staff access
  assert.ok(rulesContent.includes('match /site_media/{mediaId}'));
  assert.ok(rulesContent.includes('isValidSiteMedia(incoming(), mediaId)'));
  assert.ok(rulesContent.includes('data.dataUrl.size() <= 850000'));
});
