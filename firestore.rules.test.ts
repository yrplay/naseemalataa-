import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

test('firestore.rules enforces all 8 pillars, Tier 1 Super Admin, and Tier 2 Staff RBAC', () => {
  // 1. Default deny catch-all
  assert.ok(rulesContent.includes('match /{document=**}'));
  assert.ok(rulesContent.includes('allow read, write: if false;'));

  // 2. Email verification & bootstrapped admin check
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes("request.auth.token.email == 'yr.play.com@gmail.com'"));

  // 3. Strict schema keys, Total Array Guarding on authorizedEmails, and size limits for SiteContent
  assert.ok(
    rulesContent.includes(
      "data.keys().hasAll(['payloadJson', 'authorizedEmails', 'updatedBy', 'version', 'createdAt', 'updatedAt'])"
    )
  );
  assert.ok(rulesContent.includes('data.authorizedEmails.size() <= 50'));
  assert.ok(rulesContent.includes('data.authorizedEmails[0] is string'));
  assert.ok(rulesContent.includes('data.payloadJson.size() <= 900000'));
  assert.ok(rulesContent.includes('data.updatedBy == request.auth.uid'));

  // 4. Tier 2 Staff cannot mutate authorizedEmails
  assert.ok(rulesContent.includes('incoming().authorizedEmails == existing().authorizedEmails'));
  assert.ok(rulesContent.includes('request.auth.token.email in existing().authorizedEmails'));

  // 5. SiteMedia chunked storage rules enforce strict schema, size limit (<= 850000), and authorized staff access
  assert.ok(rulesContent.includes('match /site_media/{mediaId}'));
  assert.ok(rulesContent.includes('isValidSiteMedia(incoming(), mediaId)'));
  assert.ok(rulesContent.includes('data.dataUrl.size() <= 850000'));
});
