# Administrator teams

Existing enabled administrator accounts are parent administrators. Open the profile menu, select **Manage administrator team**, and add a person's name, username, and initial password. The shared email comes from the signed-in parent account. Share the username and password privately; account creation does not send an email or replace the parent's session.

Each delegate selects **Sign in with a team username** and enters the shared email, their own username, and their own password. Leave that option off when signing into the parent account or a normal member account. Password recovery uses the same option and delivers to the shared mailbox.

## Permissions

| Action | Parent administrator | Delegated administrator |
| --- | --- | --- |
| Create, edit, close registration, or delete any calendar event | Yes | Yes |
| Add delegated administrators | Yes, under their own account | No |
| Enable or disable delegates | Own delegates only | No |
| Create another parent administrator or change a role's parent | Trusted Firebase operator only | No |
| Access private inquiry records or Firebase console | Not granted by this role | Not granted by this role |

Parents see their own team and can disable or re-enable each delegate. Disabling a delegate removes administrator privileges, preserving the ordinary login. Disabling or deleting a parent role also removes its delegates' administrator privileges. Reactivation restores them only if both the parent and delegate roles are enabled. Existing event authorship remains attached to the original creator's UID.

## Shared email identities

This implementation supports Gmail and Googlemail shared mailboxes. For example, `parent@gmail.com` plus username `administrator1` uses `parent+dusaccom-administrator1@gmail.com` as the internal Firebase email/password identity. Gmail delivers these plus-addresses to the same inbox. The user-facing login and profile use the original shared email, and each delegate receives a separate Firebase UID. Usernames are case-insensitive, 3–24 characters, start with a letter, and otherwise contain letters, numbers, underscores, or hyphens.

Keep shared-mailbox access with the parent administrator. Anyone who can read that inbox can reset the parent's password and bypass the delegated role's restriction. Sharing the login email string does not require sharing the mailbox password. Non-Gmail providers need a separately verified alias or custom-login solution before enabling shared-mailbox creation for those domains.

Passwords are handled by Firebase Authentication and are never stored in Firestore or logs. A separate, temporary Firebase app with memory-only authentication creates the delegate's account. If assigning its role fails, the newly created Authentication account is deleted; a failed cleanup is reported for operator review. The parent session remains signed in throughout.

## Role storage and enforcement

Parent records in `admins/{uid}` have `enabled: true` and no `parentUid`, or `parentUid: null`. Only a trusted IAM/console operator may create these roots. Existing records require no migration.

Delegate records contain exactly `enabled`, immutable `parentUid`, `displayName`, shared `email`, normalized `username`, and immutable `createdAt`. Parent-only queries filter by `parentUid == currentUser.uid` and limit results to 500. Rules require the shared email to match the creating parent's authenticated email. Clients can only toggle `enabled` on an existing delegate; they cannot reparent, promote, delete role records, or alter usernames. All event writes check the enabled parent as well as the delegate's own role.

Deploy `firestore.rules` together with the website. Publishing only the UI does not enable administrator creation. These rules are a prototype with emulator coverage, rather than an independent security audit.

## Validation

Application tests cover role inheritance and shared-mailbox login normalization. Local Auth/Firestore emulator tests cover account creation without session replacement, duplicate usernames, shared-mailbox password-reset requests without sending mail, delegation denials, immutable role fields, cross-team access restrictions, event permissions, and inherited revocation. Tests use only `demo-dusaccom`; no real accounts or messages are created by them.
