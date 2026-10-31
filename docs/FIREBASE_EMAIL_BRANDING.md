# Firebase authentication email branding

The live website is https://dusaccom.web.app. Its Firebase project remains `dusaccom-community-2026`, preserving existing accounts, roles, inquiries, and calendar data. Both new Hosting domains are authorized for Authentication; existing authorized domains remain for compatibility.

## Applied settings

- All four existing account-management templates have sender display name `DUSACCOM team` and Reply-To `dusaccom1@gmail.com`.
- The website uses `dusaccom.web.app` as its Firebase authentication domain.
- Password-reset requests set `https://dusaccom.web.app/account/` as their continue URL and use the visitor's selected language.
- The old website redirects to the new address. Firebase's reserved authentication handlers remain available for previously issued links.
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

To finish, ask [Firebase support](https://firebase.google.com/support) to enable/apply the requested template and callback changes for project `dusaccom-community-2026` (project number `969342544667`), quoting `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. A configured custom email delivery service is another option if Firebase cannot enable these fields. Do not change SMTP delivery, billing, or the Firebase project without configuring and validating the replacement first.

Firebase's [account-management email documentation](https://support.google.com/firebase/answer/7000714?hl=en) describes template and sender-domain customization; the [Identity Platform configuration API](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config) defines the requested fields.

## Verification

Production build, TypeScript, and all 32 application tests passed. Live HTTP checks passed for 11 pages and 41 local assets on the new domain. A temporary production account completed signup, sign-in, password-reset code generation without sending email, code verification, password reset, and sign-in with the new password. Both old and new reserved authentication handlers returned HTTP 200. The temporary account was deleted afterward. Existing user accounts and passwords were not changed. No production email was sent as part of verification.
