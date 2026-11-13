'use client';

import { useId, useState, type FormEvent } from 'react';
import { getFirebase } from '@/lib/firebase';
import { createMembershipAccount, signInForMembership } from '@/lib/membership-account';
import { teamCopy } from '@/lib/team-copy';
import { useLanguage } from '@/lib/language-context';
import { accountCopy, accountError } from '@/lib/account-copy';
import { membershipAccountCopy } from '@/lib/membership-account-copy';
import { ConfirmationDialog } from './confirmation-dialog';
import styles from './account.module.css';

export function MembershipAccountDialog({ email, name, onCancel, onComplete }: {
  email: string; name: string; onCancel: () => void; onComplete: (created: boolean) => void;
}) {
  const { lang } = useLanguage();
  const t = membershipAccountCopy[lang];
  const a = accountCopy[lang];
  const id = useId();
  const [mode, setMode] = useState<'offer' | 'signup' | 'signin'>('offer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [teamLogin, setTeamLogin] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));
    setError('');
    if (mode === 'signup' && password !== data.get('confirmation')) { setError(t.mismatch); return; }
    setBusy(true);
    try {
      const { auth } = getFirebase();
      auth.languageCode = lang;
      if (mode === 'signup') {
        await createMembershipAccount({ agreeToCreateAccount: true, email: email.trim(), password,
          name: String(data.get('name')), confirmation: String(data.get('confirmation')) }, lang);
      } else await signInForMembership(email, password, String(data.get('username') || ''));
      onComplete(mode === 'signup');
    } catch (error) {
      setError(error instanceof Error && error.message === 'team/invalid-login' ? teamCopy[lang].invalid : accountError(error, lang));
      if ((error as { code?: string }).code === 'auth/email-already-in-use') setMode('signin');
    } finally { setBusy(false); }
  }
  return <ConfirmationDialog open title={mode === 'offer' ? t.title : mode === 'signup' ? t.signupTitle : t.signinTitle}
    description={mode === 'offer' ? t.question : t.hint} busy={busy} cancelLabel={mode === 'offer' ? t.cancel : undefined} onCancel={onCancel}>
    <p><strong>{email}</strong></p>
    {mode === 'offer' ? <div className={styles.form}>
      <button type="button" className={styles.primary} onClick={() => setMode('signup')}>{t.create}</button>
      <button type="button" className={styles.secondary} onClick={() => setMode('signin')}>{t.signIn}</button>
    </div> : <form key={mode} className={styles.form} onSubmit={submit}>
      <fieldset disabled={busy} className={styles.form}>
        {mode === 'signup' && <label htmlFor={`${id}-name`}>{a.name}<input id={`${id}-name`} name="name" defaultValue={name} autoComplete="name" required minLength={2} maxLength={100} /></label>}
        <label htmlFor={`${id}-email`}>{a.email}<input id={`${id}-email`} value={email} type="email" autoComplete="username" readOnly /></label>
        {mode === 'signin' && <label className={styles.teamToggle}><input type="checkbox" checked={teamLogin} onChange={event => setTeamLogin(event.target.checked)} />{teamCopy[lang].useUsername}</label>}
        {mode === 'signin' && teamLogin && <label htmlFor={`${id}-username`}>{teamCopy[lang].username}<input id={`${id}-username`} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_-]{2,23}" /></label>}
        <label htmlFor={`${id}-password`}>{a.password}<input id={`${id}-password`} name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : undefined} maxLength={128} /></label>
        {mode === 'signup' && <label htmlFor={`${id}-confirmation`}>{t.confirmPassword}<input id={`${id}-confirmation`} name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>}
        <button className={styles.primary}>{busy ? a.working : mode === 'signup' ? t.createSubmit : t.signinSubmit}</button>
        <button type="button" className={styles.secondary} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>{mode === 'signup' ? t.signIn : t.create}</button>
      </fieldset>
      {mode === 'signin' && <a className={styles.secondary} href="/account/?mode=reset" target="_blank" rel="noopener noreferrer">{a.forgot}</a>}
    </form>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </ConfirmationDialog>;
}
