'use client';

import { UserRound } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getFirebase } from '@/lib/firebase';
import { accountCopy, accountError } from '@/lib/account-copy';
import { teamCopy } from '@/lib/team-copy';
import { accountSettingsCopy } from '@/lib/account-settings-copy';
import { membershipAccountCopy } from '@/lib/membership-account-copy';
import { translations } from '@/lib/translations';
import { accountHref, accountHrefForContext } from '@/lib/account-navigation';
import styles from './profile-menu.module.css';

export function ProfileMenu({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { user, isAdmin, canManageAdmins, accountEmail, membershipProfile, loading } = useAuth();
  const { lang } = useLanguage();
  const t = accountCopy[lang];
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signInHref, setSignInHref] = useState(accountHref());
  const [signUpHref, setSignUpHref] = useState(accountHref({ mode: 'signup' }));
  const name = user?.displayName?.trim() || accountEmail || t.guest;
  const initial = Array.from(name)[0]?.toLocaleUpperCase(lang) || '';

  function changeOpen(next: boolean) {
    if (next) {
      setSignInHref(accountHrefForContext(window.location, 'signin'));
      setSignUpHref(accountHrefForContext(window.location, 'signup'));
    }
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
    <button ref={trigger} type="button" className="header-profile hover-scale" data-signed-in={Boolean(user)}
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
        {user && membershipProfile && <dl className={styles.membership}>
          {membershipProfile.company && <div><dt>{membershipAccountCopy[lang].organization}</dt><dd>{membershipProfile.company}</dd></div>}
          <div><dt>{membershipAccountCopy[lang].pathway}</dt><dd>{translations[lang].membershipTiers.find(tier => tier.id === membershipProfile.membershipTier)?.name}</dd></div>
          <div><dt>{membershipAccountCopy[lang].applicationStatus}</dt><dd>{membershipAccountCopy[lang].submitted}</dd></div>
        </dl>}
        {user ? <div className={styles.actions}>
          <a href="/account/?settings=profile" className={`${styles.action} hover-scale`} onClick={() => changeOpen(false)}>{accountSettingsCopy[lang].title}</a>
          <button type="button" className={`${styles.action} hover-scale`} disabled={busy} onClick={logout}>{busy ? t.working : t.signOut}</button>
        </div> : <div className={styles.actions}>
          <a href={signInHref} className={`${styles.action} hover-scale`} onClick={() => changeOpen(false)}>{t.signIn}</a>
          <a href={signUpHref} className={`${styles.secondary} hover-scale`} onClick={() => changeOpen(false)}>{t.signUp}</a>
        </div>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </>}
    </section>
  </div>;
}
