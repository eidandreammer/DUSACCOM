import { accountContinuationHref } from './account-navigation';

// Firebase still issues email links on the original project host. A top-level
// visit lets Clear-Site-Data evict its cached bootstrap redirect in this browser.
// An iframe/fetch cannot reliably clear another origin's browser cache.
export function passwordResetRecoveryHref(projectId: string, search: string) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error('Invalid Firebase project ID.');
  const continuation = new URL(accountContinuationHref(search), 'https://dusaccom.web.app');
  continuation.searchParams.set('mode', 'reset');
  continuation.searchParams.set('resetSent', '1');
  const recovery = new URL(`https://${projectId}.firebaseapp.com/__reset-password/`);
  recovery.searchParams.set('continueUrl', continuation.href);
  return recovery.href;
}
