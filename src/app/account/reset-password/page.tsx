'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { signOut, verifyPasswordResetCode } from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';
import { useLanguage } from '@/lib/language-context';
import { accountContinuationHref } from '@/lib/account-navigation';
import styles from '@/components/account.module.css';

export default function ResetPasswordPage() {
  const { lang, setLang } = useLanguage();
  const code = useRef('');
  const verifiedEmail = useRef('');
  const continuation = useRef('/account/');
  const parameters = useRef<URLSearchParams | null>(null);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = lang === 'es' ? {
    title: 'Restablece tu contraseña de DUSACCOM', checking: 'Verificando el enlace seguro…',
    hint: 'Elige una nueva contraseña. Te enviaremos un aviso de seguridad después de completar el cambio.',
    password: 'Nueva contraseña', confirm: 'Confirma la nueva contraseña', submit: 'Guardar nueva contraseña', saving: 'Guardando…',
    invalid: 'Este enlace no es válido, ya fue usado o ha expirado. Solicita un nuevo enlace.', request: 'Solicitar otro enlace',
    mismatch: 'Las contraseñas no coinciden.', weak: 'Usa entre 8 y 128 caracteres y cumple los requisitos de contraseña.',
    failed: 'No se pudo completar el cambio. Inténtalo nuevamente.', limited: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    done: 'Tu contraseña fue cambiada. Enviaremos un aviso de seguridad a tu correo. Inicia sesión con la nueva contraseña.', signin: 'Iniciar sesión',
  } : {
    title: 'Reset your DUSACCOM password', checking: 'Checking your secure link…',
    hint: 'Choose a new password. We will send a security notice after the change is completed.',
    password: 'New password', confirm: 'Confirm new password', submit: 'Save new password', saving: 'Saving…',
    invalid: 'This link is invalid, already used, or expired. Request a new link.', request: 'Request another link',
    mismatch: 'The passwords do not match.', weak: 'Use 8–128 characters and meet the password requirements.',
    failed: 'The change could not be completed. Please try again.', limited: 'Too many attempts. Wait a few minutes before trying again.',
    done: 'Your password was changed. A security notice will be sent to your email. Sign in with your new password.', signin: 'Sign in',
  };
  useEffect(() => {
    const params = parameters.current ||= new URLSearchParams(window.location.search);
    code.current = params.get('oobCode') || '';
    // Remove the code from the address bar before subsequent navigation.
    window.history.replaceState(null, '', window.location.pathname);
    if (params.get('lang') === 'es' || params.get('lang') === 'en') setLang(params.get('lang') as 'en' | 'es');
    try {
      const url = new URL(params.get('continueUrl') || 'https://dusaccnj.org/account/');
      if (url.origin === 'https://dusaccnj.org' && url.pathname === '/account/') continuation.current = accountContinuationHref(url.search);
    } catch { /* use the safe account destination */ }
    if (params.get('mode') !== 'resetPassword' || !code.current) { setState('invalid'); return; }
    let active = true;
    verifyPasswordResetCode(getFirebase().auth, code.current).then(email => { if (active) { verifiedEmail.current = email; setState('ready'); } }, () => { if (active) setState('invalid'); });
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('password') !== data.get('confirmation')) { setError(t.mismatch); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account-email/complete-password-reset', {
        method: 'POST', credentials: 'omit', redirect: 'error', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.current, password: String(data.get('password')), lang, operationId: crypto.randomUUID() }), signal: AbortSignal.timeout(60000),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (response.ok && result.ok) {
        code.current = ''; form.reset();
        const { auth } = getFirebase();
        if (auth.currentUser?.email?.toLowerCase() === verifiedEmail.current.toLowerCase()) await signOut(auth).catch(() => {});
        setState('done');
      }
      else if (result.error === 'account/invalid-code') setState('invalid');
      else setError(result.error === 'account/invalid-password' ? t.weak : response.status === 429 ? t.limited : t.failed);
    } catch { setError(t.failed); }
    finally { setBusy(false); }
  }
  return <section className={styles.page}><div className={styles.panel}>
    <h1>{t.title}</h1>
    {state === 'checking' && <p role="status">{t.checking}</p>}
    {state === 'invalid' && <><p role="alert">{t.invalid}</p><a className={styles.primary} href="/account/?mode=reset">{t.request}</a></>}
    {state === 'done' && <><p role="status">{t.done}</p><a className={styles.primary} href={continuation.current}>{t.signin}</a></>}
    {state === 'ready' && <><p>{t.hint}</p><form className={styles.form} onSubmit={submit}><fieldset className={styles.form} disabled={busy}>
      <label htmlFor="reset-password">{t.password}<input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      <label htmlFor="reset-confirmation">{t.confirm}<input id="reset-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      <button className={styles.primary}>{busy ? t.saving : t.submit}</button>
    </fieldset></form></>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div></section>;
}
