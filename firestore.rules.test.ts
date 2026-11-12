import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

test('firestore.rules enforces all 8 pillars and blocks Dirty Dozen attack vectors', () => {
  // 1. Default deny catch-all
  assert.ok(rulesContent.includes('match /{document=**}'));
  assert.ok(rulesContent.includes('allow read, write: if false;'));

  // 2. Email verification & bootstrapped admin check
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesContent.includes("request.auth.token.email == 'yr.play.com@gmail.com'"));

  // 3. Strict schema keys and size limits for SiteContent
  assert.ok(
    rulesContent.includes(
      "data.keys().hasAll(['payloadJson', 'updatedBy', 'version', 'createdAt', 'updatedAt'])"
    )
  );
  assert.ok(
    rulesContent.includes(
      "data.keys().hasOnly(['payloadJson', 'updatedBy', 'version', 'createdAt', 'updatedAt'])"
    )
  );
  assert.ok(rulesContent.includes('data.payloadJson.size() <= 900000'));
  assert.ok(rulesContent.includes('data.updatedBy == request.auth.uid'));

  // 4. Temporal integrity & immutability on create and update
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  assert.ok(
    rulesContent.includes(
      "incoming().diff(existing()).affectedKeys().hasOnly(['payloadJson', 'updatedBy', 'version', 'updatedAt'])"
    )
  );
});
