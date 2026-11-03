# Firebase authentication email branding

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
