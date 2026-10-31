'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { createDelegatedAdmin, setDelegatedAdminEnabled } from '@/lib/delegated-admins';
import { delegatedAdminInput, supportsSharedMailbox, teamLoginEmail } from '@/lib/team-login';
import { teamCopy, teamError } from '@/lib/team-copy';
import { accountSettingsCopy, settingsError } from '@/lib/account-settings-copy';
import { declineDelegateDeletion, deleteDelegateAccount } from '@/lib/account-management';
import { useAccountDeletion } from '@/lib/use-account-deletion';
import { ConfirmationDialog } from './confirmation-dialog';
import accountStyles from './account.module.css';
import styles from './delegated-admin-manager.module.css';

type Delegate = { uid: string; displayName: string; username: string; email: string; enabled: boolean };

export function DelegatedAdminManager() {
  const { user, canManageAdmins } = useAuth();
  const { lang } = useLanguage();
  const t = teamCopy[lang];
  const settings = accountSettingsCopy[lang];
  const deletionEnabled = useAccountDeletion();
  const id = useId();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingUid, setSavingUid] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<Record<string, string>>({});
  const [requestsFailed, setRequestsFailed] = useState(false);
  const [deleting, setDeleting] = useState<Delegate | null>(null);

  useEffect(() => {
    setDelegates([]); setLoading(true); setLoadError(false);
    if (!user || !canManageAdmins) { setLoading(false); return; }
    const db = getFirebase().db;
    const stopTeam = onSnapshot(query(collection(db, 'admins'), where('parentUid', '==', user.uid), limit(500)), snapshot => {
      setDelegates(snapshot.docs.map(doc => ({ uid: doc.id, displayName: doc.data().displayName,
        username: doc.data().username, email: doc.data().email, enabled: doc.data().enabled === true })));
      setLoading(false); setLoadError(false);
    }, () => { setDelegates([]); setLoading(false); setLoadError(true); });
    const stopRequests = deletionEnabled ? onSnapshot(query(collection(db, 'accountDeletionRequests'), where('parentUid', '==', user.uid), limit(500)), snapshot => {
      setRequests(Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc.data().status]))); setRequestsFailed(false);
    }, () => { setRequests({}); setRequestsFailed(true); }) : () => {};
    let frame = 0;
    if (new URLSearchParams(window.location.search).get('settings') === 'team') frame = requestAnimationFrame(() => document.getElementById('administrator-team')?.scrollIntoView({ block: 'start' }));
    return () => { stopTeam(); stopRequests(); cancelAnimationFrame(frame); };
  }, [user, canManageAdmins, deletionEnabled]);

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
  async function remove() {
    if (!deleting || savingUid) return;
    setSavingUid(deleting.uid); setError(''); setMessage('');
    try { await deleteDelegateAccount(deleting.uid); setDeleting(null); setMessage(settings.delegateDeleted); }
    catch (error) { setError(settingsError(error, lang)); }
    finally { setSavingUid(''); }
  }
  async function decline(delegate: Delegate) {
    setSavingUid(delegate.uid); setError(''); setMessage('');
    try { await declineDelegateDeletion(delegate.uid); setMessage(settings.requestDeclined); }
    catch (error) { setError(settingsError(error, lang)); }
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
          <div className={styles.identity}><h3>{delegate.displayName}</h3><p>@{delegate.username} · {delegate.enabled ? t.active : t.disabled}</p><p>{delegate.email}</p>
            {requests[delegate.uid] === 'pending' && <p className={styles.requestBadge}>{settings.requestBadge}</p>}</div>
          <div className={styles.actions}>
            <button type="button" disabled={busy || Boolean(savingUid)} onClick={() => toggle(delegate)}
              aria-label={`${delegate.enabled ? t.disable : t.enable}: ${delegate.displayName}`}>
              {savingUid === delegate.uid ? t.saving : delegate.enabled ? t.disable : t.enable}
            </button>
            <button type="button" className={styles.deleteButton} disabled={!deletionEnabled || busy || Boolean(savingUid)} aria-haspopup="dialog"
              onClick={() => { setError(''); setDeleting(delegate); }}>
              {requests[delegate.uid] === 'pending' ? settings.approve : requests[delegate.uid] === 'approved' ? settings.retryDelete : settings.deleteAccount}
            </button>
            {requests[delegate.uid] === 'pending' && <button type="button" disabled={busy || Boolean(savingUid)} onClick={() => decline(delegate)}>{settings.decline}</button>}
          </div>
        </li>)}</ul>}
    </div>
    {(!deletionEnabled || requestsFailed) && <p role="status" className={accountStyles.hint}>{settings.unavailable}</p>}
    {error && !deleting && <p role="alert" className={accountStyles.error}>{error}</p>}
    {message && <p role="status">{message}</p>}
    <ConfirmationDialog open={Boolean(deleting)} title={settings.delegateDeleteTitle} description={settings.delegateDeleteHint}
      busy={Boolean(savingUid)} onCancel={() => { if (!savingUid) { setDeleting(null); setError(''); } }}>
      <p><strong>{deleting?.displayName}</strong> · @{deleting?.username}</p>
      <button type="button" className={accountStyles.primary} disabled={Boolean(savingUid)} onClick={remove}>{savingUid ? settings.deleting : settings.confirm}</button>
      {error && <p role="alert" className={accountStyles.error}>{error}</p>}
    </ConfirmationDialog>
  </section>;
}
