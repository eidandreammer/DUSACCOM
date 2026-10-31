import { z } from 'zod';

export const membershipTier = z.enum(['startup', 'small-business', 'corporate', 'nonprofit']);
export const membershipProfileSchema = z.object({
  company: z.string().max(150),
  membershipTier,
  status: z.literal('submitted'),
  submissionId: z.uuid(),
}).strict();
export type MembershipProfile = z.infer<typeof membershipProfileSchema>;
export const normalizeAccountEmail = (email: string) => email.trim().toLowerCase();
export function accountEmailMatches(email: string, userEmail?: string | null, sharedEmail?: string | null) {
  return Boolean(normalizeAccountEmail(email)) && [userEmail, sharedEmail].some(value => value && normalizeAccountEmail(value) === normalizeAccountEmail(email));
}
export function readMembershipProfile(data: unknown): MembershipProfile | null {
  if (!data || typeof data !== 'object') return null;
  const { updatedAt: _updatedAt, ...profile } = data as Record<string, unknown>;
  const parsed = membershipProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data : null;
}
