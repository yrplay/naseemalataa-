# Firestore security rollout

This change set intentionally fails closed. Do not publish the new Firestore rules until the first super-admin grant has been prepared.

## 1. Prepare the initial super-admin grant

1. In Firebase Console, open Authentication and locate the intended owner account.
2. Copy that account's Firebase Auth UID. Confirm the email is verified.
3. In Firestore, create the document `admins/{AUTH_UID}` with exactly these fields:
   - `uid` (string): the same Firebase Auth UID
   - `email` (string): the verified account email, lowercase
   - `role` (string): `super_admin`
   - `active` (boolean): `true`

Create this record using Firebase Console or a trusted Admin SDK environment. Client-side creation is deliberately denied by the rules.

## 2. Publish the rules

Publish the repository's `firestore.rules` in Firebase Console (or through an authenticated Firebase CLI environment). This repository currently has no Firebase deployment configuration or automated rules-deployment workflow, so a Vercel deployment does not publish Firestore rules.

## 3. Remove legacy public authorization data

The old `site_content/main` document may still contain the legacy `authorizedEmails` field. After the initial super-admin grant and rules are in place, sign in as that super-admin and publish the site once. The application issues a one-way field deletion. Alternatively, delete that field manually in Firebase Console.

Do not leave staff email allowlists or staff records in the public `site_content/main` document.

## 4. Add staff

Create each staff account in Firebase Authentication, verify its email, and copy its UID. Then use the staff-management panel while signed in as the super-admin. Staff profiles are stored under `staff_profiles/{UID}`; a profile is accepted only when its UID and verified token email match.

## 5. Verify before production

Test at least these cases with the Firebase Emulator Suite or a non-production Firebase project:

- Anonymous visitor can read `site_content/main` but cannot read staff profiles or write CMS content.
- A verified ordinary visitor cannot read the staff directory or write CMS content.
- A verified active staff member can read only their own staff profile.
- An inactive staff member is denied.
- Only a matching active `admins/{UID}` super-admin grant can list staff profiles, write CMS content, and manage staff profiles.
- A user cannot create or modify their own `admins/{UID}` grant.

The current repository tests include static source assertions; they are not a substitute for Firestore Emulator authorization tests.

## Operational cautions

- Do not merge this branch or route production traffic to it until the initial admin grant is confirmed, the rules are published, and the sign-in and publishing flows are tested.
- Rotate any credentials that were previously committed or embedded in client code. Removing them from the current tree does not remove them from Git history.
- The current CMS write rule is intentionally super-admin-only. Granular staff editing requires a server-side design that validates each permission against the specific changed content; the client-side permission UI alone is not an authorization boundary.
