'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { createDelegatedAdmin, setDelegatedAdminEnabled } from '@/lib/delegated-admins';
import { delegatedAdminInput, supportsSharedMailbox, teamLoginEmail } from '@/lib/team-login';
import { teamCopy, teamError } from '@/lib/team-copy';
import accountStyles from './account.module.css';
import styles from './delegated-admin-manager.module.css';

type Delegate = { uid: string; displayName: string; username: string; enabled: boolean };

export function DelegatedAdminManager() {
  const { user, canManageAdmins } = useAuth();
  const { lang } = useLanguage();
  const t = teamCopy[lang];
  const id = useId();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingUid, setSavingUid] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDelegates([]); setLoading(true); setLoadError(false);
    if (!user || !canManageAdmins) { setLoading(false); return; }
    return onSnapshot(query(collection(getFirebase().db, 'admins'), where('parentUid', '==', user.uid), limit(500)), snapshot => {
      setDelegates(snapshot.docs.map(doc => ({ uid: doc.id, displayName: doc.data().displayName,
        username: doc.data().username, enabled: doc.data().enabled === true })));
      setLoading(false); setLoadError(false);
    }, () => { setDelegates([]); setLoading(false); setLoadError(true); });
  }, [user, canManageAdmins]);

  if (!user || !canManageAdmins) return null;
  const sharedEmail = user.email || '';
  const supported = supportsSharedMailbox(sharedEmail);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const values = delegatedAdminInput.safeParse(Object.fromEntries(fields));
    setError(''); setMessage('');
    if (!values.success) { setError(t.invalid); return; }
    try { teamLoginEmail(sharedEmail, values.data.username); }
    catch { setError(t.invalid); return; }
    setBusy(true);
    try { await createDelegatedAdmin(values.data); form.reset(); setMessage(t.created); }
    catch (error) { setError(teamError(error, lang)); }
    finally { setBusy(false); }
  }
  async function toggle(delegate: Delegate) {
    setSavingUid(delegate.uid); setError(''); setMessage('');
    try { await setDelegatedAdminEnabled(delegate.uid, !delegate.enabled); setMessage(t.saved); }
    catch (error) { setError(teamError(error, lang)); }
    finally { setSavingUid(''); }
  }

  return <section id="administrator-team" className={styles.panel} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.title}</h2>
    <p>{t.description}</p>
    <p className={accountStyles.hint}>{t.mailboxHint}</p>
    {supported ? <form className={accountStyles.form} onSubmit={create} aria-busy={busy}>
      <label htmlFor={`${id}-email`}>{t.sharedEmail}<input id={`${id}-email`} type="email" value={sharedEmail} readOnly /></label>
      <label htmlFor={`${id}-name`}>{t.name}<input id={`${id}-name`} name="displayName" autoComplete="off" minLength={2} maxLength={100} required /></label>
      <label htmlFor={`${id}-username`}>{t.username}<input id={`${id}-username`} name="username" autoComplete="off" autoCapitalize="none" spellCheck={false}
        pattern="[A-Za-z][A-Za-z0-9_-]{2,23}" minLength={3} maxLength={24} aria-describedby={`${id}-username-hint`} required />
        <span id={`${id}-username-hint`} className={accountStyles.hint}>{t.usernameHint}</span></label>
      <label htmlFor={`${id}-password`}>{t.password}<input id={`${id}-password`} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      <button className={accountStyles.primary} disabled={busy || Boolean(savingUid)}>{busy ? t.creating : t.create}</button>
    </form> : <p role="status">{t.unsupported}</p>}
    <div className={styles.team} aria-busy={loading}>
      {loading ? <p role="status">{t.loading}</p> : loadError ? <p role="alert" className={accountStyles.error}>{t.loadFailed}</p> : delegates.length === 0 ? <p>{t.empty}</p> :
        <ul>{[...delegates].sort((a, b) => a.displayName.localeCompare(b.displayName, lang)).map(delegate => <li key={delegate.uid}>
          <div><h3>{delegate.displayName}</h3><p>@{delegate.username} · {delegate.enabled ? t.active : t.disabled}</p></div>
          <button type="button" disabled={busy || Boolean(savingUid)} onClick={() => toggle(delegate)}
            aria-label={`${delegate.enabled ? t.disable : t.enable}: ${delegate.displayName}`}>
            {savingUid === delegate.uid ? t.saving : delegate.enabled ? t.disable : t.enable}
          </button>
        </li>)}</ul>}
    </div>
    {error && <p role="alert" className={accountStyles.error}>{error}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
