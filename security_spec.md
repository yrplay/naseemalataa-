# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Public Read / Admin-Only Write on `/site_content/{docId}`**:
   - Any visitor on any device may perform `get` on `/site_content/{docId}` where `isValidId(docId)` holds (`docId == 'main'`), enabling real-time cross-device synchronization of products, categories, company info, and pages.
   - `list` on `/site_content` is strictly forbidden (`allow list: if false;`) to prevent collection scraping.
   - Only verified administrators (`isAdmin()`) may `create` or `update` `/site_content/{docId}`, and `updatedBy` must equal `request.auth.uid`.
   - Every string field has strict `.size()` bounds (`payloadJson.size() >= 2 && payloadJson.size() <= 900000`, `updatedBy.size() <= 128`), and timestamps (`createdAt`, `updatedAt`) must match `request.time`.
2. **Admin Registry Isolation on `/admins/{adminUid}`**:
   - Only verified admins (`isAdmin()`) or the owner (`request.auth.uid == adminUid`) may `get` `/admins/{adminUid}`.
   - Only the bootstrapped primary admin (`request.auth.token.email == 'yr.play.com@gmail.com' && request.auth.token.email_verified == true`) or existing admins may create/delete admin records.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write to `site_content/main`**: `auth = null`, attempts `create` on `/site_content/main` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof on `site_content/main`**: `auth = { uid: 'u1', token: { email: 'yr.play.com@gmail.com', email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Non-Admin Authenticated Write to `site_content/main`**: `auth = { uid: 'intruder', token: { email: 'intruder@example.com', email_verified: true } }` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create (`site_content/main`)**: Admin sends `{ payloadJson: '{}', updatedBy: 'admin1', version: 1, createdAt: request.time, updatedAt: request.time, isSuper: true }` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update (`site_content/main`)**: Admin updates `site_content/main` adding extra field `hacked: true` -> `PERMISSION_DENIED`.
6. **Identity Spoofing on `updatedBy`**: Admin `uid: 'admin1'` sends `updatedBy: 'someone_else'` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery on Create (`createdAt` != `request.time`)**: Admin sends past/future `createdAt` -> `PERMISSION_DENIED`.
8. **Timestamp Forgery on Update (`updatedAt` != `request.time`)**: Admin sends past/future `updatedAt` -> `PERMISSION_DENIED`.
9. **Immutable `createdAt` Mutation on Update**: Admin modifies `createdAt` during `update` -> `PERMISSION_DENIED`.
10. **Oversized ID Poisoning**: Request to `/site_content/<200-char-id>` -> `PERMISSION_DENIED`.
11. **Value Poisoning (`version` as string instead of int/number)**: Admin sends `version: 'one'` -> `PERMISSION_DENIED`.
12. **Self-Privilege Escalation in `/admins/{uid}`**: Non-admin user attempts to create `/admins/intruder` -> `PERMISSION_DENIED`.

## 3. Conflict & Red Team Audit Report
- **Identity Spoofing**: Blocked via `data.updatedBy == request.auth.uid` inside `isValidSiteContent`.
- **Shadow Updates**: Blocked via `data.keys().hasAll(...) && data.keys().hasOnly(...)` on create and `incoming().diff(existing()).affectedKeys().hasOnly(['payloadJson', 'updatedBy', 'version', 'updatedAt'])` on update.
- **Email Spoofing**: Blocked via mandatory `request.auth.token.email_verified == true` check inside `isAdmin()`.
- **Resource Poisoning**: Blocked via `isValidId(docId)` and `.size() <= 900000` on `payloadJson`.
