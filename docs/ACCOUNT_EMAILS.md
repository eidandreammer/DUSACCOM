# DUSACCOM transactional account email

Sender: **DUSACCOM <noreply@dusaccnj.org>**. Replies go to the Chamber's existing **dusaccom1@gmail.com** mailbox. Google continues to handle the domain's existing incoming mail; Resend receiving is disabled.

## Account actions

| Action | Delivery and verification |
| --- | --- |
| Signup | Welcome notice; automatic email-verification request. Account settings includes a resend-verification button. |
| Forgot password | Branded reset email, including a Firebase-generated single-use link on `dusaccnj.org`. Unknown accounts receive the same generic success response. |
| Verify email | Branded verification email to the server-side account address. |
| Change sign-in email | Current-password reauthentication, then branded verification to the new address. The old address remains active until verification. Firebase sends its native old-address recovery notice through Resend SMTP when the change is completed. |
| Change password in Account settings | Server-side password update after recent reauthentication, followed by a queued security notice. The browser signs in with the new password to replace revoked refresh credentials. |
| Delete account | Queued confirmation after Firebase deletes the sign-in account. Parent-approval and hold-to-delete protections remain in place. |

`accountEmailApi` uses the Firebase Admin SDK to generate action codes and Resend to send English/Spanish HTML and plain-text templates. Links point to `https://dusaccnj.org/__/auth/action` and retain Firebase's generated mode, code, API key, and validated account continuation. Firebase remains the authority for code expiry, verification and one-time redemption. No action code or password is stored in the mail queue or application logs. Codes cannot select an arbitrary redirect destination.

Firebase rejects changes to this project's built-in template bodies, subjects, and callback URI with `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. The website uses branded Resend endpoints for its main account emails. Native Firebase security/recovery notices use the configured **DUSACCOM OAuth brand** to populate `%APP_NAME%`, and are sent through Resend SMTP. Their locked recovery links still use the original Firebase handler host. Keep that host working for recovery messages and previously delivered links.

The public name is configured under Google Cloud → Google Auth Platform → Branding. Renaming the Cloud project alone does not change `%APP_NAME%`: without an OAuth brand, web authentication emails fall back to the default Hosting site name. See [Firebase's documented app-name selection](https://firebase.google.com/docs/auth/faq-and-troubleshooting#email-templates). No OAuth clients or Google sign-in provider were added. Email replies still go to `dusaccom1@gmail.com`.

Password changes made outside Account settings, including the Firebase-hosted reset form or an operator's Admin SDK, do not produce the additional password-changed notice. Reset requests still produce their reset email. Profile-name changes and ordinary sign-ins do not send email. No marketing mail or inquiry receipt mail is added by this feature.

## Authorization, throttling and delivery

Verification/password endpoints require a verified, nonrevoked ID token. Password and address changes require reauthentication within five minutes. Email-change recipients come from a strictly validated new-address field; other authenticated recipients come from the server-side Firebase account. Delegates cannot change the shared address through the branded email endpoint. Trusted origins are `dusaccnj.org`, `dusaccom.web.app`, and `dusaccom.firebaseapp.com` over HTTPS; cross-site requests and oversized/invalid bodies are rejected.

Action email is limited to five requests per action, account, and network in fifteen minutes using private hashed keys in `authAttempts`. Password changes have a per-user one-minute throttle in `accountEmailLimits`. Neither browser-side data nor request headers can choose the notification recipient for password changes.

Welcome, password-changed and account-deleted notices use private `accountEmailOutbox` documents. The Firestore trigger reads the latest state before sending, uses stable Resend idempotency keys, retries provider failures for up to 23 hours, and removes recipient/name/content after Resend accepts the message. Resend retains idempotency keys for 24 hours; older notices expire instead of risking duplicate delivery. A receipt indicates provider acceptance; confirm delivered/bounced events in Resend. Monitor `ready`, `expired`, and `staged` states. A staged password notice requires investigation because Firebase Auth and Firestore do not share a distributed transaction.

Lifecycle triggers skip anonymous accounts and do not bulk-email existing users. All browser access to the queue and throttles is denied by the existing Firestore rules. Email sending is disabled in the local Firebase emulators even if the activation environment variable is set.

## Domain and activation

1. Add `dusaccnj.org` to Resend and install the exact records in [resend-dns.json](resend-dns.json) in Cloudflare. Keep root Google MX/SPF and Google DKIM records intact. Sending CNAME records must be DNS-only; receiving stays disabled.
2. Verify the domain and create a sending-only key restricted to `dusaccnj.org`. Never put it in Git, logs, or a `NEXT_PUBLIC_*` variable.
3. Install the key as `RESEND_API_KEY` in Google Secret Manager, granting the existing `dusaccom-accounts@969342544667.iam.gserviceaccount.com` runtime access to that secret only.
4. Run `scripts/configure-account-email.mjs` using Google Application Default Credentials and `RESEND_API_KEY` or `RESEND_API_KEY_FILE`. It verifies public DNS and the sender using Resend's delivery simulator, configures/read-verifies Firebase SMTP, and tolerates the project's known native-template restriction. `--check` performs read-only DNS/Firebase inspection.
5. Set `ACCOUNT_EMAILS_ENABLED=true` in ignored `functions/.env.<project-id>` and `NEXT_PUBLIC_ACCOUNT_EMAILS_ENABLED=true` in the frontend environment. Deploy the functions first; build/deploy Hosting with `FIREBASE_SITE_URL=https://dusaccnj.org`. The deployment helper omits the new rewrites when the frontend flag is disabled.
6. The runtime service account needs its existing Firestore/Auth access, `roles/eventarc.eventReceiver`, and `roles/run.invoker` on the private `deliveraccountemailoutbox` Cloud Run service. The Eventarc service agent needs its standard `roles/eventarc.serviceAgent`. These scoped permissions were configured during activation; the outbox service is not public. On a first deployment, allow time for the new Eventarc service-agent permissions to propagate. Firebase CLI requires `--force` once to acknowledge enabling retry policies; these handlers are idempotent.
7. Test delivered emails using authorized disposable QA accounts. Verify that reset/address-change links preserve the account, cannot be reused, and never change an address before verification. Confirm welcome, password-change and deletion messages in Resend, then remove the QA accounts.

If a first-time trigger deployment leaves `ready` notices queued before the trigger exists, update metadata on those ready records after deploying the trigger. Stable document-based idempotency keys keep that recovery safe. Do not requeue expired/sent messages with new IDs without reviewing delivery history.

## Validation

Application tests cover English/Spanish templates, HTML/link escaping, domain selection, provider/idempotency errors, account-continuation allowlists, reset enumeration protection, trusted origins, authentication, recent reauthentication, delegate restrictions, invalid/oversized input, activation gating and rate limiting. Auth/Firestore/Functions emulator tests include denial of browser access to outgoing mail and throttles, alongside all existing account, membership, administrator and inquiry regressions. Production export, browser responsive checks and HTTP smoke checks cover the website and assets.

## Production activation — November 12, 2026

Cloudflare records and Resend domain verification passed. The approved sending-only key is restricted to dusaccnj.org, stored as Secret Manager version 1, and configured in Firebase SMTP. The action-email, password-change, lifecycle and delivery functions are active in us-east4. The outbox's Cloud Run service is private and grants invocation only to the event-delivery service account. Existing Google mail records, Firebase accounts and published data are preserved.

Live QA used two disposable accounts in aliases of the owner's signed-in Resend mailbox. Resend confirmed delivery of branded password reset, email verification, new-address verification, welcome and password-changed notices. Real delivered links completed password reset, email verification and email change, and rejected reuse. Old passwords were rejected after changes; new credentials signed in successfully. The address stayed unchanged until verification. The native old-address recovery notice was delivered through Resend, restored the original address, and rejected reuse. Both QA accounts were then removed.

Final validation: 73 application tests, 20 Auth/Firestore/Functions emulator tests, frontend/backend TypeScript, production Firebase export, and HTTP checks of 11 pages and 56 assets passed. Responsive browser QA checked the footer at desktop and 390px mobile widths with no horizontal overflow. The existing uncommitted footer layout/style edits were retained.

The website was published on dusaccnj.org and passed live HTTP checks for all 11 pages and 56 assets, canonical metadata, the new BiteSites asset, legacy authentication/CORS/cache behavior, authenticated-route rejection, cross-origin rejection, and generic success for missing reset accounts. The missing-account path includes a regression fix for the Admin SDK assertion produced by Identity Platform email-enumeration protection. Four lifecycle/security notices were accepted by the queue, and Resend confirmed account-deletion delivery. A final exact-address audit confirmed no disposable QA accounts remain.

## Public name and email confirmation follow-up — November 12, 2026

After the owner's policy approval, the Google public application brand was created as **DUSACCOM**. A fresh native recovery notice was delivered with subject `Your sign-in email was changed for DUSACCOM`; its body also uses DUSACCOM. Existing messages are historical and cannot be rewritten.

The email-change button now says “Send confirmation to new email” in English and Spanish. Its pending notice identifies the destination mailbox and explicitly says the current address remains active until confirmation. Production verification with a disposable account confirmed: requesting the email leaves the original address unchanged; a direct unverified Firebase update is rejected with `OPERATION_NOT_ALLOWED`; redeeming the delivered new-mailbox link changes the address; signing in with the new address works; reusing the confirmation code is rejected.

Validation passed: 73 application tests, TypeScript, production Hosting export, and live HTTP checks of 11 pages and 56 assets plus both legacy authentication hosts. The disposable account and private action-link files were removed after testing.
