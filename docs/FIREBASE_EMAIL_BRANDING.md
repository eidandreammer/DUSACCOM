# Firebase authentication email branding

Current status (November 12, 2026): the Google Auth Platform public brand is **DUSACCOM**, which fixes `%APP_NAME%` in native Firebase security messages. A newly delivered recovery notice confirmed the correct subject and body. Website action emails use branded Resend templates. The native callback URL remains locked to the original Firebase host; the backend project ID must stay unchanged. See [ACCOUNT_EMAILS.md](ACCOUNT_EMAILS.md) for current behavior and live verification. The sections below record earlier troubleshooting.

The live website is https://dusaccom.web.app. Its Firebase CLI project alias is `dusaccom`, resolving to project number `969342544667` and preserving existing accounts, roles, inquiries, and calendar data. The alias does not rename the Firebase backend. The global project ID `dusaccom` was checked and is unavailable. Both new Hosting domains are authorized for Authentication; existing authorized domains remain for compatibility.

## Confirmed email service

The application uses Firebase Authentication's built-in email sender. The account form in `src/app/account/page.tsx` calls `sendPasswordResetEmail` from `firebase/auth` directly. The live Authentication configuration reports `notification.sendEmail.method: DEFAULT`, has no `smtp` configuration, and has no active custom sender domain.

Neither `package.json` nor the local environment files contain a transactional-email transport or SMTP settings. A targeted repository-history search found no prior SMTP, Resend, SendGrid, Mailgun, or Postmark integration. The connected legacy hosting environment has no configured environment entries. The chamber's Gmail address is contact and Reply-To information; it does not provide application access to send email through Gmail.

Consequently, there is no existing third-party email service or SMTP authorization to reuse. The current provider is known; completing custom delivery still requires authenticated sender configuration. Gmail SMTP for the chamber mailbox is a possible replacement, but its account authorization cannot be inferred from an email address or Firebase API key.

## Applied settings

- All four existing account-management templates have sender display name `DUSACCOM team` and Reply-To `dusaccom1@gmail.com`.
- The website uses `dusaccom.web.app` as its Firebase authentication domain.
- Password-reset requests set `https://dusaccom.web.app/account/` as their continue URL and use the visitor's selected language.
- The old website redirects public pages to the new address. Its Firebase reserved namespace stays on the original host, including the configuration needed by previously issued authentication links (see the November 2 repair below).
- A production check found no old website or authentication hostnames in stored Firestore document fields.

## Pending Firebase restriction

Firebase rejects changes to email subjects, message bodies, and `notification.sendEmail.callbackUri` with HTTP 400 `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. The restriction was reproduced with individual field updates, including the password-reset subject and callback URL, after authorizing and deploying the new Hosting site. Sender-name and Reply-To updates succeeded and were read back from the API.

The default sender address still uses the existing Firebase project's `firebaseapp.com` domain. Changing the website's Hosting site does not by itself change this managed sending address. No custom SMTP service or independently verified sender domain has been configured.

The email subjects, body sign-offs, and visible action-link host have **not** been changed. They must not be reported as completed. In particular, the requested ending remains pending:

```text
Best regards,
DUSACCOM team
```

[firebase-auth-branding-request.json](firebase-auth-branding-request.json) contains the complete desired templates and action URL for Firebase support or a future supported email delivery configuration. It contains no credentials. It is a requested configuration, not a copy of the applied backend state.

To finish, ask [Firebase support](https://firebase.google.com/support) to enable/apply the requested template and callback changes for project number `969342544667` (local alias `dusaccom`), quoting `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. A configured custom email delivery service is another option if Firebase cannot enable these fields. Do not change SMTP delivery, billing, or the Firebase project without configuring and validating the replacement first.

Firebase's [account-management email documentation](https://support.google.com/firebase/answer/7000714?hl=en) describes template and sender-domain customization; the [Identity Platform configuration API](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config) defines the requested fields.

## Verification

Production build, TypeScript, and all 32 application tests passed. Live HTTP checks passed for 11 pages and 41 local assets on the new domain. A temporary production account completed signup, sign-in, password-reset code generation without sending email, code verification, password reset, and sign-in with the new password. Both old and new reserved authentication handlers returned HTTP 200. The temporary account was deleted afterward. Existing user accounts and passwords were not changed. No production email was sent as part of verification.

## Deployment checks

The deployment command targets the `dusaccom` alias, which resolves to the existing project number. The build accepts that number only when it matches the project number in the configured Firebase web App ID. Keep the canonical `projectId` from the SDK configuration for the Firestore client: replacing it with an alias or number does not provide a working Firestore database connection. The SDK configuration is separate from the public brand.

Do not report the email request as complete or push/deploy it as a finished branding change while the generated emails still expose the prior backend name. Custom email delivery needs an authenticated SMTP or transactional-email service, or Firebase support must unlock the managed email settings. Previously delivered messages cannot be rewritten by changing future templates.

## Password-reset repair — November 2, 2026

A valid reset link reproduced the blank “Error encountered” page. The legacy site's catch-all redirect also matched `/__/firebase/init.json`. The auth HTML itself returned HTTP 200, but its configuration request redirected to `dusaccom.web.app`; the browser blocked that cross-origin request. Checking only the handler's HTTP status had missed this failure.

`firebase.legacy.json` now redirects public paths while excluding paths starting with `/__`. Firebase serves the auth handler, scripts, and SDK configuration on their original origin. Deploy this separate legacy-host configuration with `npm run deploy:legacy-auth`; the normal website deployment continues to use `firebase.json`. Keep both configurations when maintaining the two Hosting sites. No email template, callback URL, sender service, or user password needs to be changed for this repair.

The repair was deployed and verified on both legacy Hosting domains. `node tests/legacy-auth-smoke.mjs` checks the JSON configuration without following redirects, the auth HTML and scripts, and public-page redirects with query strings. The application tests also guard the reserved-path exclusion.

A browser opened a real generated reset action link for a temporary production QA account, submitted a new password, displayed Firebase's success message, and signed in with the new password. Reopening the used link displayed its expired/used explanation. No email was sent; the temporary account was deleted through the admin API afterward. Existing accounts were untouched. This fixes password resets, not the pending email-branding restriction described above.

## Recovery for browsers retaining the old redirect

The user subsequently confirmed that a new reset email failed in the regular browser but opened the password form in a private window. A cached permanent redirect for `/__/firebase/init.json` can survive the server repair. New emails still use that same bootstrap URL, so requesting another email alone does not clear the problem.

Open https://dusaccom-community-2026.firebaseapp.com/__reset-password/ in the affected regular browser, then reopen the full link from the latest reset email. This static recovery page sends `Clear-Site-Data: "cache"` and `Cache-Control: no-store`. It refreshes cached files for that old origin; it does not request clearing cookies, local storage, IndexedDB, or saved sign-in state. The bootstrap JSON also uses `no-store` going forward. This recovery path intentionally stays on the old host instead of redirecting to the main website.

Firebase's reserved `/__/auth/action` response ignores custom Hosting response headers, so the cache refresh lives on a separate static page. The callback URL remains locked by `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`; no email delivery or account settings were changed for this recovery.

A preview test reproduced the original blank error with a real redirect and a valid temporary-account reset code. After repairing the server in the same browser session, the cached redirect still caused the error. Visiting the refresh page removed it; that same session then completed the password reset and signed in with the new password. Cookie and local-storage markers survived the cache refresh. The temporary account was deleted, and no email was sent. Production HTTP checks cover the recovery page and `no-store` bootstrap configuration on both legacy domains.

## Automatic reset recovery — November 3, 2026

The user confirmed that regular-browser email links still showed “Error encountered” while the same links worked in a private window. Reset requests on either current public Hosting domain now automatically visit the original project's `/__reset-password/` page after Firebase accepts the email request. That top-level visit clears the cached HTTP redirect, then returns to the canonical account page with the reset-email confirmation. An iframe or cross-origin fetch is not used for clearing the browser cache.

The recovery page accepts only the canonical `/account/` return destination, preserves recognized event/settings context, and discards action codes and arbitrary redirect parameters. Cookies, local storage, and sign-in state are preserved. Requests and confirmation text continue to use the selected language. Deploy **both** the application in `firebase.json` and the recovery page in `firebase.legacy.json` when changing this flow.

Verification reproduced the cached permanent redirect on a Firebase Hosting preview. Updating the server alone left the browser broken; the automatic recovery returned to the account page, and the same browser then completed the reset and signed in with the new password. Cookie and local-storage markers survived. The temporary QA account was deleted and no email was sent. All 57 application tests, TypeScript, and the production static build passed.

Both Hosting sites were deployed. Live browser checks confirmed the reset form visits the legacy recovery response with `Clear-Site-Data: "cache"`, returns with the confirmation, and preserves event-registration context. Email delivery was intercepted for that form-navigation check; the separate end-to-end reset used an admin-generated code without sending email. The temporary preview was removed after verification.

Firebase still rejects `notification.sendEmail.callbackUri` updates with `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` (rechecked November 3). This repair does not depend on changing that setting. Previously delivered links can be recovered by opening the manual refresh URL above in the browser used to open the email. For the automatic flow, request another reset on the website in that browser and then open the newest email.

## Direct cached-link repair — November 3, 2026

The user reported that the email link still failed in regular Opera but worked in incognito. The earlier cache-refresh workaround cannot guarantee that every browser opening an email has discarded its original redirect. The cached `/__/firebase/init.json` redirect sends the Firebase widget to the current site's SDK configuration. That destination lacked CORS permission, including the preflight required because Firebase's widget sends `Content-Type: application/json` on its configuration GET.

The main Hosting configuration now adds `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`, and `Cache-Control: no-store` **only** to `/__/firebase/init.json`. This is the existing public Firebase SDK configuration. No credentialed CORS access or access to account APIs is enabled. Both legacy origins and the current host initialize the same Firebase app. The managed email callback and delivery service remain unchanged.

A two-origin Hosting preview reproduced the blank error with a valid reset code and cached 301. Repairing the source server alone still failed in the same browser. Applying the new headers at the redirect destination allowed the **same link in the same browser** to load the password form without visiting the refresh page, clearing cache, requesting another email, or opening incognito. The code then reset the temporary account's password, allowed sign-in, and rejected reuse. The QA account was deleted; no email was sent and existing accounts were untouched. Regression tests cover the narrowly scoped headers, and the live smoke check exercises both GET and OPTIONS, including a null redirect origin.

The main Hosting configuration was deployed. All 58 application tests and the live auth smoke check passed, including both legacy domains and the current configuration's preflight responses. Temporary preview channels were removed afterward. Opera itself was not available for automated testing; the cached-redirect browser reproduction used Chromium.
