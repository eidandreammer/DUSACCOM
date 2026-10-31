'use client';

import { useId, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { accountCopy, accountError } from '@/lib/account-copy';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import { teamCopy } from '@/lib/team-copy';
import { accountHref } from '@/lib/account-navigation';
import styles from './footer-account.module.css';

export function FooterAccount() {
  const { user, canManageAdmins, parentUid } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const settings = accountSettingsCopy[lang];
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(getFirebase().auth); }
    catch (error) { setError(accountError(error, lang)); }
    finally { setBusy(false); }
  }
  return <section className={`sm:col-span-2 lg:col-span-1 ${styles.account}`} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{t.account}</h2>
    <nav className={styles.actions} aria-label={t.account}>
      {user ? <>
        <a href={accountHref({ settings: 'profile' })}>{settings.title}</a>
        <a href={accountHref({ settings: 'password' })}>{settings.password}</a>
        <a href={accountHref({ settings: 'email' })}>{settings.email}</a>
        {canManageAdmins && <a href={accountHref({ settings: 'team' })}>{teamCopy[lang].manage}</a>}
        <a href={accountHref({ settings: 'delete' })}>{parentUid ? settings.requestDeletion : settings.deleteAccount}</a>
        <button type="button" disabled={busy} onClick={logout}>{busy ? t.working : t.signOut}</button>
      </> : <>
        <a href={accountHref()}>{t.signIn}</a>
        <a href={accountHref({ mode: 'signup' })}>{t.signUp}</a>
      </>}
    </nav>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </section>;
}
