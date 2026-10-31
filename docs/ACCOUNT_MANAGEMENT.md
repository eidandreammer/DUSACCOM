# Account management

The profile menu opens profile editing, password changes, verified email changes, administrator teams for eligible parents, and account deletion. Actions have 12px spacing and at least 44px height. Password and email changes require the current password. Email changes take effect only after the new address is verified. Existing delegates keep their current shared email and username when a parent changes email; delegates cannot independently change the shared login address.

The Heidy portrait and its reserved layout space have been removed from the Nonprofit card. Start Registration remains below that card.

## Deletion behavior

- A member or parent administrator confirms their password, then holds continuously for five seconds in a modal. Release, leaving the button, losing focus, switching tabs, or canceling the dialog resets the hold. The server also requires a recent login and a private, expiring, UID-bound confirmation that is at least five seconds old.
- A parent must remove all delegates before deleting its own account. Disabled delegates still count.
- A parent can permanently delete any of its delegates after a modal confirmation, without a hold. It can approve or decline a delegate's deletion request.
- A delegate can only submit a request to its parent. It cannot approve the request or directly delete its account. Authentication deletion is performed only by the trusted function; the UI does not substitute role removal for account deletion.
- Administrator access is disabled before deleting the login. Partial failures can be retried by the same parent. Published events remain attached to their original author UID.

`accountDeletionRequests/{delegateUid}` is readable only by that delegate and its enabled parent. Clients cannot write requests or approvals. `accountDeletionChallenges/{uid}` is entirely private to the backend. Passwords and raw confirmation tokens are not stored in Firestore; only a token hash is persisted.

## Deployment status and activation

As of October 31, 2026, project `969342544667` has billing disabled, and its only accessible billing account is closed. The Cloud Billing API exposes `open` as output-only: the connected API cannot reopen the account. Activate/reopen an eligible billing account in [Google Cloud Billing](https://console.cloud.google.com/billing) and link it to this project. The user has authorized Firebase Functions and billing; no further application approval is needed.

The dedicated `dusaccom-accounts` runtime service account has been provisioned with Firebase Authentication Admin and Cloud Datastore User roles. No service-account keys were created. The function uses Application Default Credentials, runs in `us-east4`, and has zero minimum instances and one maximum instance.

Until activation is complete, `npm run deploy:hosting-only` publishes profile/password/email controls, layout changes, and read-only request rules, omitting the missing function rewrite. Deletion controls report unavailable and cannot send destructive requests. Do not use this fallback after enabling the function; it intentionally removes its Hosting route.

Use Node.js 22.16+ and Java 21+:

1. Activate billing and confirm the project's Blaze plan, preserving its existing database, Auth users, and Hosting site.
2. Run `npm run deploy:accounts`. The function's production gate initially reports unavailable because standard client deletion remains enabled.
3. Prevent approval bypass by disabling standard Firebase client account deletion. Using an authenticated project operator with `firebaseauth.configs.update` (for example through `gcloud auth print-access-token`), PATCH `https://identitytoolkit.googleapis.com/admin/v2/projects/969342544667/config?updateMask=client.permissions.disabledUserDeletion` with body `{"client":{"permissions":{"disabledUserDeletion":true}}}`. Preserve all unrelated settings. Read the config back and verify the value. This restriction is project-wide, including nondelegated and anonymous identities; normal account deletion now goes through the trusted function. Failed delegate creation uses a narrowly checked trusted cleanup endpoint if the standard client cleanup is blocked.
4. Run `npm run deploy:firebase` to publish the Hosting rewrite and Firestore rules together with the UI. The authenticated `/api/account-management/availability` endpoint enables controls only when the function can verify that the project-wide client deletion restriction is active. Failure to read that setting leaves all destructive endpoints unavailable.
5. Verify with dedicated QA accounts that a parent can delete its own delegate, a delegate can request but cannot approve deletion, raw Firebase client deletion is rejected, and a member's five-second confirmation works. Never delete existing production accounts for testing.

Do not enable the project-wide deletion restriction before the trusted function is deployed. To roll back, first disable the destructive UI/route, then restore the previous Auth client permission setting only if returning to standard Firebase client account deletion is intentional.

## Validation

`npm test` covers authorization, direct-deletion denials, cross-team ownership, safe retry, expired/UID-bound challenges, timing, invalid requests, unavailable-backend gating, and continuous-hold cancellation. `npm run test:rules` additionally builds the function and starts demo-only Functions, Auth, and Firestore emulators. It tests actual HTTPS token verification, parent-only Auth deletion, revoked/deleted users, server timing, private request rules, password changes, and verified email changes. No real emails are sent and no production accounts are modified by these tests.

The connected computer-use tools provided no browser, so interactive visual verification was unavailable. Production HTTP smoke checks cover static pages, assets, headers, and absent legacy APIs; they do not replace a browser check of the account dialogs.

October 31 verification: TypeScript and the static production build passed; all 43 application tests and 14 Firebase emulator tests passed. The Hosting/Auth/Firestore fallback deployed successfully. Live checks passed for 11 pages and 43 assets, account settings entry URLs, removed portrait asset (404), security headers, and the unavailable account API (404). The Functions deployment was attempted and rejected because the project is not on Blaze; the project-wide client deletion restriction was therefore left unchanged.
