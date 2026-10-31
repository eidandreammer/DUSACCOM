# DUSACCOM Firebase setup and administrator guide

## Already completed

- Project alias: `dusaccom`, resolving to [project number 969342544667](https://console.firebase.google.com/project/969342544667/overview), display name **DUSACCOM Community**. Aliases do not rename the backend project.
- Web app registered: `1:969342544667:web:e260e2c19c7ed4c0cc41be`.
- Firebase Authentication email/password provider enabled and deployed.
- Cloud Firestore `(default)` created in **us-east4 (Northern Virginia)**. Firebase initialization provisioned **Standard edition**, with the free tier enabled. No billing upgrade was performed.
- Firestore rules deployed. Published events are public; only designated administrators can write events. Browser clients cannot assign roles.
- `.env.local` configured for this computer (ignored by Git).
- `/account` includes create account, sign in, password reset, and sign out in English and Spanish.
- The calendar listens to Firestore changes using `onSnapshot`, so other visitors see new events without refreshing. Core operations provide the required real-time snapshots. The calendar loads at most 500 confirmed events; archive old events if you approach that limit.
- The two default Firebase domains are authorized. Additional local/production domains need the console step below; the current Firebase CLI auth deployment supports providers but does not apply an `authorizedDomains` field.

## 1. Create your account

I cannot choose your personal password or administrator identities for you.

1. In [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/969342544667/authentication/settings), add `localhost` and `127.0.0.1` for local development. Enter hostnames only, without a protocol or port.
2. Start the website with `npm run dev` (use Node.js 22.16 or newer).
3. Open `http://127.0.0.1:3000/account`, or the port shown in the terminal.
4. Choose **Create account**.
5. Enter your name, email, and a password of at least eight characters; submit.
6. Your new account initially has normal member access. Creating an account is separate from applying for Chamber membership.

## 2. Make yourself or another user an administrator

Only a trusted Firebase project operator should perform these steps. New users must create their accounts first.

1. Open [Authentication → Users](https://console.firebase.google.com/project/969342544667/authentication/users).
2. Find the intended user by email, open that account, and copy its **User UID**. Use the UID, not the email address, as the Firestore document ID.
3. Open [Firestore → Data](https://console.firebase.google.com/project/969342544667/firestore/databases/-default-/data).
4. Choose **Start collection** and enter `admins`. If it already exists, select it and choose **Add document**.
5. Set **Document ID** to the exact UID copied in step 2.
6. Add field `enabled`, select type **boolean**, and set it to **true**. Save.
7. Return to the website while signed in as that user. The account badge changes to **Administrator**, and the creation form appears on the right side of the events calendar. The role listener updates automatically; refresh if necessary.
8. Repeat for each administrator you choose.

To revoke event publishing, change `admins/<UID>.enabled` to boolean **false**. The rules check the role on every write, and the UI listens for changes. Event administrators can publish events; this role does not grant access to the Firebase console, other accounts, private inquiries, or role assignment.

## 3. Publish an event

1. Sign in to an administrator account and open `/#events`.
2. Use **Create an event** on the right of the calendar (below it on narrow screens).
3. Enter title, description, location, date/time, and time zone. Time is interpreted in the selected zone, independently of the computer's zone. New York daylight saving time is handled automatically; nonexistent spring-forward times are rejected. A repeated fall-back time uses its first occurrence.
4. Expand **More options** for Spanish text and category, if desired.
5. Choose **Publish event**. A successful save selects the event date and updates the shared calendar. Keep a second browser or signed-out window open to see the live update.

The form creates confirmed events with open registration. To close registration later, a trusted console operator can change the event's `registration` string to `closed` in Firestore. Event editing and deletion controls are not part of this creation form.

## 4. Configure the website host and deploy the website changes

**Current free Firebase Hosting workflow:** follow [FIREBASE_HOSTING.md](FIREBASE_HOSTING.md). It exports the website to classic Hosting and stores new form submissions in Firestore. The steps below describe the older Sites/Cloudflare hosting setup and its historical D1 records.

Firebase backend deployment is complete. The updated Next.js website still needs to be deployed through your existing hosting workflow.

1. Open the environment/build settings for the host serving the website.
2. Copy these four **public web configuration** values from this computer's `.env.local` (or Firebase → Project settings → Your apps → DUSACCOM Website → SDK setup/configuration):

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dusaccom.web.app
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<projectId from the existing Firebase web SDK configuration>
   NEXT_PUBLIC_FIREBASE_APP_ID=1:969342544667:web:e260e2c19c7ed4c0cc41be
   ```

3. Rebuild and deploy using your existing hosting workflow. `NEXT_PUBLIC_` values are embedded at build time, so changing the host settings requires a new build. Keep the variables available to the server runtime as well, since inquiry validation uses the project ID.
4. Add `dusaccom-business-community.bluesole13.chatgpt.site` and any custom domain you use under [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/969342544667/authentication/settings). Enter a hostname only, without `https://`, a path, or a port. The current CLI does not apply authorized-domain changes from `firebase.json`; use the console for this step.
5. Verify create account, sign out, sign in, and password reset on the deployed site. Customize the password reset email in Authentication → Templates if desired.
6. Sign in as a member and confirm the publisher is unavailable; sign in as an administrator and publish an approved event. Check a second browser window for live updates.

Firebase web config is public by design; data access is enforced by rules, not by hiding the browser API key. Never place a service-account private key in `NEXT_PUBLIC_` variables. See [Firebase API keys](https://firebase.google.com/docs/projects/api-keys) and [Firebase Authentication](https://firebase.google.com/docs/auth/web/start).

## Existing event registration storage

New Firebase events also work with the existing server-side inquiry validation. Event registrations and membership/contact inquiries continue to use the existing **Cloudflare D1** database; Firebase stores accounts, roles, and calendar events. A local `next dev` server without a D1 binding cannot save attendee registrations and returns a recoverable error. Use the repository's existing Worker/D1 preview or deployment for that flow, as described in the README.

## Validation and future backend changes

```sh
npm run typecheck
npm test
npm run test:rules
npm run build
```

Rules tests use a local demo Firebase project and require Java 21+. They verify public calendar reads, administrator-only writes, blocked role escalation, field validation, immutable ownership, and role revocation.

To redeploy backend configuration after intentional changes:

```sh
npx -y firebase-tools@latest deploy --only auth,firestore --project dusaccom
```

The rules are a reviewed-by-tests prototype, not a complete security audit. They validate the event field set, types, lengths, role and ownership. Full IANA time zone and calendar-date validity are enforced by the application; administrators remain trusted to publish accurate public information. Review before broad release.
