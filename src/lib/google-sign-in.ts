'use client';
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, type UserCredential } from 'firebase/auth';
import { getFirebase } from './firebase';
import { FIREBASE_LANG } from './language-context';
import type { Lang } from './translations';

// Popup first (keeps the visitor on the page); fall back to a full-page redirect
// when the browser blocks popups or doesn't support them (some in-app browsers).
export async function signInWithGoogle(lang: Lang): Promise<UserCredential | null> {
  const { auth } = getFirebase();
  auth.languageCode = FIREBASE_LANG[lang];
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try { return await signInWithPopup(auth, provider); }
  catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export function completeGoogleRedirect() { return getRedirectResult(getFirebase().auth); }

export function googleCancelled(error: unknown) {
  const code = (error as { code?: string }).code;
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled';
}
