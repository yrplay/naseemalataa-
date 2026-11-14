# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Public Read / Tiered Admin & Staff Write on `/site_content/{docId}`**:
   - Any visitor on any device may perform `get` on `/site_content/{docId}` where `isValidId(docId)` holds (`docId == 'main'`), enabling real-time cross-device synchronization of products, categories, company info, and pages.
   - `list` on `/site_content` is strictly forbidden (`allow list: if false;`) to prevent collection scraping.
   - Only verified Super Administrators (`isSuperAdmin()`, checking `request.auth.token.email == 'yr.play.com@gmail.com' || exists(/databases/$(database)/documents/admins/$(request.auth.uid))`) may `create` `/site_content/{docId}` or modify `authorizedEmails` during `update`.
   - Tier 2 Authorized Staff (`isAuthorizedStaff()`, checking `request.auth.token.email in get(/databases/$(database)/documents/site_content/main).data.authorizedEmails`) may `update` `payloadJson`, `updatedBy`, `version`, and `updatedAt` while keeping `incoming().authorizedEmails == existing().authorizedEmails`.
   - Every `update` on `/site_content/{docId}` must strictly increment version by 1 (`incoming().version == resource.data.version + 1`).
   - Every string field has strict `.size()` bounds (`payloadJson.size() >= 2 && payloadJson.size() <= 900000`, `updatedBy.size() <= 128`), `authorizedEmails` has Total Array Guarding (`size() >= 1 && size() <= 50`), and timestamps (`createdAt`, `updatedAt`) must match `request.time`.
2. **High-Resolution Media Isolation on `/site_media/{mediaId}`**:
   - Publicly readable via `get` (`isValidId(mediaId)`), with `allow list: if false;`.
   - Only verified authorized staff (`isAuthorizedStaff()`) may `create` or `update` media assets, with `dataUrl.size() >= 5 && dataUrl.size() <= 850000` and `mediaId == targetMediaId`.
   - Only `isSuperAdmin()` may `delete` `/site_media/{mediaId}`.
3. **Admin Registry Isolation on `/admins/{adminUid}`**:
   - Only verified super admins (`isSuperAdmin()`) or the owner (`request.auth.uid == adminUid`) may `get` `/admins/{adminUid}`.
   - Only `isSuperAdmin()` may `create` or `delete` admin records, and a super admin is strictly prevented from deleting their own `/admins/{adminUid}` record (`adminUid != request.auth.uid`).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write to `site_content/main`**: `auth = null`, attempts `create` on `/site_content/main` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof on `site_content/main`**: `auth = { uid: 'u1', token: { email: 'yr.play.com@gmail.com', email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Non-Staff Authenticated Write to `site_content/main`**: `auth = { uid: 'intruder', token: { email: 'intruder@example.com', email_verified: true } }` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create (`site_content/main`)**: Super Admin sends `{ payloadJson: '{}', authorizedEmails: ['yr.play.com@gmail.com'], updatedBy: 'admin1', version: 1, createdAt: request.time, updatedAt: request.time, isSuper: true }` -> `PERMISSION_DENIED`.
5. **Tier 2 Staff Attempting to Modify `authorizedEmails`**: Staff member in `authorizedEmails` attempts to add another email to `authorizedEmails` -> `PERMISSION_DENIED`.
6. **Non-Sequential Version Update (`version != resource.data.version + 1`)**: Update sends `version: 99` when `resource.data.version == 1` -> `PERMISSION_DENIED`.
7. **Identity Spoofing on `updatedBy`**: User `uid: 'admin1'` sends `updatedBy: 'someone_else'` -> `PERMISSION_DENIED`.
8. **Timestamp Forgery on Create/Update (`createdAt`/`updatedAt` != `request.time`)**: Client sends forged timestamp -> `PERMISSION_DENIED`.
9. **Immutable `createdAt` Mutation on Update**: Update modifies `createdAt` -> `PERMISSION_DENIED`.
10. **Oversized Payload / Media Poisoning**: `payloadJson` > 900,000 chars or `dataUrl` > 850,000 chars -> `PERMISSION_DENIED`.
11. **Self-Deletion of Super Admin Record**: Super Admin `uid: 'admin1'` attempts `delete` on `/admins/admin1` -> `PERMISSION_DENIED`.
12. **Self-Privilege Escalation in `/admins/{uid}`**: Non-admin user attempts to create `/admins/intruder` -> `PERMISSION_DENIED`.

## 3. Conflict & Red Team Audit Report
- **Identity Spoofing**: Blocked via `data.updatedBy == request.auth.uid` inside `isValidSiteContent` and `isValidSiteMedia`.
- **Privilege Escalation**: Blocked by restricting `authorizedEmails` updates and `/admins/{adminUid}` mutations strictly to `isSuperAdmin()`.
- **Self-Lockout Guard**: Blocked via `adminUid != request.auth.uid` on `delete` in `/admins/{adminUid}`.
- **Version Rollback / Race Protection**: Enforced via `incoming().version == resource.data.version + 1` on `/site_content/{docId}` updates.
