'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { firebaseConfigured, getFirebase } from '@/lib/firebase';
import { accountCopy, accountError } from '@/lib/account-copy';
import { site } from '@/lib/site';
import { teamLoginEmail } from '@/lib/team-login';
import { teamCopy } from '@/lib/team-copy';
import { DelegatedAdminManager } from '@/components/delegated-admin-manager';
import { AccountSettings } from '@/components/account-settings';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import styles from '@/components/account.module.css';

export default function AccountPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const { user, isAdmin, canManageAdmins, accountEmail, loading } = useAuth();
  const id = useId();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [teamLogin, setTeamLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'signup') setMode('signup');
  }, []);
  function changeMode(next: typeof mode) { setMode(next); if (next === 'signup') setTeamLogin(false); setError(''); setMessage(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password') || '');
    const username = String(data.get('username') || '').trim();
    setBusy(true); setError(''); setMessage('');
    try {
      const { auth } = getFirebase();
      const loginEmail = mode !== 'signup' && username ? teamLoginEmail(email, username) : email;
      auth.languageCode = lang;
      if (mode === 'reset') { await sendPasswordResetEmail(auth, loginEmail, { url: `${site.url}/account/` }); setMessage(t.resetSent); }
      else if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: String(data.get('name')).trim() });
      } else await signInWithEmailAndPassword(auth, loginEmail, password);
      if (mode !== 'reset') router.replace('/#events');
    } catch (error) { setError(error instanceof Error && error.message === 'team/invalid-login' ? teamCopy[lang].invalid : accountError(error, lang)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await signOut(getFirebase().auth); } catch (error) { setError(accountError(error, lang)); }
    finally { setBusy(false); }
  }
  return <section className={styles.page}>
    <div className={styles.panel}>
      <h1>{t.title}</h1><p>{t.description}</p>
      {!firebaseConfigured ? <p role="status">{t.unavailable}</p> : loading ? <p role="status">{t.working}</p> : user ? <>
        <p>{t.signedIn} <strong>{user.displayName || accountEmail}</strong></p>
        <span className={styles.badge}>{isAdmin ? canManageAdmins ? t.admin : teamCopy[lang].delegated : t.member}</span>
        {canManageAdmins && <a className={styles.secondary} href="#administrator-team">{teamCopy[lang].manage}</a>}
        <Link className={styles.primary} href="/#events">{t.calendar}</Link>
        <button type="button" className={styles.secondary} disabled={busy} onClick={logout}>{t.signOut}</button>
      </> : <>
        <div className={styles.tabs}>
          <button type="button" aria-pressed={mode === 'signin'} disabled={busy} onClick={() => changeMode('signin')}>{t.signIn}</button>
          <button type="button" aria-pressed={mode === 'signup'} disabled={busy} onClick={() => changeMode('signup')}>{t.signUp}</button>
        </div>
        <form onSubmit={submit} className={styles.form}>
          {mode === 'signup' && <label htmlFor={`${id}-name`}>{t.name}<input id={`${id}-name`} name="name" autoComplete="name" required maxLength={100} /></label>}
          <label htmlFor={`${id}-email`}>{t.email}<input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          {mode !== 'signup' && <label className={styles.teamToggle}><input type="checkbox" checked={teamLogin} onChange={event => setTeamLogin(event.target.checked)} />{teamCopy[lang].useUsername}</label>}
          {mode !== 'signup' && teamLogin && <label htmlFor={`${id}-username`}>{teamCopy[lang].username}<input id={`${id}-username`} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
            required minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_-]{2,23}" aria-describedby={`${id}-username-hint`} />
            <span id={`${id}-username-hint`} className={styles.hint}>{teamCopy[lang].signInHint}</span></label>}
          {mode !== 'reset' && <label htmlFor={`${id}-password`}>{t.password}<input id={`${id}-password`} name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : undefined} maxLength={128} /></label>}
          <button className={styles.primary} disabled={busy}>{busy ? t.working : mode === 'signup' ? t.signUp : mode === 'reset' ? t.reset : t.signIn}</button>
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'signin' : 'reset')}>{mode === 'reset' ? t.back : t.forgot}</button>
        </form>
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
    {user && !loading && <AccountSettings key={user.uid} onDeleted={() => { setError(''); setMessage(accountSettingsCopy[lang].deleted); }} />}
    <DelegatedAdminManager />
  </section>;
}
