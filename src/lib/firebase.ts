import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);

// Lazy initialization keeps builds and unconfigured deployments usable.
export function getFirebase() {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.');
  const app = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}

// A separate guest identity protects inquiry ownership without replacing the
// member/admin sign-in session or creating an account for every page visitor.
export function getInquiryFirebase() {
  if (!firebaseConfigured) throw new Error('Firebase is not configured.');
  const app = getApps().find(app => app.name === 'inquiries') || initializeApp(config, 'inquiries');
  return { auth: getAuth(app), db: getFirestore(app) };
}
