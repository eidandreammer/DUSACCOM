# Account management

The signed-in profile menu contains only Account settings and Sign out, with 12px spacing and at least 44px height. Account settings contains profile editing, password changes, verified email changes, the administrator-team management entry for eligible parents, and account deletion. Password and email changes require the current password. Email changes take effect only after the new address is verified. Existing delegates keep their current shared email and username when a parent changes email; delegates cannot independently change the shared login address.

The Heidy portrait and its reserved layout space have been removed from the Nonprofit card. Start Registration remains below that card.

After a successful membership application, the signed-in profile card also displays the submitted company/organization, membership pathway, and application status. These private details persist across sign-ins and are removed by trusted account deletion. See [membership accounts](MEMBERSHIP_ACCOUNTS.md) for the sign-up prompt and data model.

## Navigation

The account page's **Go to the events calendar** action uses a native `/#events` link, matching the site's other section links and avoiding a client-router scroll reset to the hero.

General sign-in and account creation return to Account settings. A requested account section such as password, email, team, or deletion is retained through authentication. Event-related entry links carry a recognized `intent`: `events` returns to the calendar, `create-event` returns to the calendar's creator area, and `event-registration` preserves the selected public event ID and reopens that event's form. The selected-event scroll waits until account access is loaded so administrator tools do not shift the target afterward. Password-reset continuation preserves the same intent. Return destinations are constructed from these known actions; arbitrary redirect URLs are ignored.

Guest event registration remains available. The event form offers optional sign-in or account creation with the selected event context. A signed-out visitor can also enter administrator sign-in from the event creator; account creation does not grant event-publishing permissions. Membership account creation stays inside its existing dialog without leaving the filled application.

The footer's **My account** section contains two plain text links, **Account settings** and **Sign in**, using the same styling as the Chamber and contact columns. Detailed management controls are inside Account settings. Account-section links use native navigation so the selected settings section opens reliably, including when navigating between settings on the same page.

## Deletion behavior

- A member or parent administrator confirms their password, then holds continuously for five seconds in a modal. Release, leaving the button, losing focus, switching tabs, or canceling the dialog resets the hold. The server also requires a recent login and a private, expiring, UID-bound confirmation that is at least five seconds old.
- A parent must remove all delegates before deleting its own account. Disabled delegates still count.
- A parent can permanently delete any of its delegates after a modal confirmation, without a hold. It can approve or decline a delegate's deletion request.
- A delegate can only submit a request to its parent. It cannot approve the request or directly delete its account. Authentication deletion is performed only by the trusted function; the UI does not substitute role removal for account deletion.
- Administrator access is disabled before deleting the login. Partial failures can be retried by the same parent. Published events remain attached to their original author UID.

`accountDeletionRequests/{delegateUid}` is readable only by that delegate and its enabled parent. Clients cannot write requests or approvals. `accountDeletionChallenges/{uid}` is entirely private to the backend. Passwords and raw confirmation tokens are not stored in Firestore; only a token hash is persisted.

## Deployment status and activation

As of October 31, 2026, project `969342544667` is linked to the user's active billing account and uses Blaze. The account API and its Hosting rewrite are deployed, and `client.permissions.disabledUserDeletion` is enabled. The authenticated availability endpoint returns `enabled: true`, enabling deletion and approval controls on the site. Reload an account page that was opened before activation.

The dedicated `dusaccom-accounts@969342544667.iam.gserviceaccount.com` runtime service account has Firebase Authentication Admin and Cloud Datastore User roles. Its actual IAM email uses the project number, so the function specifies the full email; the `dusaccom-accounts@` shorthand incorrectly expands to a different identity. No service-account keys were created. The function uses Application Default Credentials, runs in `us-east4`, and has zero minimum instances and one maximum instance. The Functions artifact repository deletes build images older than one day.

Use `npm run deploy:firebase` for website updates and `npm run deploy:accounts` for function updates. Do not use `deploy:hosting-only` on the active deployment: that historical fallback removes the account API rewrite and makes deletion unavailable.

Use Node.js 22.16+ and Java 21+:

1. Activate billing and confirm the project's Blaze plan, preserving its existing database, Auth users, and Hosting site.
2. Run `npm run deploy:accounts`. The function's production gate initially reports unavailable because standard client deletion remains enabled.
3. Run `npm run deploy:firebase` to publish the Hosting rewrite and Firestore rules together with the UI. Verify that an unauthenticated POST to `/api/account-management/availability` with the site's Origin returns 401, confirming the route reaches the function.
4. Prevent approval bypass by disabling standard Firebase client account deletion. Using an authenticated project operator with `firebaseauth.configs.update` (for example through `gcloud auth print-access-token`), PATCH `https://identitytoolkit.googleapis.com/admin/v2/projects/969342544667/config?updateMask=client.permissions.disabledUserDeletion` with body `{"client":{"permissions":{"disabledUserDeletion":true}}}`. Preserve all unrelated settings. Read the config back and verify the value. This restriction is project-wide, including nondelegated and anonymous identities; normal account deletion now goes through the trusted function. Failed delegate creation uses a narrowly checked trusted cleanup endpoint if the standard client cleanup is blocked. The authenticated availability endpoint enables controls only when the function verifies this restriction is active; failure to read that setting leaves destructive endpoints unavailable.
5. Verify with dedicated QA accounts that a parent can delete its own delegate, a delegate can request but cannot approve deletion, raw Firebase client deletion is rejected, and a member's five-second confirmation works. Never delete existing production accounts for testing.

Do not enable the project-wide deletion restriction before the trusted function is deployed. To roll back, first disable the destructive UI/route, then restore the previous Auth client permission setting only if returning to standard Firebase client account deletion is intentional.

## Validation

`npm test` covers authorization, direct-deletion denials, cross-team ownership, safe retry, expired/UID-bound challenges, timing, invalid requests, unavailable-backend gating, and continuous-hold cancellation. `npm run test:rules` additionally builds the function and starts demo-only Functions, Auth, and Firestore emulators. It tests actual HTTPS token verification, parent-only Auth deletion, revoked/deleted users, server timing, private request rules, password changes, and verified email changes. No real emails are sent and no production accounts are modified by these tests.

The connected computer-use tools provided no browser, so interactive visual verification was unavailable. Production HTTP smoke checks cover static pages, assets, headers, and absent legacy APIs; they do not replace a browser check of the account dialogs.

October 31 activation verification: TypeScript and the static production build passed; all 43 application tests and 14 Firebase emulator tests passed. Functions, Hosting, Auth configuration, and Firestore rules are deployed. Live checks passed for 11 pages and 43 assets. Temporary QA identities verified actual parent-approved delegate deletion, request rejection and resubmission, denial of cross-team and direct client deletion, rejection of deleted tokens, and both parent and ordinary-member self-deletion after five seconds with early confirmation rejected. Every temporary QA account, role, request, and challenge was removed afterward. No existing production users were deleted and no emails were sent.
