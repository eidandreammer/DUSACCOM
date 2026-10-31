'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { accountCopy, accountError } from '@/lib/account-copy';
import { teamCopy } from '@/lib/team-copy';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import styles from './profile-menu.module.css';

export function ProfileMenu({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { user, isAdmin, canManageAdmins, accountEmail, parentUid, loading } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = user?.displayName?.trim() || accountEmail || t.guest;
  const initial = Array.from(name)[0]?.toLocaleUpperCase(lang) || '';

  function changeOpen(next: boolean) {
    setOpen(next);
    onOpenChange(next);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); onOpenChange(false); };
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { close(); trigger.current?.focus(); }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, onOpenChange]);

  async function logout() {
    setBusy(true); setError('');
    try {
      await signOut(getFirebase().auth);
      changeOpen(false);
      trigger.current?.focus();
    } catch (error) { setError(accountError(error, lang)); }
    finally { setBusy(false); }
  }

  return <div className={styles.wrapper} ref={wrapper}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) changeOpen(false); }}>
    <button ref={trigger} type="button" className="header-profile" data-signed-in={Boolean(user)}
      aria-label={user ? `${t.account}: ${name}` : t.account} aria-expanded={open} aria-controls={`${id}-profile`}
      onClick={() => changeOpen(!open)}>
      {user && initial ? <span aria-hidden="true">{initial}</span> : <UserRound size={21} aria-hidden="true" />}
    </button>
    <section id={`${id}-profile`} hidden={!open} className={styles.card} aria-labelledby={`${id}-name`}>
      <h2 id={`${id}-name`}>{loading ? t.account : name}</h2>
      {loading ? <p role="status">{t.working}</p> : <>
        {accountEmail && <p className={styles.email}>{accountEmail}</p>}
        <p className={styles.status}>{t.status}: <strong>{user ? t.statusSignedIn : t.statusSignedOut}</strong></p>
        {user && <span className={styles.badge}>{isAdmin ? canManageAdmins ? t.admin : teamCopy[lang].delegated : t.member}</span>}
        {user ? <div className={styles.actions}>
          <a href="/account/?settings=profile" className={styles.action} onClick={() => changeOpen(false)}>{accountSettingsCopy[lang].title}</a>
          <a href="/account/?settings=password" className={styles.secondary} onClick={() => changeOpen(false)}>{accountSettingsCopy[lang].password}</a>
          <a href="/account/?settings=email" className={styles.secondary} onClick={() => changeOpen(false)}>{accountSettingsCopy[lang].email}</a>
          {canManageAdmins && <a href="/account/?settings=team" className={styles.action} onClick={() => changeOpen(false)}>{teamCopy[lang].manage}</a>}
          <a href="/account/?settings=delete" className={styles.danger} onClick={() => changeOpen(false)}>{parentUid ? accountSettingsCopy[lang].requestDeletion : accountSettingsCopy[lang].deleteAccount}</a>
          <button type="button" className={styles.action} disabled={busy} onClick={logout}>{busy ? t.working : t.signOut}</button>
        </div> : <div className={styles.actions}>
          <Link href="/account" className={styles.action} onClick={() => changeOpen(false)}>{t.signIn}</Link>
          <Link href="/account?mode=signup" className={styles.secondary} onClick={() => changeOpen(false)}>{t.signUp}</Link>
        </div>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </>}
    </section>
  </div>;
}
