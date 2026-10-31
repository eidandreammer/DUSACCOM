# Firebase Hosting on Spark

Use the Firebase CLI alias `dusaccom`, which resolves to the existing project number `969342544667`. The public Hosting site is `dusaccom`, at https://dusaccom.web.app. This preserves existing accounts and data; the alias is not a renamed Firebase project. The site uses classic Firebase Hosting, the existing Standard Firestore database in `us-east4`, email/password Authentication, and anonymous guest Authentication for forms. No Functions, App Hosting, Cloud Run, Cloud Storage, billing account, trial, or Blaze upgrade is used.

Default public URL: https://dusaccom.web.app

The previously deployed legacy Hosting site redirects ordinary pages to the new origin, preserving paths and query parameters. Firebase's reserved authentication handlers remain available so existing password-reset links continue to work. `deploy:firebase` deploys the main site and backend configuration using the `dusaccom` project alias. The deployed legacy redirects are left intact; do not publish a redirect from the live site back to itself. The build derives its default canonical origin from the Hosting site ID in `firebase.json`, independently of the Firebase project ID. Password-reset requests return visitors to the new site's account page; the public Firebase authentication domain is `dusaccom.web.app`.

See [email branding status](FIREBASE_EMAIL_BRANDING.md) for the Firebase restriction that currently prevents changing authentication email subjects, bodies, and the email action-link origin.

## Build and deploy

Use Node.js 22.16+ with the public Firebase web configuration from `.env.example` in the ignored `.env.local` file. Never include service-account keys.

```sh
npm ci
npm run typecheck
npm test
npm run test:rules
npm run deploy:firebase
```

`build:firebase` optimizes the local photographs and runs a Next.js static export in a temporary copy without server API routes. It preserves the source API routes and standalone/Sites build, restores temporary files after failure, and writes only public output to `out/`. It checks that all four public Firebase configuration values exist and that the project matches `.firebaserc`. Its canonical URL defaults to the free Firebase URL, independently of any old local site URL. The deployment command publishes only Hosting, Authentication provider settings, and Firestore rules/indexes.

Each page has its own static HTML, including account and resource routes. Hosting serves directory indexes with trailing slashes and a real 404 page, without a catch-all SPA rewrite. Security and cache headers are in `firebase.json`. No server runtime is needed. Firebase builds automatically select `NEXT_PUBLIC_INQUIRY_BACKEND=firestore`; the legacy standalone build continues using its existing D1 API.

## Forms and data

On the Firebase deployment, all contact, membership, initiative-interest, and scheduled-event registration forms use a separate Firebase app named `inquiries`. A guest identity is created only when a form is submitted, and persists independently of the member/admin session. Visitors do not have to create a member account to contact the Chamber. This uses Firebase's free anonymous provider, not phone authentication.

New submissions are saved in `inquiries/{submissionId}` with the form fields, `ownerUid`, a stable receipt reference, a payload hash, server receipt time, and `status: new`. The visitor may get their own exact receipt; browser listing, edits, deletion, and access to another visitor's data are denied. Event administrators do **not** gain access to private inquiries. Trusted Firebase console/IAM operators can review and manage them. No automatic email notification is configured.

The paired `inquiryLimits/{guestUid}` document enforces up to five new submissions per ten minutes per guest identity. An atomic transaction must create both the inquiry and its counter update. Rules reject omitted counters, early resets, forged ownership, missing consent, honeypot spam, invalid fields, unlisted membership/initiative options, and closed, past, draft, or missing live events. This is a per-identity limit, not a guarantee against someone creating multiple guest identities. Spark quotas remain hard service limits; no billing upgrade or paid overage is configured.

Retries reuse the submission UUID. Identical retries return the stored receipt without another counter increment. Changed payloads cannot overwrite an accepted submission. A success message requires a server-confirmed receipt, including when connectivity is lost or the UI times out.

Existing `admins` and `events` documents are preserved. Existing inquiry records in the old Cloudflare D1 database are also preserved; they are **not** automatically copied to Firestore. Keep the old database for historical records and arrange retention with the Chamber. New Firebase-hosted form submissions go to Firestore. Collections appear when their first document is created; no fake production inquiry is seeded.

The rules are a tested prototype, not a complete independent security audit. Review them and the operator access/retention policy before broad release.

## Validation

`npm test` covers the original inquiry service, scheduling, and calendar models. `npm run test:rules` uses demo-only Auth and Firestore emulators and Java 21+ to test actual SDK transactions, private access, field validation, rate limits, immutable receipts, retries, event eligibility, administrator authorization, email/password accounts, and separate guest sessions. Password-reset testing stays in the local emulator and sends no email.

After deployment:

```sh
node tests/http-smoke.mjs https://dusaccom.web.app --static
```

This checks public pages, images/scripts, metadata, 404 behavior, and that server API routes are absent. Auth and Firestore run in the browser, not at `/api/` on Hosting. Use Firebase's usage dashboard to monitor the Spark limits. If a limit is reached, service may become temporarily unavailable; do not upgrade billing automatically.

## Connect an owned custom domain

A domain is optional. The `.web.app` address is free. Buying or renewing a domain is not part of this zero-cost deployment; use only a domain you already own and control.

1. In Firebase console → Hosting → Add custom domain, enter the exact domain supplied by the owner.
2. Add only the DNS verification and routing records provided by Firebase at the domain's DNS provider. Preserve email/MX and unrelated records. Firebase provisions HTTPS without requiring Blaze.
3. Add the hostname in Authentication → Settings → Authorized domains. Keep existing authorized hostnames. Provider deployment does not automatically add this hostname.
4. After DNS verification and HTTPS are ready, rebuild with the new canonical origin:

   ```sh
   FIREBASE_SITE_URL=https://your-owned-domain.example npm run deploy:firebase
   ```

5. Test direct navigation, assets, member sign-in, password reset, the public calendar, administrator event management, and form receipts on that domain. Adding a domain does not require moving or recreating the Firebase database or member accounts.

## Deployment verification — October 30, 2026

- Firebase Hosting published successfully to the default `.web.app` URL above.
- Project billing remained disabled before and after deployment; no billing account was created or linked.
- Production Next.js export and TypeScript check passed.
- All 32 application tests and 7 Firebase Auth/Firestore emulator tests passed.
- HTTP smoke checks passed on local Hosting and production: 11 pages, 41 assets, metadata, 404 behavior, and absent server routes.
- Production security headers, a client-navigation RSC payload, and membership/initiative query URLs returned the expected responses.
- A live anonymous-auth form submission returned a durable server receipt, and an identical retry returned the same receipt. The temporary guest account, test inquiry, and test limit document were removed afterward.
- No browser was available through the connected automation tools. Visual responsive QA and browser-console inspection were not performed; no claim of visual/browser validation is made.
- Custom-domain setup awaits the owner's exact hostname, ownership confirmation, and DNS provider. The default URL is already public and requires no ChatGPT account.
