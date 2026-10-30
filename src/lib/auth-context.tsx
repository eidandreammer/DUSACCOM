'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from './firebase';

type AuthState = { user: User | null; isAdmin: boolean; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });
  useEffect(() => {
    if (!firebaseConfigured) { setState({ user: null, isAdmin: false, loading: false }); return; }
    const { auth, db } = getFirebase();
    let stopRole: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopRole?.();
      setState({ user, isAdmin: false, loading: false });
      if (user) stopRole = onSnapshot(doc(db, 'admins', user.uid), snapshot => {
        setState({ user, isAdmin: snapshot.data()?.enabled === true, loading: false });
      }, () => setState({ user, isAdmin: false, loading: false }));
    }, () => setState({ user: null, isAdmin: false, loading: false }));
    return () => { stopAuth(); stopRole?.(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
