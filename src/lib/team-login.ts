import { z } from 'zod';

export const teamUsername = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_-]{2,23}$/);
export const delegatedAdminInput = z.object({
  displayName: z.string().trim().min(2).max(100),
  username: teamUsername,
  password: z.string().min(8).max(128),
});

export function supportsSharedMailbox(email: string) {
  return /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email.trim());
}

// Gmail routes plus-addresses to the same inbox. Firebase still gives every
// username its own UID/password, while the UI uses the parent's shared email.
export function teamLoginEmail(sharedEmail: string, username: string) {
  const email = sharedEmail.trim().toLowerCase();
  const parsed = teamUsername.safeParse(username);
  if (!supportsSharedMailbox(email) || !parsed.success) throw new Error('team/invalid-login');
  const [local, domain] = email.split('@');
  const alias = `${local}+dusaccom-${parsed.data}`;
  if (alias.length > 64) throw new Error('team/invalid-login');
  return `${alias}@${domain}`;
}
