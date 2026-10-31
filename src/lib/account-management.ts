import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { getFirebase } from './firebase';
import { site } from './site';

export class AccountManagementError extends Error {
  constructor(readonly code: string) { super(code); }
}
export async function accountRequest<T>(path: string, body: object = {}): Promise<T> {
  const user = getFirebase().auth.currentUser;
  if (!user) throw new AccountManagementError('account/sign-in-required');
  const response = await fetch(`/api/account-management/${path}`, {
    method: 'POST', credentials: 'omit', redirect: 'error',
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
  });
  const data = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok || !data) throw new AccountManagementError(data?.error || 'account/temporarily-unavailable');
  return data as T;
}
export async function reauthenticateAccount(password: string) {
  const user = getFirebase().auth.currentUser;
  if (!user?.email) throw new AccountManagementError('account/sign-in-required');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await user.getIdToken(true);
  return user;
}
export async function changeAccountPassword(currentPassword: string, newPassword: string) {
  if (newPassword.length < 8 || newPassword.length > 128) throw new AccountManagementError('account/invalid-password');
  const user = await reauthenticateAccount(currentPassword);
  await updatePassword(user, newPassword);
}
export async function changeAccountEmail(currentPassword: string, email: string, lang: 'en' | 'es') {
  const user = await reauthenticateAccount(currentPassword);
  getFirebase().auth.languageCode = lang;
  await verifyBeforeUpdateEmail(user, email.trim(), { url: `${site.url}/account/` });
}
export async function changeAccountName(displayName: string) {
  const user = getFirebase().auth.currentUser;
  const name = displayName.trim();
  if (!user || name.length < 2 || name.length > 100) throw new AccountManagementError('account/invalid-name');
  await updateProfile(user, { displayName: name });
}
export async function beginAccountDeletion(password: string) {
  await reauthenticateAccount(password);
  return accountRequest<{ confirmation: string; holdMilliseconds: number }>('begin-self-deletion');
}
export async function finishAccountDeletion(confirmation: string) {
  await accountRequest('delete-self', { confirmation });
  await signOut(getFirebase().auth);
}
export async function requestDelegateDeletion() { return accountRequest<{ status: 'pending' | 'approved' }>('deletion-request'); }
export async function deleteDelegateAccount(targetUid: string) { return accountRequest('delete-delegate', { targetUid }); }
export async function declineDelegateDeletion(targetUid: string) { return accountRequest('decline-request', { targetUid }); }
