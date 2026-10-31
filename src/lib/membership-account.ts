import { z } from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebase } from './firebase';
import { teamLoginEmail } from './team-login';

const signup = z.object({
  agreeToCreateAccount: z.literal(true),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254), password: z.string().min(8).max(128),
  confirmation: z.string().min(8).max(128),
}).strict().refine(input => input.password === input.confirmation);

export async function createMembershipAccount(input: z.input<typeof signup>) {
  const values = signup.parse(input);
  const { auth } = getFirebase();
  const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
  // The login already exists if the optional name update fails. Preserve the
  // successful account creation; its name can also be edited in settings.
  await updateProfile(credential.user, { displayName: values.name }).catch(() => {});
  return credential.user;
}
export async function signInForMembership(email: string, password: string, username = '') {
  const loginEmail = username.trim() ? teamLoginEmail(email, username) : email.trim();
  return (await signInWithEmailAndPassword(getFirebase().auth, loginEmail, password)).user;
}
