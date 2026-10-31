'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onIdTokenChanged, reload, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from './firebase';
import { adminAccess } from './admin-access';

type AuthState = { user: User | null; isAdmin: boolean; canManageAdmins: boolean; accountEmail: string | null; parentUid: string | null; loading: boolean };
const initialState: AuthState = { user: null, isAdmin: false, canManageAdmins: false, accountEmail: null, parentUid: null, loading: true };
const AuthContext = createContext<AuthState & { refreshAccount: () => Promise<void> }>({ ...initialState, refreshAccount: async () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const refreshAccount = useCallback(async () => {
    const user = getFirebase().auth.currentUser;
    if (!user) return;
    await reload(user);
    await user.getIdToken(true);
    setState(previous => previous.user?.uid === user.uid ? { ...previous, user, accountEmail: previous.parentUid ? previous.accountEmail : user.email } : previous);
  }, []);
  useEffect(() => {
    if (!firebaseConfigured) { setState({ ...initialState, loading: false }); return; }
    const { auth, db } = getFirebase();
    let stopRole: (() => void) | undefined;
    let stopParent: (() => void) | undefined;
    let session = 0;
    let roleRevision = 0;
    const stopAuth = onIdTokenChanged(auth, user => {
      const currentSession = ++session;
      stopRole?.();
      stopParent?.();
      stopParent = undefined;
      let parentUid: string | null = null;
      let knownDelegate = false;
      const updateAccess = (access = adminAccess(), accountEmail = user?.email ?? null) => {
        if (session === currentSession) setState({ user, ...access, accountEmail, parentUid, loading: false });
      };
      setState(previous => user && previous.user?.uid === user.uid ? { ...previous, user } :
        { user, isAdmin: false, canManageAdmins: false, accountEmail: user?.email ?? null, parentUid: null, loading: Boolean(user) });
      if (user) stopRole = onSnapshot(doc(db, 'admins', user.uid), snapshot => {
        if (session !== currentSession) return;
        const currentRole = ++roleRevision;
        stopParent?.();
        stopParent = undefined;
        const role = snapshot.data();
        if (knownDelegate && !snapshot.exists()) { void signOut(auth); return; }
        parentUid = typeof role?.parentUid === 'string' ? role.parentUid : null;
        if (parentUid) knownDelegate = true;
        const accountEmail = parentUid && typeof role?.email === 'string' ? role.email : user.email;
        if (role?.enabled === true && typeof role.parentUid === 'string'
          && role.parentUid.length > 0 && role.parentUid !== user.uid) {
          setState(previous => previous.user?.uid === user.uid && !previous.loading ? { ...previous, user, accountEmail, parentUid } :
            { user, isAdmin: false, canManageAdmins: false, accountEmail, parentUid, loading: true });
          stopParent = onSnapshot(doc(db, 'admins', role.parentUid), parent => {
            if (currentRole === roleRevision) updateAccess(adminAccess(role, parent.data()), accountEmail);
          }, () => { if (currentRole === roleRevision) updateAccess(adminAccess(), accountEmail); });
        } else updateAccess(adminAccess(role), accountEmail);
      }, () => { ++roleRevision; stopParent?.(); updateAccess(); });
    }, () => { ++session; stopRole?.(); stopParent?.(); setState({ ...initialState, loading: false }); });
    return () => { ++session; stopAuth(); stopRole?.(); stopParent?.(); };
  }, []);
  return <AuthContext.Provider value={{ ...state, refreshAccount }}>{children}</AuthContext.Provider>;
}
