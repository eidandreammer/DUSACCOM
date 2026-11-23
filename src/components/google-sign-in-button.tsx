'use client';
import { useState } from 'react';
import { accountCopy, accountError } from '@/lib/account-copy';
import { googleCancelled, signInWithGoogle } from '@/lib/google-sign-in';
import { useLanguage } from '@/lib/language-context';
import styles from './account.module.css';

export function GoogleSignInButton({ onSignedIn, disabled }: { onSignedIn: () => void; disabled?: boolean }) {
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function go() {
    setBusy(true); setError('');
    try { if (await signInWithGoogle(lang)) onSignedIn(); }
    catch (caught) { if (!googleCancelled(caught)) setError(accountError(caught, lang)); }
    finally { setBusy(false); }
  }
  return <div className={styles.googleBlock}>
    <button type="button" className={styles.googleButton} disabled={busy || disabled} onClick={go}>
      <span className={styles.googleMark} aria-hidden="true">G</span>{busy ? t.working : t.google}
    </button>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p className={styles.divider}><span>{t.or}</span></p>
  </div>;
}
