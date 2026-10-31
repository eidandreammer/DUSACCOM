# Membership accounts

Membership applications on the homepage and membership page require a signed-in, nonanonymous account. Contact, initiative-interest, and event registration forms still support guests. A visitor can fill in the membership application before authenticating; its values stay in memory while the account dialog is open.

When a guest submits a valid membership form, a dialog asks whether they already have an account with the entered email or would like to create one. **Yes, create an account** opens a registration form with the same email and prefilled name, plus password and confirmation fields. **Not now** dismisses the dialog without creating an account or sending the application. Existing users can sign in, including with a delegated team username. A consented sign-up attempt using an existing email switches to sign-in rather than creating a duplicate account. No public registered-email lookup endpoint is exposed.

After authentication, the visitor returns to their completed form and explicitly submits the membership application. The submitted email must match their account or the immutable shared mailbox of their enabled delegate role with an enabled parent. Errors leave the application filled in. Passwords are handled only by Firebase Authentication, never stored in application records or browser draft storage.

## Profile card

A successful application saves a private `membershipProfiles/{auth.uid}` document with:

| Field | Value |
| --- | --- |
| `company` | Submitted company or organization, at most 150 characters; optional |
| `membershipTier` | `startup`, `small-business`, `corporate`, or `nonprofit` |
| `status` | `submitted` |
| `submissionId` | UUID of the matching application receipt |
| `updatedAt` | Server timestamp |

The signed-in profile card displays the company when provided, the translated membership pathway, and **Application submitted**. The card keeps only **Account settings** and **Sign out** as actions. Submission records the selected pathway; it does not grant an approved or paid membership. The latest successfully submitted application supplies the displayed details. Retrying an earlier receipt does not overwrite a newer profile or consume another rate-limit increment.

The receipt, rate-limit counter, and profile are written in one Firestore transaction using the member's primary session. The profile listener ignores pending local writes. Returning users retrieve their saved details after signing in; profile values are never shared between different UIDs. Earlier anonymous inquiries are preserved and are not automatically claimed by matching an email address.

## Access and deletion

Prototype Firestore rules allow exact profile reads only by their authenticated owner and deny listing, cross-account access, client deletion, unknown fields, forged approval/roles, and arbitrary profile edits. Create and update require a matching new membership inquiry in the same atomic operation, with the same account, company, pathway, and server time. The existing inquiry validation and rate limit must also pass. These rules have emulator coverage and should be reviewed and hardened before broad distribution.

The trusted account-deletion function removes the private membership profile together with the role cleanup. Historical inquiries and published events follow their existing retention behavior. Parent approval and the five-second self-deletion flow continue to apply.

## Verification — October 31, 2026

- TypeScript, the production static build, and Firebase Rules syntax validation passed.
- All 45 application tests and 19 Auth/Functions/Firestore emulator tests passed. Coverage includes explicit consent, password mismatch, duplicate-email sign-in, account-email mismatch, profile persistence, transaction retry, ownership isolation, malformed create/update payloads, guest rejection for membership, guest contact/event submissions, delegated shared email and inherited revocation, and profile cleanup during account deletion.
- Functions and Hosting/Auth/Firestore configuration deployed successfully.
- Live checks with temporary identities verified public sign-up, a real membership receipt and profile, returning-user sign-in, guest contact without replacing the member session, private profile access denial, and profile removal through the trusted deletion API. All temporary accounts, inquiries, profiles, and counters were removed; no emails were sent.
- Production HTTP checks passed for 11 pages and 43 assets. No browser was available through connected computer-use tools, so interactive visual verification was unavailable.
