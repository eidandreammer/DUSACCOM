'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from './firebase';
import { adminAccess } from './admin-access';

type AuthState = { user: User | null; isAdmin: boolean; canManageAdmins: boolean; accountEmail: string | null; loading: boolean };
const initialState: AuthState = { user: null, isAdmin: false, canManageAdmins: false, accountEmail: null, loading: true };
const AuthContext = createContext<AuthState>(initialState);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  useEffect(() => {
    if (!firebaseConfigured) { setState({ ...initialState, loading: false }); return; }
    const { auth, db } = getFirebase();
    let stopRole: (() => void) | undefined;
    let stopParent: (() => void) | undefined;
    let session = 0;
    let roleRevision = 0;
    const stopAuth = onAuthStateChanged(auth, user => {
      const currentSession = ++session;
      stopRole?.();
      stopParent?.();
      stopParent = undefined;
      const updateAccess = (access = adminAccess(), accountEmail = user?.email ?? null) => {
        if (session === currentSession) setState({ user, ...access, accountEmail, loading: false });
      };
      setState({ user, isAdmin: false, canManageAdmins: false, accountEmail: user?.email ?? null, loading: Boolean(user) });
      if (user) stopRole = onSnapshot(doc(db, 'admins', user.uid), snapshot => {
        if (session !== currentSession) return;
        const currentRole = ++roleRevision;
        stopParent?.();
        stopParent = undefined;
        const role = snapshot.data();
        const accountEmail = typeof role?.email === 'string' ? role.email : user.email;
        if (role?.enabled === true && typeof role.parentUid === 'string'
          && role.parentUid.length > 0 && role.parentUid !== user.uid) {
          setState({ user, isAdmin: false, canManageAdmins: false, accountEmail, loading: true });
          stopParent = onSnapshot(doc(db, 'admins', role.parentUid), parent => {
            if (currentRole === roleRevision) updateAccess(adminAccess(role, parent.data()), accountEmail);
          }, () => { if (currentRole === roleRevision) updateAccess(adminAccess(), accountEmail); });
        } else updateAccess(adminAccess(role), accountEmail);
      }, () => { ++roleRevision; stopParent?.(); updateAccess(); });
    }, () => { ++session; stopRole?.(); stopParent?.(); setState({ ...initialState, loading: false }); });
    return () => { ++session; stopAuth(); stopRole?.(); stopParent?.(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
