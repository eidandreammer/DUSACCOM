'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { beginAccountDeletion, changeAccountEmail, changeAccountName, changeAccountPassword, finishAccountDeletion, requestDelegateDeletion } from '@/lib/account-management';
import { accountSettingsCopy, settingsError } from '@/lib/account-settings-copy';
import { useAccountDeletion } from '@/lib/use-account-deletion';
import { ConfirmationDialog } from './confirmation-dialog';
import { HoldToConfirm } from './hold-to-confirm';
import accountStyles from './account.module.css';
import styles from './account-settings.module.css';

export function AccountSettings({ onDeleted }: { onDeleted: () => void }) {
  const { user, parentUid, accountEmail, refreshAccount } = useAuth();
  const { lang } = useLanguage();
  const t = accountSettingsCopy[lang];
  const deletionEnabled = useAccountDeletion();
  const id = useId();
  const [section, setSection] = useState('profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get('settings');
    if (selected && ['profile', 'password', 'email', 'delete'].includes(selected)) {
      setSection(selected);
      if (selected === 'delete') setConfirming(true);
      const frame = requestAnimationFrame(() => panel.current?.scrollIntoView({ block: 'start' }));
      return () => cancelAnimationFrame(frame);
    }
  }, []);
  useEffect(() => {
    setRequestStatus('');
    if (!user || !parentUid || !deletionEnabled) return;
    return onSnapshot(doc(getFirebase().db, 'accountDeletionRequests', user.uid), snapshot => {
      setRequestStatus(snapshot.data()?.status || '');
    }, () => setRequestStatus(''));
  }, [user?.uid, parentUid, deletionEnabled]);
  if (!user) return null;

  async function save(event: FormEvent<HTMLFormElement>, action: 'profile' | 'password' | 'email') {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(''); setMessage('');
    if (action === 'password' && data.get('newPassword') !== data.get('confirmation')) { setError(t.mismatch); return; }
    setBusy(true);
    try {
      if (action === 'profile') { await changeAccountName(String(data.get('displayName'))); await refreshAccount(); setMessage(t.nameSaved); }
      else if (action === 'password') { await changeAccountPassword(String(data.get('currentPassword')), String(data.get('newPassword'))); await refreshAccount(); setMessage(t.passwordSaved); }
      else { await changeAccountEmail(String(data.get('currentPassword')), String(data.get('newEmail')), lang); setMessage(t.emailSent); }
      form.reset();
    } catch (error) { setError(settingsError(error, lang)); }
    finally { setBusy(false); }
  }
  function cancel() { if (!busy) { setConfirming(false); setConfirmation(''); setError(''); } }
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const password = String(new FormData(event.currentTarget).get('currentPassword'));
    try { const result = await beginAccountDeletion(password); setConfirmation(result.confirmation); }
    catch (error) { setError(settingsError(error, lang)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!confirmation || busy) return;
    setBusy(true); setError('');
    try { await finishAccountDeletion(confirmation); setConfirming(false); onDeleted(); }
    catch (error) { setError(settingsError(error, lang)); setConfirmation(''); }
    finally { setBusy(false); }
  }
  async function requestRemoval() {
    setBusy(true); setError('');
    try { const result = await requestDelegateDeletion(); setMessage(t.requested); setRequestStatus(result.status); setConfirming(false); }
    catch (error) { setError(settingsError(error, lang)); }
    finally { setBusy(false); }
  }
  const currentPassword = <label htmlFor={`${id}-${section}-current-password`}>{t.currentPassword}<input id={`${id}-${section}-current-password`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>;
  return <section ref={panel} id="account-settings" className={styles.panel} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.title}</h2>
    <details open={section === 'profile'}>
      <summary>{t.profile}</summary>
      <form className={accountStyles.form} onSubmit={event => save(event, 'profile')}>
        <fieldset disabled={busy} className={accountStyles.form}>
          <label htmlFor={`${id}-name`}>{t.name}<input id={`${id}-name`} name="displayName" defaultValue={user.displayName || ''} autoComplete="name" minLength={2} maxLength={100} required /></label>
          <button className={accountStyles.primary}>{busy ? t.saving : t.save}</button>
        </fieldset>
      </form>
    </details>
    <details open={section === 'password'}>
      <summary>{t.password}</summary>
      <form className={accountStyles.form} onSubmit={event => save(event, 'password')}>
        <fieldset disabled={busy} className={accountStyles.form}>
          <label htmlFor={`${id}-password-current`}>{t.currentPassword}<input id={`${id}-password-current`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>
          <label htmlFor={`${id}-new-password`}>{t.newPassword}<input id={`${id}-new-password`} name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
          <label htmlFor={`${id}-confirm-password`}>{t.confirmPassword}<input id={`${id}-confirm-password`} name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
          <button className={accountStyles.primary}>{busy ? t.saving : t.save}</button>
        </fieldset>
      </form>
    </details>
    <details open={section === 'email'}>
      <summary>{t.email}</summary>
      <p className={styles.hint}>{accountEmail}</p>
      {parentUid ? <p className={styles.hint}>{t.sharedEmailHint}</p> : <form className={accountStyles.form} onSubmit={event => save(event, 'email')}>
        <fieldset disabled={busy} className={accountStyles.form}>
          <label htmlFor={`${id}-email-current`}>{t.currentPassword}<input id={`${id}-email-current`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>
          <label htmlFor={`${id}-new-email`}>{t.newEmail}<input id={`${id}-new-email`} name="newEmail" type="email" autoComplete="email" required maxLength={254} /></label>
          <p className={styles.hint}>{t.emailHint}</p>
          <button className={accountStyles.primary}>{busy ? t.saving : t.save}</button>
        </fieldset>
      </form>}
    </details>
    {requestStatus === 'pending' || requestStatus === 'approved' ? <p className={styles.notice} role="status">{t.pending}</p> : <>
      {requestStatus === 'declined' && <p className={styles.notice}>{t.declined}</p>}
      <button type="button" className={styles.danger} aria-haspopup="dialog" disabled={busy} onClick={() => { setError(''); setConfirmation(''); setConfirming(true); }}>{parentUid ? t.requestDeletion : t.deleteAccount}</button>
    </>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {error && !confirming && <p role="alert" className={accountStyles.error}>{error}</p>}
    <ConfirmationDialog open={confirming} title={parentUid ? t.requestTitle : t.deleteTitle}
      description={parentUid ? t.requestHint : t.deleteHint} busy={busy} onCancel={cancel}>
      {!deletionEnabled ? <p role="status" className={styles.notice}>{t.unavailable}</p> : parentUid ? <button type="button" className={styles.danger} disabled={busy} onClick={requestRemoval}>{busy ? t.saving : t.requestDeletion}</button> :
        confirmation ? <HoldToConfirm busy={busy} onConfirm={remove} /> : <form className={accountStyles.form} onSubmit={prepare}>
          <fieldset disabled={busy}>
            <p className={styles.hint}>{t.verifyHint}</p>
            {currentPassword}
            <button className={accountStyles.primary} disabled={busy}>{busy ? t.saving : t.verify}</button>
          </fieldset>
        </form>}
      {error && <p role="alert" className={accountStyles.error}>{error}</p>}
    </ConfirmationDialog>
  </section>;
}
